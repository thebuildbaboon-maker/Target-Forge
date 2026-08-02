# PoE Target Forge r6

## Influence target fixes

- Influence affixes no longer require the user to pre-enable an influence checkbox before they appear as selectable.
- Selecting an influence affix automatically enables its required influence.
- The two-influence limit is evaluated against the projected item state before a modifier is added.
- A modifier requiring a third distinct influence is disabled and displays an influence-limit reason.
- Modifiers belonging to either of the two active influences remain selectable.
- Unused influence toggles are disabled once the two-influence limit is reached.
- Influence toggles required by selected modifiers are visually marked.

## Validation

The dependency-free rules tests cover first-influence activation, second-influence activation, third-influence rejection and continued use of either active influence.
