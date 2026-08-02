# PoE Target Forge r5

## Modifier browser

- Modifier families now occupy two compact lines.
- All tiers are contained in a single dropdown.
- Prefix and suffix pools remain side by side.
- Source sections remain collapsible.
- The selected tier's text, source, item-level rule and weight are visible without expanding a tall card.

## Influence item-level correction

Upgrade-only elevated influence variants are normalized as T0 outcomes. Internal level 100 values are retained for provenance but are not enforced as final-item requirements. The export separately records the precursor T1 unlock level and Orb of Dominance acquisition requirement.

## Validation performed

```text
node --check app.js
node --check rules-engine.js
node tests/rules-engine.test.js
python tools/build-standalone.py
```

A browser interaction check also verified tier-dropdown selection, adding the selected tier, two-column rendering, and absence of runtime errors.

The bundled GPT instructions and target schema document the new elevated-level fields so the agent does not mistake the raw internal level for a final-item requirement.
