# Chethan Kumar U — 3D Portfolio

An immersive, single-page 3D portfolio built for deployment / core-network operations roles.

## Stack
- HTML, CSS, vanilla JavaScript
- [Three.js](https://threejs.org/) (via CDN import map) for the 3D scene
- No build step required

## Run locally
```bash
python -m http.server 8080
# open http://localhost:8080
```

## Deploy (GitHub Pages)
1. Create a repository (e.g. `chethan-portfolio-3d`).
2. Push the contents of this folder to the default branch.
3. In GitHub → Settings → Pages → deploy from the default branch (`/root`).

> Tip: this site is fully static, so it also works on Vercel, Netlify, Cloudflare Pages, or any static host.

## Structure
```
.
├── index.html
├── styles.css
├── script.js
└── assets/
    └── Chethan_Kumar_U_Resume.pdf
```
