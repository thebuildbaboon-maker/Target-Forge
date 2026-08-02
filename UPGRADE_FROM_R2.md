# Upgrade an existing repository from r2

This archive is an overlay: extract it at the repository root and allow matching files to be replaced.

The main changed or added files are:

- `rules-engine.js` — new deterministic base-context rules module;
- `app.js` — RePoE candidate provenance, exact bench/essence class mapping, base filtering, source-group UI and `agent-target-v3` export;
- `index.html` — loads the rules engine and describes the stricter data adapter;
- `styles.css` — compact collapsible modifier-source groups;
- `mechanics-data.js` and `knowledge/` — package ID r3 and schema v3;
- `tests/rules-engine.test.js` — dependency-free Node regression tests;
- `docs/RULES_ENGINE.md` — implementation boundary and rule rationale.

After extracting:

```bash
node --check app.js
node --check rules-engine.js
node tests/rules-engine.test.js
```

Commit and push to `main`. The included GitHub Pages workflow publishes the static repository root.

Any ChatGPT Project or custom GPT using the earlier knowledge files must be updated to the r3 files because the exported schema is now `poe-target-forge/agent-target-v3` and the package ID is `poe1-crafting-knowledge-3.29.1.1-r3`.
