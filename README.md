# Iron G Equipment Co. — irongequipment.com
Trailer rental marketing site for Iron G Equipment Co. LLC
Yukon, Oklahoma | (405) 393-4161 | info@irongequipment.com

## Stack
- Vanilla HTML/CSS/JS
- Cloudflare Pages (auto-deploy from GitHub main branch)
- PWA manifest + lightweight service worker
- Form submissions → irong-cc.westcal98.workers.dev/submit

## Structure
- index.html — structure only
- styles.css — all styles
- app.js — all JavaScript + SW registration
- sw.js — service worker (network-first)
- manifest.json — PWA manifest
- _headers — Cloudflare security headers

## Deploy
Push to main → Cloudflare Pages auto-deploys in ~60 seconds
Cache bust: increment ?v= strings on CSS/JS in index.html

## Brand
Background: #080808 | Steel blue: #5B9EC9 | Silver: #A8B8C4
Font: Oswald (headings) + system sans-serif
