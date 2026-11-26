(function () {
  'use strict';

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- Theme ---------------- */
  var root = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : mq.matches;
  }
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('theme', next);
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------- The sky ----------------
     Brush strokes follow a swirling flow field, painted in left to right on load,
     then 1,018 stars twinkle on top: one for each entry in Ulug‘bek’s catalogue. */
  var canvas = document.getElementById('sky');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAR_COUNT = 1018;
  var PAINT_MS = 1900;

  var W = 0, H = 0, dpr = 1, layer, lctx, strokes, stars, bigStars, drawn = 0;
  var startT = null, raf = 0, visible = true, firstPaint = true;

  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function setup() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    layer = document.createElement('canvas');
    layer.width = canvas.width;
    layer.height = canvas.height;
    lctx = layer.getContext('2d');
    lctx.scale(dpr, dpr);
    lctx.fillStyle = '#071032';
    lctx.fillRect(0, 0, W, H);

    var R = rng(1437);
    var M = Math.max(W, H);
    var centres = [
      { x: 0.66, y: 0.34, r: 0.20, s: 1 },
      { x: 0.88, y: 0.74, r: 0.15, s: -1 },
      { x: 0.40, y: 0.86, r: 0.17, s: 1 },
      { x: 0.97, y: 0.16, r: 0.11, s: -1 },
      { x: 0.18, y: 0.30, r: 0.13, s: -1 }
    ].map(function (c) { return { x: c.x * W, y: c.y * H, r: c.r * M, s: c.s }; });

    function angle(x, y) {
      var vx = 1, vy = 0.25 * Math.sin(x / 140 + y / 95);
      for (var i = 0; i < centres.length; i++) {
        var c = centres[i];
        var dx = x - c.x, dy = y - c.y;
        var d = Math.sqrt(dx * dx + dy * dy) + 1;
        var w = Math.exp(-(d * d) / (2 * c.r * c.r)) * 3.4;
        vx += (-dy / d) * w * c.s;
        vy += (dx / d) * w * c.s;
      }
      return Math.atan2(vy, vx);
    }

    var palette = ['#0b1a52', '#0f2266', '#16308a', '#1d3fa6', '#2a55c2', '#3a6ad6', '#5585e2', '#7ea4ee', '#2b4cb0', '#a9c4f2'];
    var weights = [10, 12, 14, 14, 12, 9, 6, 3, 10, 1];
    var wsum = weights.reduce(function (a, b) { return a + b; }, 0);
    function pick() {
      var r = R() * wsum;
      for (var i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return palette[i]; }
      return palette[0];
    }

    var n = Math.round((W * H) / 230);
    strokes = [];
    for (var i = 0; i < n; i++) {
      var x = R() * (W + 40) - 20, y = R() * (H + 40) - 20;
      var pts = [x, y];
      var len = 5 + Math.floor(R() * 8);
      var step = 3.5 + R() * 2.5;
      for (var k = 0; k < len; k++) {
        var a = angle(x, y);
        x += Math.cos(a) * step;
        y += Math.sin(a) * step;
        pts.push(x, y);
      }
      strokes.push({ p: pts, w: 1.4 + R() * 2.8, c: pick(), a: 0.5 + R() * 0.5, key: pts[0] + R() * 160 });
    }
    strokes.sort(function (a, b) { return a.key - b.key; });

    stars = [];
    for (var s = 0; s < STAR_COUNT; s++) {
      stars.push({ x: R() * W, y: R() * H, r: 0.35 + R() * R() * 1.3, ph: R() * 6.283, sp: 0.4 + R() * 1.6, gold: R() < 0.22 });
    }

    var unit = Math.min(W, H) / 560;
    bigStars = [
      { x: 0.60, y: 0.20, r: 22 }, { x: 0.80, y: 0.44, r: 17 }, { x: 0.93, y: 0.13, r: 12 },
      { x: 0.72, y: 0.82, r: 14 }, { x: 0.98, y: 0.60, r: 10 }, { x: 0.47, y: 0.58, r: 9 },
      { x: 0.34, y: 0.10, r: 8 }
    ].map(function (b) { return { x: b.x * W, y: b.y * H, r: Math.max(6, b.r * unit) }; });

    drawn = 0;
  }

  function paintStrokes(upto) {
    lctx.lineCap = 'round';
    lctx.lineJoin = 'round';
    for (; drawn < upto; drawn++) {
      var s = strokes[drawn], p = s.p;
      lctx.globalAlpha = s.a;
      lctx.strokeStyle = s.c;
      lctx.lineWidth = s.w;
      lctx.beginPath();
      lctx.moveTo(p[0], p[1]);
      for (var i = 2; i < p.length; i += 2) lctx.lineTo(p[i], p[i + 1]);
      lctx.stroke();
    }
    lctx.globalAlpha = 1;
  }

  function drawBigStar(b, t, fade) {
    var rings = 5;
    for (var i = rings; i >= 1; i--) {
      var rr = b.r * (0.55 + i * 0.5);
      ctx.beginPath();
      ctx.lineWidth = Math.max(1.4, b.r * 0.16);
      ctx.strokeStyle = i % 2 ? 'rgba(246,201,76,' + (0.5 / i) * fade + ')' : 'rgba(251,232,160,' + (0.42 / i) * fade + ')';
      ctx.setLineDash([b.r * 0.5, b.r * 0.32]);
      ctx.lineDashOffset = -(t * 0.004 * (i % 2 ? 1 : -1)) * b.r;
      ctx.arc(b.x, b.y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 1.1);
    g.addColorStop(0, 'rgba(255,250,230,' + fade + ')');
    g.addColorStop(0.45, 'rgba(246,201,76,' + 0.95 * fade + ')');
    g.addColorStop(1, 'rgba(246,201,76,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(t, progress) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var fade = Math.min(1, Math.max(0, (progress - 0.35) / 0.65));
    if (fade <= 0) return;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.sp + s.ph);
      ctx.globalAlpha = tw * fade;
      ctx.fillStyle = s.gold ? '#f6c94c' : '#eef1fb';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var j = 0; j < bigStars.length; j++) drawBigStar(bigStars[j], reduce ? 0 : t, fade);
  }

  function ease(x) { return 1 - Math.pow(1 - x, 3); }

  function loop(t) {
    raf = 0;
    if (startT === null) startT = t;
    var progress = firstPaint ? Math.min(1, (t - startT) / PAINT_MS) : 1;
    if (drawn < strokes.length) paintStrokes(Math.floor(strokes.length * ease(progress)));
    if (progress >= 1) firstPaint = false;
    render(t, progress);
    if (visible && !document.hidden) raf = requestAnimationFrame(loop);
  }

  function start() {
    if (reduce) {
      paintStrokes(strokes.length);
      render(0, 1);
      return;
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  setup();
  start();

  var resizeTimer;
  var lastW = W;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = canvas.getBoundingClientRect().width;
      if (Math.abs(w - lastW) < 2 && Math.abs(canvas.getBoundingClientRect().height - H) < 40) return;
      lastW = w;
      setup();
      firstPaint = false;
      paintStrokes(strokes.length);
      if (reduce) render(0, 1); else start();
    }, 150);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && visible) start();
  });
})();
