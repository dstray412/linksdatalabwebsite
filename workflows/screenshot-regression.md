# Screenshot Regression — Visual Comparison Workflow

## Trigger
- Before and after any visual change to the frontend

## Prerequisites
- `node serve.mjs` running on localhost:3000
- Puppeteer installed (`npm install`)

## Steps

1. **Capture baseline:**
   ```
   node screenshot.mjs http://localhost:3000 before
   ```

2. **Make your changes** to index.html or JS modules

3. **Capture result:**
   ```
   node screenshot.mjs http://localhost:3000 after
   ```

4. **Compare** — read both PNGs and check:
   - Layout shifts or alignment changes
   - Font size/weight/color changes
   - Spacing and padding differences
   - Missing or broken elements
   - Interactive states (hover, focus)

5. **For modals/specific views:**
   ```
   node screenshot-modal.mjs "Scottie Scheffler" after-modal
   ```

6. **For dashboard scatter:**
   ```
   node screenshot-scatter.mjs
   ```

## Verification
- No unintended visual differences between before/after
- All views checked: home, players, stats, strokes-gained, schedule, dashboards

## Tools
- `screenshot.mjs` — full page capture (1440px wide, 2x DPI)
- `screenshot-modal.mjs` — player modal capture
- `screenshot-scatter.mjs` — dashboard scatter plot capture
- All output to `./temporary screenshots/` (auto-incrementing filenames)
