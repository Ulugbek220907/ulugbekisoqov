(function () {
  'use strict';

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* Local time in Uzbekistan, so visitors know when they are writing */
  var clock = document.getElementById('clock');
  var part = document.getElementById('clock-part');
  if (!clock) return;

  var fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tashkent' });
  } catch (e) {
    fmt = null;
  }

  function partOfDay(h) {
    if (h >= 5 && h < 12) return 'Morning';
    if (h >= 12 && h < 17) return 'Afternoon';
    if (h >= 17 && h < 22) return 'Evening';
    return 'Night';
  }

  function tick() {
    var now = new Date();
    var text;
    if (fmt) {
      text = fmt.format(now);
    } else {
      var t = new Date(now.getTime() + (now.getTimezoneOffset() + 300) * 60000);
      text = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
    }
    clock.textContent = text;
    clock.setAttribute('datetime', text);
    if (part) part.textContent = partOfDay(parseInt(text.slice(0, 2), 10));
  }

  tick();
  setInterval(tick, 15000);
})();
