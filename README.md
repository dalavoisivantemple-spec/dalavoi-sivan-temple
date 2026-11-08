# Dalavoi Sivan Temple website

Bilingual (Tamil/English) static site for Sri Dhatchinamoorthi Arakattalai, Dalavoipattinam.
No build step: HTML + CSS + JS. Open index.html to preview.

## What trustees/agents edit (only these two files)
- `data/config.js` – trust name (Tamil), registration no., UPI/bank details, fund target/raised.
  Empty = hidden. NEVER put passwords or API keys here (public repo).
- `data/news.js` – add a new entry at the top of the list for each update (format shown in file).

## Deploy (GitHub + Cloudflare Pages)
1. Create a trust-owned GitHub repo, push this folder to it.
2. Cloudflare Pages -> Connect to Git -> pick repo. Framework: None. Build command: (empty). Output dir: `/`.
3. Add custom domain dalavoisivangurutemple.org.
Every commit to main redeploys automatically.

## Before going public
- Confirm official name spellings, add Tamil trust name and registration number.
- Add donation details only for an account in the trust's name. Do not claim 80G/FCRA until granted.
- Have a native Tamil reader review the text.
