# Deploy — Test and Push to GitHub Pages

## Trigger
- Manual: after completing frontend changes

## Prerequisites
- `node serve.mjs` running on localhost:3000
- All changes tested visually via screenshot comparison

## Steps

1. **Start dev server** (if not running):
   ```
   node serve.mjs
   ```

2. **Take "before" screenshot** (if modifying existing features):
   ```
   node screenshot.mjs http://localhost:3000 before
   ```

3. **Make changes** to `index.html` or JS modules

4. **Take "after" screenshot:**
   ```
   node screenshot.mjs http://localhost:3000 after
   ```

5. **Compare screenshots** — check for visual regressions:
   - Spacing/padding consistency
   - Font sizes and weights
   - Color accuracy
   - Mobile responsiveness (resize browser or use screenshot width param)

6. **Commit and push:**
   ```
   git add -A
   git commit -m "descriptive message"
   git push origin main
   ```

7. **Verify on GitHub Pages** — allow 1-2 minutes for deployment

## Verification
- Visit the live site URL (check CNAME file for domain)
- Compare live site against localhost — should be identical
- Check browser console for any errors (especially CORS or 404s)

## Rollback
- `git revert HEAD` to undo last commit
- `git push` to deploy the revert
