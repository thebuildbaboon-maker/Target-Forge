# Upgrade from r5 to r6

Copy the r6 overlay into the repository root and replace matching files.

Changed runtime files:

- `app.js`
- `rules-engine.js`
- `styles.css`
- `tests/rules-engine.test.js`
- `knowledge/target-schema.json`
- `knowledge/sample-agent-target.json`
- `docs/RULES_ENGINE.md`
- `README.md`

Then rebuild the optional standalone file:

```bash
python tools/build-standalone.py
```

Run the regression tests:

```bash
node --check app.js
node --check rules-engine.js
node tests/rules-engine.test.js
```
