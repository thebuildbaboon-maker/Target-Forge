/*
  Deterministic browser-side target legality rules.
  This module is intentionally dependency-free and is usable in both the
  browser and Node-based regression tests.
*/
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.POE_TARGET_RULES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULESET_ID = 'poe1-target-legality-3.29.1.1-r3';

  const SOURCE_META = {
    natural: { label: 'Natural affixes', short: 'Natural', description: 'Ordinary prefix and suffix pool for the selected base.' },
    crafted: { label: 'Crafting Bench', short: 'Bench', description: 'Crafted and meta-crafted modifiers.' },
    essence: { label: 'Essence-only', short: 'Essence', description: 'Forced modifiers granted by an Essence.' },
    fossil: { label: 'Fossil-specific', short: 'Fossil', description: 'Modifiers or outcomes tied to fossil crafting.' },
    harvest: { label: 'Harvest', short: 'Harvest', description: 'Modifiers or special outcomes tied to Harvest.' },
    delve: { label: 'Delve / drop-only', short: 'Delve', description: 'Delve-only or fossil-associated modifier pools.' },
    incursion: { label: 'Incursion / Temple', short: 'Temple', description: 'Incursion and Temple drop-only modifiers.' },
    betrayal: { label: 'Betrayal / Veiled', short: 'Veiled', description: 'Veiled, unveiled and Betrayal drop-only modifiers.' },
    influence: { label: 'Influence affixes', short: 'Influence', description: 'Shaper, Elder and Conqueror modifier pools.' },
    eldritch: { label: 'Eldritch implicits', short: 'Eldritch', description: 'Searing Exarch and Eater of Worlds implicits.' },
    recombinator: { label: 'Recombinator-only', short: 'Recombinator', description: 'Modifiers associated with recombination or transfer.' },
    infamous: { label: 'Infamous / Mercenary', short: 'Infamous', description: 'Mercenary equipment and Infamous modifiers.' },
    synthesis: { label: 'Synthesised implicits', short: 'Synthesis', description: 'Synthesised implicit modifier pool.' },
    corruption: { label: 'Corruption implicits', short: 'Corruption', description: 'Vaal and double-corruption implicit outcomes.' },
    allflame: { label: 'Allflame / Ducat', short: 'Allflame', description: 'Current league-specific modifier sources.' },
    other: { label: 'Other special sources', short: 'Other', description: 'Special modifiers whose acquisition source is not fully classified.' }
  };

  const REGULAR_SOURCES = new Set(['natural', 'influence']);
  const AFFIX_TYPES = new Set(['prefix', 'suffix', 'implicit']);

  const CLASS_ALIASES = {
    bodyarmour: ['bodyarmour', 'body_armour', 'body armour'],
    helmet: ['helmet', 'helmets'],
    gloves: ['gloves'],
    boots: ['boots'],
    shield: ['shield', 'shields'],
    quiver: ['quiver', 'quivers'],
    ring: ['ring', 'rings'],
    amulet: ['amulet', 'amulets'],
    belt: ['belt', 'belts'],
    wand: ['wand', 'wands'],
    bow: ['bow', 'bows'],
    staff: ['staff', 'staves'],
    warstaff: ['warstaff', 'warstaves'],
    dagger: ['dagger', 'daggers'],
    runedagger: ['runedagger', 'rune_dagger', 'rune dagger'],
    claw: ['claw', 'claws'],
    sceptre: ['sceptre', 'sceptres'],
    onehandsword: ['onehandsword', 'one_hand_sword', 'one hand sword'],
    thrustingonehandsword: ['thrustingonehandsword', 'thrusting_one_hand_sword', 'thrusting one hand sword'],
    twohandsword: ['twohandsword', 'two_hand_sword', 'two hand sword'],
    onehandaxe: ['onehandaxe', 'one_hand_axe', 'one hand axe'],
    twohandaxe: ['twohandaxe', 'two_hand_axe', 'two hand axe'],
    onehandmace: ['onehandmace', 'one_hand_mace', 'one hand mace'],
    twohandmace: ['twohandmace', 'two_hand_mace', 'two hand mace'],
    fishingrod: ['fishingrod', 'fishing_rod', 'fishing rod'],
    jewel: ['jewel', 'jewels'],
    abyssjewel: ['abyssjewel', 'abyss_jewel', 'abyss jewel'],
    flask: ['flask', 'flasks'],
    tincture: ['tincture', 'tinctures'],
    trinket: ['trinket', 'trinkets'],
    graft: ['graft', 'grafts'],
    talisman: ['talisman', 'talismans'],
    chart: ['chart', 'charts']
  };

  function canonicalToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/^metadata\//, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  function classTokens(itemClass) {
    const canonical = canonicalToken(itemClass);
    const aliases = CLASS_ALIASES[canonical] || [String(itemClass || '')];
    return new Set([canonical, ...aliases.map(canonicalToken)]);
  }

  function baseTokens(base) {
    if (!base) return new Set();
    const values = [
      base.id,
      base.name,
      base.item_class,
      base.domain,
      ...(base.tags || []),
      ...(base.rule_tags || [])
    ];
    const classSet = classTokens(base.item_class);
    const result = new Set(values.map(canonicalToken).filter(Boolean));
    classSet.forEach(token => result.add(token));
    result.add('default');
    return result;
  }

  function appliesToTokens(mod, base) {
    if (!Array.isArray(mod.applies_to) || !mod.applies_to.length) {
      return { valid: true, matched: null, checked: false };
    }
    const tokens = baseTokens(base);
    const matched = mod.applies_to.find(token => tokens.has(canonicalToken(token)));
    return { valid: Boolean(matched), matched: matched || null, checked: true };
  }

  function orderedWeight(rules, tags) {
    if (!Array.isArray(rules) || !rules.length) {
      return { checked: false, matched: null, weight: null, index: -1 };
    }
    const normalizedTags = tags instanceof Set ? tags : new Set(Array.from(tags || []).map(canonicalToken));
    for (let index = 0; index < rules.length; index += 1) {
      const rule = rules[index] || {};
      const tag = canonicalToken(rule.tag);
      if (tag && normalizedTags.has(tag)) {
        const weight = Number(rule.weight);
        return { checked: true, matched: rule.tag, weight: Number.isFinite(weight) ? weight : 0, index };
      }
    }
    return { checked: true, matched: null, weight: 0, index: -1 };
  }

  function normalizeDomain(value) {
    const token = canonicalToken(value);
    const aliases = {
      1: 'item', item: 'item',
      2: 'flask', flask: 'flask',
      3: 'monster', monster: 'monster',
      4: 'chest', chest: 'chest',
      5: 'area', area: 'area',
      6: 'st delve', delve: 'delve',
      9: 'crafted', master: 'crafted', crafted: 'crafted',
      10: 'veiled', veiled: 'veiled',
      11: 'abyssjewel', abyssjewel: 'abyssjewel',
      12: 'misc', misc: 'misc'
    };
    return aliases[token] || token;
  }

  function domainCompatibility(mod, base) {
    const source = mod.source || 'other';
    const modDomain = normalizeDomain(mod.raw_domain || mod.domain);
    const baseDomain = normalizeDomain(base && base.domain);
    if (!modDomain || !baseDomain) return { valid: true, checked: false, modDomain, baseDomain };

    // RePoE documents equal domains as the rule for ordinary spawning. Crafted,
    // essence, corruption, delve and other special domains use their own source
    // adapters and therefore are not rejected solely for a domain mismatch.
    if (REGULAR_SOURCES.has(source) || (Array.isArray(mod.spawn_weights) && mod.spawn_weights.length && source === 'natural')) {
      return { valid: modDomain === baseDomain || (modDomain === 'item' && baseDomain === 'item'), checked: true, modDomain, baseDomain };
    }
    return { valid: true, checked: false, modDomain, baseDomain };
  }

  function classCompatibility(mod, base) {
    const allowed = Array.isArray(mod.allowed_item_classes) ? mod.allowed_item_classes : [];
    const denied = Array.isArray(mod.denied_item_classes) ? mod.denied_item_classes : [];
    const baseClass = classTokens(base && base.item_class);
    const matches = value => {
      const candidateTokens = classTokens(value);
      return Array.from(candidateTokens).some(token => baseClass.has(token));
    };
    if (allowed.length && !allowed.some(matches)) return { valid: false, checked: true, mode: 'allowed', values: allowed };
    if (denied.length && denied.some(matches)) return { valid: false, checked: true, mode: 'denied', values: denied };
    return { valid: true, checked: Boolean(allowed.length || denied.length), mode: null, values: [] };
  }

  function baseIdCompatibility(mod, base) {
    const allowed = Array.isArray(mod.allowed_base_ids) ? mod.allowed_base_ids : [];
    const denied = Array.isArray(mod.denied_base_ids) ? mod.denied_base_ids : [];
    if (allowed.length && !allowed.includes(base.id)) return { valid: false, checked: true, mode: 'allowed' };
    if (denied.includes(base.id)) return { valid: false, checked: true, mode: 'denied' };
    return { valid: true, checked: Boolean(allowed.length || denied.length), mode: null };
  }

  function spawnContextTokens(mod, base) {
    const tags = baseTokens(base);
    if (mod.influence) {
      tags.add(canonicalToken(mod.influence));
      tags.add(canonicalToken(`${mod.influence}_item`));
      tags.add(canonicalToken(`${mod.influence} item`));
    }
    return tags;
  }

  function shouldEnforceSpawnWeight(mod) {
    if (!Array.isArray(mod.spawn_weights) || !mod.spawn_weights.length) return false;
    if (mod.is_essence_only || mod.source === 'crafted' || mod.source === 'essence') return false;
    // mods_by_base is the candidate authority for special/drop/implicit pools.
    // Ordered spawn weights are re-evaluated for ordinary and influence affixes,
    // where they are the authoritative base-tag gate documented by RePoE.
    return ['natural', 'influence'].includes(mod.source || 'other') || mod.candidate_scope === 'unknown';
  }

  function baseCompatibility(mod, base, options) {
    const opts = options || {};
    const reasons = [];
    const evidence = [];
    if (!base) return { valid: false, reasons: [{ code: 'NO_BASE', message: 'Choose an item base first.' }], evidence };

    const tokenRule = appliesToTokens(mod, base);
    if (tokenRule.checked) {
      evidence.push({ rule: 'applies_to', matched: tokenRule.matched, valid: tokenRule.valid });
      if (!tokenRule.valid) reasons.push({ code: 'BASE_TAG', message: 'This modifier is not assigned to the selected base tags or item class.' });
    }

    const classRule = classCompatibility(mod, base);
    if (classRule.checked) {
      evidence.push({ rule: 'item_class', valid: classRule.valid, mode: classRule.mode, values: classRule.values });
      if (!classRule.valid) reasons.push({ code: 'ITEM_CLASS', message: 'This modifier is not legal for the selected item class.' });
    }

    const idRule = baseIdCompatibility(mod, base);
    if (idRule.checked) {
      evidence.push({ rule: 'base_id', valid: idRule.valid, mode: idRule.mode });
      if (!idRule.valid) reasons.push({ code: 'BASE_ID', message: 'This modifier is excluded from the selected base type.' });
    }

    const domainRule = domainCompatibility(mod, base);
    if (domainRule.checked) {
      evidence.push({ rule: 'domain', valid: domainRule.valid, mod_domain: domainRule.modDomain, base_domain: domainRule.baseDomain });
      if (!domainRule.valid) reasons.push({ code: 'DOMAIN', message: `Modifier domain ${domainRule.modDomain || 'unknown'} does not match base domain ${domainRule.baseDomain || 'unknown'}.` });
    }

    if (shouldEnforceSpawnWeight(mod)) {
      const spawn = orderedWeight(mod.spawn_weights, spawnContextTokens(mod, base));
      evidence.push({ rule: 'ordered_spawn_weight', matched_tag: spawn.matched, weight: spawn.weight, index: spawn.index, valid: spawn.weight > 0 });
      if (spawn.weight <= 0) {
        reasons.push({
          code: 'SPAWN_WEIGHT',
          message: spawn.matched
            ? `The first matching spawn rule (${spawn.matched}) has weight 0 on this base.`
            : 'No positive ordered spawn-weight rule matches this base.'
        });
      }
    }

    if (mod.candidate_scope === 'none' && opts.requireCandidateEvidence !== false) {
      evidence.push({ rule: 'candidate_provenance', valid: false, sources: mod.candidate_sources || [] });
      reasons.push({ code: 'NO_CANDIDATE_EVIDENCE', message: 'No RePoE base, class, bench or essence mapping supports this modifier on the selected base.' });
    } else if (mod.candidate_scope) {
      evidence.push({ rule: 'candidate_provenance', valid: true, scope: mod.candidate_scope, sources: mod.candidate_sources || [] });
    }

    if (!AFFIX_TYPES.has(mod.affix) && opts.allowOtherGeneration !== true) {
      reasons.push({ code: 'GENERATION_TYPE', message: 'This entry is not a selectable prefix, suffix or implicit modifier.' });
    }

    return { valid: reasons.length === 0, reasons, evidence };
  }


  function hasPositiveSpawnWeight(mod) {
    return Array.isArray(mod && mod.spawn_weights) && mod.spawn_weights.some(rule => Number(rule && rule.weight) > 0);
  }

  function annotateInfluenceUpgradeTiers(mods) {
    const groups = new Map();
    for (const mod of mods || []) {
      if (!mod || mod.source !== 'influence' || !['prefix','suffix'].includes(mod.affix)) continue;
      const key = [mod.affix, mod.influence || '', mod.type || mod.group || (mod.groups || [])[0] || mod.id].join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(mod);
    }
    for (const family of groups.values()) {
      const ordinary = family.filter(mod => {
        const rawLevel = Number(mod.raw_required_level ?? mod.required_level ?? 1);
        const namedElevated = /(?:^|\b)(elevated|t0|tier\s*0)(?:\b|$)/i.test(`${mod.id || ''} ${mod.name || ''}`);
        return !namedElevated && rawLevel < 100;
      });
      const precursorLevel = ordinary.length ? Math.max(...ordinary.map(mod => Number(mod.required_level) || 1)) : null;
      for (const mod of family) {
        const rawLevel = Number(mod.raw_required_level ?? mod.required_level ?? 1);
        const namedElevated = /(?:^|\b)(elevated|t0|tier\s*0)(?:\b|$)/i.test(`${mod.id || ''} ${mod.name || ''}`);
        const upgradeOnly = namedElevated || rawLevel >= 100;
        if (!upgradeOnly) continue;
        mod.raw_required_level = rawLevel;
        mod.precursor_required_level = precursorLevel;
        mod.required_level = 1;
        mod.tier = 'T0';
        mod.elevated = true;
        mod.is_upgrade_only = true;
        mod.acquisition_mechanic = 'orb_of_dominance';
        mod.weight = 0;
        mod.notes = [mod.notes, `Upgrade-only elevated influence modifier. The final elevated modifier has no direct item-level requirement; a T1 precursor is normally required${precursorLevel ? ` and is unlocked at item level ${precursorLevel}` : ''}. Raw data level ${rawLevel} is not a rollable item-level requirement.`].filter(Boolean).join(' ');
      }
    }
    return mods;
  }

  function groupsFor(mod) {
    return new Set([...(mod.groups || []), mod.type, mod.group].filter(Boolean));
  }

  function groupConflict(mod, selectedMods) {
    const groups = groupsFor(mod);
    for (const existing of selectedMods || []) {
      if (!existing || existing.id === mod.id) continue;
      const existingGroups = groupsFor(existing);
      const shared = Array.from(groups).find(group => existingGroups.has(group));
      if (shared) return { conflict: existing, group: shared };
    }
    return null;
  }

  function rareAffixLimits(base) {
    const limits = { prefix: 3, suffix: 3, implicit: 3 };
    if (!base) return limits;
    const cls = canonicalToken(base.item_class);
    const name = String(base.name || '').trim().toLowerCase();
    if (cls.includes('jewel') || cls.includes('trinket') || cls.includes('graft')) {
      limits.prefix = 2;
      limits.suffix = 2;
    }
    if (name === 'focused amulet') {
      limits.prefix = 2;
      limits.suffix = 1;
    } else if (name === 'simplex amulet') {
      limits.prefix = 1;
      limits.suffix = 2;
    }
    const explicitPrefixLimit = Number(base.affix_limits && base.affix_limits.prefix !== undefined ? base.affix_limits.prefix : base.maximum_prefixes);
    const explicitSuffixLimit = Number(base.affix_limits && base.affix_limits.suffix !== undefined ? base.affix_limits.suffix : base.maximum_suffixes);
    if (Number.isFinite(explicitPrefixLimit)) limits.prefix = explicitPrefixLimit;
    if (Number.isFinite(explicitSuffixLimit)) limits.suffix = explicitSuffixLimit;
    return limits;
  }

  function affixLimits(base, rarity) {
    const rare = rareAffixLimits(base);
    if (rarity === 'magic') return { prefix: Math.min(1, rare.prefix), suffix: Math.min(1, rare.suffix), implicit: rare.implicit };
    return rare;
  }

  return {
    RULESET_ID,
    SOURCE_META,
    canonicalToken,
    classTokens,
    baseTokens,
    appliesToTokens,
    orderedWeight,
    spawnContextTokens,
    baseCompatibility,
    annotateInfluenceUpgradeTiers,
    groupsFor,
    groupConflict,
    rareAffixLimits,
    affixLimits
  };
});
