# Upgrade from r3 to r4

This release changes only the modifier-pool presentation and sorting. The rules engine, GPT knowledge package and target JSON schema remain compatible with r3.

Replace:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Then rebuild `dist/poe-target-forge-standalone.html` with:

```bash
python tools/build-standalone.py
```

## New modifier-browser behavior

- Crafting sources remain the outer categories.
- Prefixes and suffixes appear in parallel columns where space allows.
- Modifiers sharing a group are presented as one expandable family.
- Family expansion reveals tier, rendered stat, required item level and spawn weight.
- Sorting can prioritize family name, required level or spawn weight.
- Search automatically expands matching families.
