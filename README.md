# PoE Target Forge

A static, GitHub Pages-ready Path of Exile 1 target-item builder and ChatGPT crafting-agent handoff.

- Crafting knowledge package: **`poe1-crafting-knowledge-3.29.1.1-r3`**
- Browser target ruleset: **`poe1-target-legality-3.29.1.1-r6`**
- Export schema: **`poe-target-forge/agent-target-v3`**

## What this release adds

- A Craft of Exile-inspired modifier browser: source sections, side-by-side prefix/suffix columns, expandable modifier families, compact tier tables and sortable iLvl/weight views.
- One family row can contain every tier in the same modifier group; only the chosen tier is added to the target.
- Search opens matching families automatically, while Open all groups and Collapse all reproduce the fast pool-browsing workflow.

- The modifier list is now filtered by a deterministic browser rules engine rather than trusting a broad imported pool.
- RePoE `mods_by_base` is treated as candidate evidence. Candidates are rechecked against base tags, item class, domain and ordered spawn weights before display.
- Crafting Bench and Essence item-class maps can be loaded from their RePoE exports.
- Base-incompatible entries are absent from the list. Base-compatible entries that fail the current item state remain visible but disabled when **Show unavailable** is enabled.
- Modifier groups are checked by full set intersection.
- Prefix/suffix capacity immediately disables every additional mod on a full side.
- “Keep an open prefix/suffix” clears automatically when the final physical slot is deliberately filled.
- The modifier browser uses thin rows inside collapsible categories for Natural, Bench, Essence, Influence, Delve, Incursion, Betrayal, Synthesis, Corruption and other sources.
- Every selected modifier exports its candidate provenance and base-rule evidence for the persistent ChatGPT agent.

See [`docs/RULES_ENGINE.md`](docs/RULES_ENGINE.md) for the enforcement boundary.

## Run locally

Opening `index.html` directly runs the bundled demonstration dataset. To enable automatic RePoE loading, serve the directory:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Use `?demo=1` to force the bundled dataset.

## RePoE data

Required:

- `base_items.min.json`
- `mods.min.json`
- `mods_by_base.min.json`

Optional but supported:

- `stat_translations.min.json`
- `crafting_bench_options.min.json`
- `essences.min.json`
- `item_classes.min.json`

All files are parsed locally in the browser. No game-data server is required after loading.

## Deploy to GitHub Pages

1. Extract this archive at the root of a Git repository.
2. Push to the `main` branch.
3. In **Settings → Pages**, select **GitHub Actions** as the source.
4. The included `.github/workflows/pages.yml` publishes the repository root.

No build step, framework or backend is required. A separate validation workflow checks JavaScript syntax, runs the rules tests and rebuilds the standalone file.

## ChatGPT crafting agent

1. Create a ChatGPT Project or custom GPT.
2. Use `knowledge/AGENT_INSTRUCTIONS.md` as its instructions.
3. Upload the remaining files in `knowledge/` once.
4. Build the target in the site.
5. Send only **Agent target JSON** for routine crafting evaluation.

The JSON includes excluded mechanics, target source requirements, target-state validation and browser base-legality evidence. The agent must not invent exact odds or prices.

## Tests

```bash
node --check app.js
node --check rules-engine.js
node tests/rules-engine.test.js
```

The tests cover ordered spawn-weight behavior, base-tag rejection, essence class mapping, modifier-group conflicts and special affix limits. Run `python tools/build-standalone.py` after source changes to refresh `dist/poe-target-forge-standalone.html`.

## Accuracy boundary

This site validates target construction and prepares a strategy handoff. It does not simulate every stochastic crafting action. Exact probabilities require a complete current competing pool or a simulator; exact costs require a current league price snapshot.


## r5 UI and influence-level correction

The modifier pool uses compact two-line family rows with a tier dropdown. RePoE influence entries that represent elevated upgrade outcomes are normalized to T0 and have no direct final-item level gate; the highest ordinary precursor tier and raw internal level are retained separately in the exported JSON for traceability.

## r6 influence selection and limits

- Influence modifiers are selectable without manually enabling their influence first.
- Adding an influence modifier automatically enables the corresponding Shaper, Elder or Conqueror influence toggle.
- The projected item state is checked before selection: a second distinct influence is allowed, while a third distinct influence modifier is disabled in the pool.
- Once two influences are active, mods belonging to either active influence remain selectable, while all other influence toggles and third-influence mods are disabled.
- An influence required by a selected modifier cannot be removed until that modifier is removed.

The browser continues to derive influence candidates from the base-specific RePoE pool and then applies local base, spawn-weight, affix, group and item-state validation.
