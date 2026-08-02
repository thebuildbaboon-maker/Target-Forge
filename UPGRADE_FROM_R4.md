# Upgrade from r4 to r5

Copy the r5 overlay into the repository root and replace matching files.

Changes:

- influence modifiers encoded as upgrade-only/elevated variants are shown as **T0**, not as impossible item-level 100 rolls;
- their final-item requirement is no longer taken from the raw internal level; the highest ordinary precursor tier is exported separately;
- the export preserves both `required_item_level` and `raw_data_required_level`, and identifies `orb_of_dominance` as the acquisition mechanic;
- modifier families are now compact two-line rows with all tiers in one dropdown;
- prefix and suffix columns remain side by side, while source sections remain collapsible.

The `agent-target-v3` export schema and r3 knowledge package remain compatible.
