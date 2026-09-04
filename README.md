# theRoom

Static site: `theroom.html` (imported from Claude Design) plus `audio/rain.mp3`.
Live at https://theroom-seven-theta.vercel.app

## Local test before pushing

```sh
npm run dev      # local preview at http://127.0.0.1:3000 (honors the vercel.json rewrite, so / serves theroom.html)
npm test         # smoke test: root rewrite, page title, every local asset the page references
```

`npm run dev:vercel` runs the same preview through the Vercel CLI (`vercel dev`) if you want the
exact Vercel routing layer. It needs the Vercel CLI installed and logged in to the personal account.

After a deploy, `npm run test:prod` runs the same smoke test against the live site.

## CI/CD

- **CD (Vercel):** the Vercel project `theroom` (personal account, lacordei@gmail.com) is connected
  to the GitHub repo `ZehD/theRoom`. Every push to `main` builds and promotes a production deployment
  automatically. Every other branch or pull request gets a preview deployment with its own URL.
- **CI (GitHub Actions):** `.github/workflows/ci.yml` runs `npm test` on every push to `main` and on
  every pull request, so a broken rewrite or missing asset shows up as a red check on the commit.

Workflow: edit -> `npm test` -> commit -> push -> Vercel deploys -> `npm run test:prod`.

## Notes

- There is no build step. Vercel serves the repo root as static files; `vercel.json` rewrites `/` to `/theroom.html`.
- The page loads Three.js from jsDelivr and fonts from Google Fonts at runtime, so it needs network access to render.
- The Claude Design export zip stays out of git (`*.zip` is ignored) because it contains process uploads.
