# PoE Target Forge

A static, GitHub Pages-ready Path of Exile 1 target-item builder and ChatGPT crafting-agent handoff.

Rules package: **3.29.1.1-r2** (`Curse of the Allflame`)

## Features

- Search and select an equipment base.
- Browse the affixes applicable to that base by prefix/suffix/implicit and acquisition source.
- Immediate checks for item level, physical affix capacity, special-base limits, all known modifier groups, influences and incompatible item states.
- Full or conflicting affix choices become unavailable. An optional “keep an open prefix/suffix” constraint clears automatically when the user deliberately fills the final physical slot.
- Mark selected modifiers as fractured and validate the resulting item state.
- Enable only the crafting mechanics the player can access, with presets for all current, common and SSF-oriented access.
- Optional use of a bought/prepared starting base can be disabled.
- Export a single **Agent target JSON** containing the target, accessibility policy and source requirements.
- Install the `knowledge/` package once in a ChatGPT Project or custom GPT; routine evaluations then require only the target JSON.
- Load current RePoE data in the browser, or use the bundled representative offline dataset.

## Run locally

Opening `index.html` directly runs the offline dataset. To enable the remote RePoE loader, serve the directory:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Use `?demo=1` to force the bundled dataset during testing.

## Deploy to GitHub Pages

1. Create a repository and place these files at its root.
2. Push to the `main` branch.
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. The included `.github/workflows/pages.yml` publishes the static root automatically.

No build step, framework or server is required. `index.html` is at the artifact root and `.nojekyll` prevents Jekyll processing.

## ChatGPT agent setup

1. Create a ChatGPT Project or custom GPT.
2. Use `knowledge/AGENT_INSTRUCTIONS.md` as its instructions.
3. Upload the remaining files in `knowledge/`.
4. Build an item in the site and copy **Agent target JSON**.
5. Send only that JSON for each crafting evaluation.

The agent treats excluded mechanics as hard constraints, distinguishes a legal item from an accessible route, and must not invent exact odds or market prices.

## Data sources

The browser loader expects current RePoE exports:

- `base_items.min.json`
- `mods.min.json`
- `mods_by_base.min.json`
- `stat_translations.min.json` (optional)

The adapter uses RePoE’s base-to-mod indexes, groups, tags, item-level requirements and weights. RePoE’s export schema may change, so raw-data imports are intentionally isolated from the UI model.

## Accuracy boundary

This is a target validator and strategy handoff, not an exact crafting simulator. The reusable knowledge package covers active and legacy crafting families, current item-state rules and recombination planning. Exact weighted odds require the complete current competing mod pool; exact costs require a current league price snapshot. Both must be labelled unknown when unavailable.
