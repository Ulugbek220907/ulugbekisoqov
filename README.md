# ulugbekisoqov.uz

Personal website of Ulugbek Isoqov. Plain HTML, CSS and JavaScript, with no build step.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page. Look for `<!-- EDIT -->` comments for text and contact links to fill in. |
| `styles.css` | All styles. Colours, type scale and radii are tokens at the top. |
| `script.js` | The live Uzbekistan clock and the footer year. |
| `night-sky.webp` | Hero photo. |
| `trees.webp` | The pine silhouette cut from the hero photo. It sits above the name so the trees stand in front of it. If you change the photo, cut a new silhouette too. |
| `avatar.jpg` | Your profile picture (square). Add it to the repo root; until then the tile shows a spade. |
| `og.jpg` | Preview image shown when the link is shared (1200×630). |
| `404.html` | Page-not-found screen. |

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repo.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy. Every push to the production branch redeploys automatically.
4. In **Project → Settings → Domains**, add `ulugbekisoqov.uz` and `www.ulugbekisoqov.uz`, then set the DNS records Vercel shows you at your `.uz` registrar.
