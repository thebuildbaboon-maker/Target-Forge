(() => {
  'use strict';

  const REPOE_URLS = {
    base_items: 'https://repoe-fork.github.io/base_items.min.json',
    mods: 'https://repoe-fork.github.io/mods.min.json',
    mods_by_base: 'https://repoe-fork.github.io/mods_by_base.min.json',
    stat_translations: 'https://repoe-fork.github.io/stat_translations.min.json',
    crafting_bench_options: 'https://repoe-fork.github.io/crafting_bench_options.min.json',
    essences: 'https://repoe-fork.github.io/essences.min.json',
    item_classes: 'https://repoe-fork.github.io/item_classes.min.json'
  };

  const EQUIPMENT_CLASSES = new Set([
    'BodyArmour','Body Armour','Helmet','Gloves','Boots','Shield','Quiver',
    'Ring','Amulet','Belt','Wand','Bow','Staff','Warstaff','Dagger','Rune Dagger',
    'Claw','Sceptre','One Hand Sword','Thrusting One Hand Sword','Two Hand Sword',
    'One Hand Axe','Two Hand Axe','One Hand Mace','Two Hand Mace','FishingRod',
    'Jewel','AbyssJewel','Flask','Tincture','Trinket','Graft','Talisman','Chart'
  ]);
  const INFLUENCES = ['shaper','elder','crusader','redeemer','hunter','warlord'];
  const SOURCE_ORDER = ['natural','crafted','essence','fossil','harvest','delve','incursion','betrayal','influence','eldritch','recombinator','infamous','synthesis','corruption','allflame','other'];
  const POE_RULES = window.POE_TARGET_RULES;
  if (!POE_RULES) throw new Error('rules-engine.js must load before app.js');
  const SOURCE_META = POE_RULES.SOURCE_META;
  const MECHANIC_DATA = window.POE_CRAFTING_MECHANICS || { package_id:'unversioned', patch:'unknown', mechanics:[], categories:[] };
  const MECHANIC_BY_ID = new Map(MECHANIC_DATA.mechanics.map(mechanic => [mechanic.id, mechanic]));
  const DEFAULT_MECHANIC_ACCESS = new Set(MECHANIC_DATA.mechanics.filter(mechanic => mechanic.default).map(mechanic => mechanic.id));
  const EXPORT_POOL_LIMIT = 1500;
  const MAX_RENDERED_MODS = 1200;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const els = {
    dataBanner: $('#dataBanner'), dataModeLabel: $('#dataModeLabel'), dataModeDetail: $('#dataModeDetail'),
    openDataBtn: $('#openDataBtn'), dataModal: $('#dataModal'), closeDataBtn: $('#closeDataBtn'), doneDataBtn: $('#doneDataBtn'),
    loadRemoteBtn: $('#loadRemoteBtn'), remoteProgress: $('#remoteProgress'), dataFiles: $('#dataFiles'), restoreDemoBtn: $('#restoreDemoBtn'),
    baseSearch: $('#baseSearch'), clearBaseSearch: $('#clearBaseSearch'), baseResults: $('#baseResults'), selectedBaseCard: $('#selectedBaseCard'),
    itemLevel: $('#itemLevel'), rarity: $('#rarity'), qualityInput: $('#qualityInput'), influenceControls: $('#influenceControls'),
    openPrefix: $('#openPrefix'), openSuffix: $('#openSuffix'), allowCrafted: $('#allowCrafted'), ssfMode: $('#ssfMode'), budgetInput: $('#budgetInput'),
    allowPurchasedBase: $('#allowPurchasedBase'), mechanicAccessSummary: $('#mechanicAccessSummary'), mechanicAccessControls: $('#mechanicAccessControls'),
    legalitySummary: $('#legalitySummary'), legalityIssues: $('#legalityIssues'),
    poolSummary: $('#poolSummary'), modSearch: $('#modSearch'), sideFilter: $('#sideFilter'), sourceFilter: $('#sourceFilter'),
    showUnavailable: $('#showUnavailable'), modSort: $('#modSort'), sourcePills: $('#sourcePills'), expandAllMods: $('#expandAllMods'), collapseAllMods: $('#collapseAllMods'), modList: $('#modList'),
    targetItemName: $('#targetItemName'), itemPreview: $('#itemPreview'), selectedMods: $('#selectedMods'), clearModsBtn: $('#clearModsBtn'),
    strategyCard: $('#strategyCard'), copyStrategyBtn: $('#copyStrategyBtn'), copyPobBtn: $('#copyPobBtn'),
    newTargetBtn: $('#newTargetBtn'), exportBtn: $('#exportBtn'), exportModal: $('#exportModal'), closeExportBtn: $('#closeExportBtn'),
    exportExplanation: $('#exportExplanation'), exportOutput: $('#exportOutput'), exportSize: $('#exportSize'),
    copyExportBtn: $('#copyExportBtn'), downloadExportBtn: $('#downloadExportBtn'), toast: $('#toast')
  };

  const state = {
    data: null,
    selectedBaseId: null,
    selectedMods: [],
    itemLevel: 86,
    quality: 20,
    rarity: 'rare',
    influences: new Set(),
    constraints: { openPrefix: false, openSuffix: false, allowCrafted: true, ssf: false, notes: '' },
    mechanicAccess: new Set(DEFAULT_MECHANIC_ACCESS),
    allowPurchasedBase: true,
    filters: { query: '', side: 'all', source: 'all', sort: 'family', showUnavailable: true, density: 'compact' },
    openSourceGroups: new Set(['natural','crafted','essence','influence']),
    openModFamilies: new Set(),
    familyTierSelection: new Map(),
    exportMode: 'agent',
    dragModId: null
  };

  function unroot(value) {
    return value && typeof value === 'object' && value.root && typeof value.root === 'object' ? value.root : value;
  }

  function humanize(value) {
    return String(value || '')
      .replace(/^Metadata\//, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_+]+/g, ' ')
      .replace(/\bPct\b/gi, '%')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, c => c.toUpperCase());
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatRange(min, max) {
    if (min === undefined && max === undefined) return '';
    if (min === max || max === undefined) return String(min);
    return `${min}–${max}`;
  }

  function displayFromStats(stats, fallback) {
    if (!Array.isArray(stats) || !stats.length) return fallback || 'Unknown modifier effect';
    return stats.map(stat => {
      const id = stat.id || stat.stat_id || stat.stat || 'unknown_stat';
      const min = stat.min ?? stat.min_value ?? stat.value;
      const max = stat.max ?? stat.max_value ?? stat.value;
      const range = formatRange(min, max);
      return `${range ? `${range} ` : ''}${humanize(id)}`.trim();
    }).join(' / ');
  }

  function inferInfluence(raw, hints = []) {
    const haystack = [raw.generation_type, raw.domain, raw.name, ...hints]
      .concat((raw.spawn_weights || []).map(w => w.tag))
      .join(' ')
      .toLowerCase();
    return INFLUENCES.find(inf => haystack.includes(inf)) || null;
  }

  function inferAffix(raw, hints = []) {
    const haystack = [raw.generation_type, ...hints].join(' ').toLowerCase();
    if (haystack.includes('prefix')) return 'prefix';
    if (haystack.includes('suffix')) return 'suffix';
    if (haystack.includes('implicit') || haystack.includes('synthesis')) return 'implicit';
    return ['prefix','suffix','implicit'].includes(raw.generation_type) ? raw.generation_type : 'other';
  }

  function inferSource(raw, hints = []) {
    if (raw.is_essence_only) return 'essence';
    const haystack = [raw.generation_type, raw.domain, ...hints].join(' ').toLowerCase();
    if (haystack.includes('essence')) return 'essence';
    if (haystack.includes('eldritch') || haystack.includes('searing exarch') || haystack.includes('eater of worlds')) return 'eldritch';
    if (haystack.includes('synth')) return 'synthesis';
    if (haystack.includes('incursion') || haystack.includes('temple')) return 'incursion';
    if (haystack.includes('betrayal') || haystack.includes('veiled') || haystack.includes('of the order')) return 'betrayal';
    if (haystack.includes('infamous') || haystack.includes('mercenary')) return 'infamous';
    if (haystack.includes('recombinator') || haystack.includes('recombinated')) return 'recombinator';
    if (haystack.includes('allflame') || haystack.includes('pantheon aspect') || haystack.includes('ducat')) return 'allflame';
    if (haystack.includes('delve')) return 'delve';
    if (haystack.includes('fossil')) return 'fossil';
    if (haystack.includes('harvest')) return 'harvest';
    if (haystack.includes('crafted') || haystack.includes('master')) return 'crafted';
    if (haystack.includes('corrupt')) return 'corruption';
    if (inferInfluence(raw, hints)) return 'influence';
    if (['prefix','suffix'].includes(inferAffix(raw, hints))) return 'natural';
    return 'other';
  }

  function normalizeRemoteMod(id, raw, hintMeta = {}) {
    const hints = Array.from(hintMeta.hints || []);
    const stats = Array.isArray(raw.stats) ? raw.stats.map(stat => ({
      id: stat.id || stat.stat_id || stat.stat,
      min: stat.min ?? stat.min_value ?? stat.value,
      max: stat.max ?? stat.max_value ?? stat.value
    })) : [];
    const affix = inferAffix(raw, hints);
    const source = inferSource(raw, hints);
    const influence = inferInfluence(raw, hints);
    const rawName = raw.name && String(raw.name).trim() ? raw.name : humanize(id.replace(/\d+_?$/, ''));
    const statDisplay = displayFromStats(stats, rawName);
    const useStatDisplay = stats.length && !/^Unknown/i.test(statDisplay);
    return {
      id,
      name: rawName,
      display: useStatDisplay ? statDisplay : rawName,
      affix,
      generation_type: raw.generation_type || affix,
      groups: Array.from(new Set([
        ...(Array.isArray(raw.groups) ? raw.groups : []),
        raw.type,
        raw.group
      ].filter(Boolean))),
      group: raw.type || raw.group || (Array.isArray(raw.groups) ? raw.groups[0] : null) || id,
      type: raw.type || raw.group || (Array.isArray(raw.groups) ? raw.groups[0] : null) || id,
      raw_required_level: safeNumber(raw.required_level, 1),
      required_level: safeNumber(raw.required_level, 1),
      tier: null,
      source,
      influence,
      tags: Array.from(new Set([...(raw.tags || []), ...(raw.adds_tags || []), ...(raw.crafting_tags || [])])),
      stats,
      weight: hintMeta.weight ?? null,
      notes: raw.domain ? `Domain: ${raw.domain}` : '',
      raw_generation_type: raw.generation_type,
      raw_domain: raw.domain,
      is_essence_only: Boolean(raw.is_essence_only),
      adds_tags: raw.adds_tags || [],
      implicit_tags: raw.implicit_tags || raw.crafting_tags || [],
      spawn_weights: raw.spawn_weights || [],
      generation_weights: raw.generation_weights || [],
      candidate_scope: hintMeta.scope || 'base',
      candidate_sources: Array.from(hintMeta.sources || []),
      allowed_item_classes: Array.from(hintMeta.allowedItemClasses || [])
    };
  }

  function addCandidate(candidateMap, baseId, modId, hint, weight, provenance = {}) {
    if (!candidateMap.has(baseId)) candidateMap.set(baseId, new Map());
    const byMod = candidateMap.get(baseId);
    if (!byMod.has(modId)) byMod.set(modId, {
      hints: new Set(), weight: null, scopes: new Set(), sources: new Set(), allowedItemClasses: new Set()
    });
    const meta = byMod.get(modId);
    if (hint) meta.hints.add(hint);
    if (typeof weight === 'number' && (meta.weight === null || weight > meta.weight)) meta.weight = weight;
    if (provenance.scope) meta.scopes.add(provenance.scope);
    if (provenance.source) meta.sources.add(provenance.source);
    if (provenance.itemClass) meta.allowedItemClasses.add(provenance.itemClass);
  }

  function finalizeCandidateMeta(meta) {
    const scopeOrder = ['base','class','special','unknown'];
    return {
      hints: meta.hints,
      weight: meta.weight,
      scope: scopeOrder.find(scope => meta.scopes.has(scope)) || 'unknown',
      sources: meta.sources,
      allowedItemClasses: meta.allowedItemClasses
    };
  }

  function recursivelyCollectKnownModIds(node, rawMods, callback, path = []) {
    const value = unroot(node);
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((entry, i) => {
        if (typeof entry === 'string' && rawMods[entry]) callback(entry, path.join(' '), null);
        else recursivelyCollectKnownModIds(entry, rawMods, callback, [...path, String(i)]);
      });
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (rawMods[key]) {
        callback(key, path.join(' '), typeof child === 'number' ? child : null);
        continue;
      }
      if (typeof child === 'string' && rawMods[child]) {
        callback(child, [...path, key].join(' '), null);
        continue;
      }
      recursivelyCollectKnownModIds(child, rawMods, callback, [...path, key]);
    }
  }

  function itemClassMatches(base, itemClass) {
    const baseTokens = POE_RULES.classTokens(base?.item_class);
    return Array.from(POE_RULES.classTokens(itemClass)).some(token => baseTokens.has(token));
  }

  function normalizeRepoeData(files) {
    const rawBases = unroot(files.base_items) || {};
    const rawMods = unroot(files.mods) || {};
    const modsByBase = unroot(files.mods_by_base) || {};
    const bases = [];
    const baseById = new Map();

    for (const [id, raw] of Object.entries(rawBases)) {
      if (!raw || raw.release_state === 'unreleased' || !raw.name) continue;
      const itemClass = raw.item_class || '';
      const seemsEquipment = EQUIPMENT_CLASSES.has(itemClass) ||
        [...EQUIPMENT_CLASSES].some(cls => cls.toLowerCase().replace(/\s/g,'') === String(itemClass).toLowerCase().replace(/\s/g,''));
      if (!seemsEquipment) continue;
      const base = {
        id,
        name: raw.name,
        item_class: itemClass,
        domain: raw.domain || 'item',
        drop_level: safeNumber(raw.drop_level, 1),
        tags: raw.tags || [],
        properties: raw.properties || {},
        implicits: raw.implicits || [],
        release_state: raw.release_state || 'released'
      };
      bases.push(base);
      baseById.set(id, base);
    }

    const candidateMap = new Map();
    const baseClassExtras = new Map();

    for (const [className, rawClassBranch] of Object.entries(modsByBase)) {
      const classBranch = unroot(rawClassBranch) || {};
      const classBaseIds = new Set();
      const classExtras = [];

      for (const [branchKey, rawTagSet] of Object.entries(classBranch)) {
        const tagSet = unroot(rawTagSet);
        if (!tagSet || typeof tagSet !== 'object') continue;
        const tagBases = Array.isArray(tagSet.bases) ? tagSet.bases : [];
        if (tagBases.length) {
          tagBases.forEach(id => classBaseIds.add(id));
          const modsNode = tagSet.mods || {};
          tagBases.forEach(baseId => {
            recursivelyCollectKnownModIds(modsNode, rawMods, (modId, hint, weight) => {
              addCandidate(candidateMap, baseId, modId, hint, weight, {
                scope:'base', source:`mods_by_base:${className}/${branchKey}`, itemClass:baseById.get(baseId)?.item_class
              });
            }, [className, branchKey]);
          });
        } else if (['synthesis','essences'].includes(branchKey.toLowerCase())) {
          recursivelyCollectKnownModIds(tagSet, rawMods, (modId, hint, weight) => classExtras.push({modId, hint: `${className} ${branchKey} ${hint}`, weight}));
        }
      }
      if (classExtras.length) baseClassExtras.set(className, { baseIds: classBaseIds, extras: classExtras });
    }

    for (const {baseIds, extras} of baseClassExtras.values()) {
      for (const baseId of baseIds) {
        for (const extra of extras) addCandidate(candidateMap, baseId, extra.modId, extra.hint, extra.weight, {
          scope:'class', source:'mods_by_base:class-special', itemClass:baseById.get(baseId)?.item_class
        });
      }
    }

    const benchOptions = unroot(files.crafting_bench_options) || [];
    if (Array.isArray(benchOptions)) {
      for (const option of benchOptions) {
        const modId = option?.actions?.add_mod;
        if (!modId || !rawMods[modId]) continue;
        const classes = Array.isArray(option.item_classes) ? option.item_classes : [];
        for (const base of bases) {
          if (!classes.some(itemClass => itemClassMatches(base, itemClass))) continue;
          addCandidate(candidateMap, base.id, modId, `crafting bench ${option.master || ''} ${option.bench_tier || ''}`, null, {
            scope:'class', source:'crafting_bench_options', itemClass:base.item_class
          });
        }
      }
    }

    const essences = unroot(files.essences) || {};
    for (const [essenceId, essence] of Object.entries(essences)) {
      const classMods = essence?.mods || {};
      for (const [itemClass, modId] of Object.entries(classMods)) {
        if (!modId || !rawMods[modId]) continue;
        for (const base of bases) {
          if (!itemClassMatches(base, itemClass)) continue;
          addCandidate(candidateMap, base.id, modId, `essence ${essence.name || essenceId} ${itemClass}`, null, {
            scope:'class', source:`essences:${essenceId}`, itemClass:base.item_class
          });
        }
      }
    }

    bases.sort((a,b) => a.item_class.localeCompare(b.item_class) || a.name.localeCompare(b.name));
    const normalizedCache = new Map();

    return {
      mode: 'repoe',
      metadata: {
        name: 'Current RePoE browser data',
        game: 'poe1',
        patch: 'current-export',
        source: 'repoe-fork.github.io',
        generated_at: new Date().toISOString()
      },
      bases,
      baseById,
      rawMods,
      candidateMap,
      normalizedCache,
      getModsForBase(base) {
        const candidateMeta = candidateMap.get(base.id);
        const accepted = [];
        const rejected = [];
        if (!candidateMeta) {
          this.poolDiagnostics.set(base.id, { candidates:0, accepted:0, rejected:0, rejectedExamples:[], coverage:'no-base-index' });
          return accepted;
        }
        for (const [modId, rawMeta] of candidateMeta.entries()) {
          const raw = rawMods[modId];
          if (!raw) continue;
          const meta = finalizeCandidateMeta(rawMeta);
          const cacheKey = `${modId}|${Array.from(meta.hints).sort().join(',')}|${meta.scope}|${Array.from(meta.allowedItemClasses).sort().join(',')}`;
          let mod = normalizedCache.get(cacheKey);
          if (!mod) {
            mod = normalizeRemoteMod(modId, raw, meta);
            normalizedCache.set(cacheKey, mod);
          }
          const legality = POE_RULES.baseCompatibility(mod, base, { requireCandidateEvidence:true });
          mod.base_rule_evaluation = legality;
          if (legality.valid) accepted.push(mod);
          else rejected.push({ id:mod.id, text:mod.display, reasons:legality.reasons });
        }
        POE_RULES.annotateInfluenceUpgradeTiers(accepted);
        assignDerivedTiers(accepted);
        this.poolDiagnostics.set(base.id, {
          candidates:candidateMeta.size,
          accepted:accepted.length,
          rejected:rejected.length,
          rejectedExamples:rejected.slice(0,20),
          coverage:'repoe-index-plus-browser-rules'
        });
        return accepted;
      },
      poolDiagnostics: new Map()

    };
  }

  function normalizeDemoData(data) {
    const bases = data.bases.slice().sort((a,b) => a.item_class.localeCompare(b.item_class) || a.name.localeCompare(b.name));
    const poolDiagnostics = new Map();
    return {
      mode: 'demo', metadata: data.metadata, bases, baseById: new Map(bases.map(b => [b.id,b])), mods: data.mods, poolDiagnostics,
      getModsForBase(base) {
        const candidates = data.mods.map(mod => ({...mod, candidate_scope:'demo', candidate_sources:['bundled-demo-applies_to']}));
        const accepted = [];
        const rejected = [];
        for (const mod of candidates) {
          const legality = POE_RULES.baseCompatibility(mod, base, { requireCandidateEvidence:false });
          mod.base_rule_evaluation = legality;
          if (legality.valid) accepted.push(mod); else rejected.push({id:mod.id,text:mod.display,reasons:legality.reasons});
        }
        POE_RULES.annotateInfluenceUpgradeTiers(accepted);
        assignDerivedTiers(accepted);
        poolDiagnostics.set(base.id, {candidates:candidates.length,accepted:accepted.length,rejected:rejected.length,rejectedExamples:rejected.slice(0,20),coverage:'bundled-demo-rules'});
        return accepted;
      }
    };
  }

  function assignDerivedTiers(mods) {
    const groups = new Map();
    for (const mod of mods) {
      if (!['prefix','suffix'].includes(mod.affix) || !['natural','influence','delve'].includes(mod.source)) continue;
      const key = `${mod.affix}|${mod.type}|${mod.source}|${mod.influence || ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(mod);
    }
    for (const group of groups.values()) {
      const ordinary = group.filter(mod => !mod.elevated);
      ordinary.sort((a,b) => b.required_level - a.required_level || safeNumber(b.weight) - safeNumber(a.weight));
      ordinary.forEach((mod, i) => { if (!mod.tier) mod.tier = `T${i+1}`; });
      group.filter(mod => mod.elevated).forEach(mod => { mod.tier = 'T0'; });
    }
  }

  function appliesToBase(mod, base) {
    return POE_RULES.baseCompatibility(mod, base, { requireCandidateEvidence: state.data?.mode === 'repoe' }).valid;
  }

  function currentBase() {
    return state.data?.baseById.get(state.selectedBaseId) || null;
  }

  let applicableCache = { key: null, mods: [], diagnostics: null };
  function applicablePool() {
    const base = currentBase();
    if (!base) return {mods:[], diagnostics:null};
    const key = `${state.data.metadata.name}|${base.id}`;
    if (applicableCache.key !== key) {
      const mods = state.data.getModsForBase(base);
      applicableCache = { key, mods, diagnostics: state.data.poolDiagnostics?.get(base.id) || null };
    }
    return applicableCache;
  }
  function applicableMods() { return applicablePool().mods; }

  function rareAffixLimits(base = currentBase()) {
    return POE_RULES.rareAffixLimits(base);
  }

  function affixLimits(base = currentBase(), rarity = state.rarity) {
    return POE_RULES.affixLimits(base, rarity);
  }

  function slotLimit(affix) {
    return affixLimits()[affix] ?? 0;
  }

  function selectedCount(affix, excludingId = null) {
    return state.selectedMods.filter(mod => mod.affix === affix && mod.id !== excludingId).length;
  }

  function craftedLimit(selected = state.selectedMods) {
    return selected.some(mod => mod.id === 'CraftedMultiMod' || /multiple crafted modifiers|multimod/i.test(`${mod.name} ${mod.display} ${mod.id}`)) ? 3 : 1;
  }

  function hasRecombinatorAccess() {
    return state.mechanicAccess.has('recombinator_selected') || state.mechanicAccess.has('recombinator_unpredictable');
  }

  function mechanicCandidatesForMod(mod) {
    if (!mod) return [];
    if (mod.elevated || mod.acquisition_mechanic === 'orb_of_dominance') return ['orb_of_dominance'];
    const sourceMap = {
      natural: ['core_currency','crafting_bench'],
      crafted: ['crafting_bench'],
      essence: ['essences'],
      fossil: ['fossils'],
      harvest: ['harvest'],
      delve: ['delve_drop_mods','fossils'],
      incursion: ['incursion_drop_mods','recombinator_selected','recombinator_unpredictable'],
      betrayal: ['betrayal_unveil','betrayal_drop_mods'],
      influence: ['influence_exalts','awakeners_orb','harvest_influence','recombinator_selected','recombinator_unpredictable'],
      eldritch: ['eldritch_implicits'],
      recombinator: ['recombinator_selected','recombinator_unpredictable'],
      infamous: ['mercenary_infamous','recombinator_selected','recombinator_unpredictable'],
      synthesis: ['synthesis_base_acquisition','legacy_synthesis_creation'],
      corruption: ['vaal_corruption','locus_corruption'],
      allflame: ['allflame_crafting','allflame_ducats']
    };
    return sourceMap[mod.source] || [];
  }

  function requiredMechanicSummary() {
    const requirements = [];
    for (const mod of state.selectedMods) {
      const candidates = mechanicCandidatesForMod(mod);
      if (!candidates.length) continue;
      const available = candidates.filter(id => state.mechanicAccess.has(id));
      requirements.push({
        mod_id: mod.id,
        text: mod.display,
        source: mod.source,
        candidate_mechanics: candidates,
        accessible_candidates: available,
        can_be_satisfied_by_prepared_base: state.allowPurchasedBase,
        inaccessible: available.length === 0 && !state.allowPurchasedBase
      });
    }
    const crafted = state.selectedMods.filter(mod => mod.source === 'crafted');
    if (crafted.length > craftedLimit(state.selectedMods)) {
      const candidates = ['recombinator_selected','recombinator_unpredictable'];
      requirements.push({
        rule:'multiple_crafted_modifiers_without_multimod',
        candidate_mechanics:candidates,
        accessible_candidates:candidates.filter(id => state.mechanicAccess.has(id)),
        can_be_satisfied_by_prepared_base:state.allowPurchasedBase,
        inaccessible:!hasRecombinatorAccess() && !state.allowPurchasedBase
      });
    }
    const fractured = state.selectedMods.filter(mod => mod.fractured);
    for (const mod of fractured) {
      const isTalisman = /talisman/i.test(`${currentBase()?.item_class || ''} ${currentBase()?.name || ''}`);
      const candidates = [
        ...(isTalisman ? ['talisman_fracture'] : []),
        'fracturing_orb','fractured_fossil','recombinator_selected','recombinator_unpredictable'
      ];
      requirements.push({
        mod_id:mod.id,
        rule:'fractured_modifier',
        candidate_mechanics:candidates,
        accessible_candidates:candidates.filter(id => state.mechanicAccess.has(id)),
        can_be_satisfied_by_prepared_base:state.allowPurchasedBase,
        inaccessible:candidates.every(id => !state.mechanicAccess.has(id)) && !state.allowPurchasedBase
      });
    }
    if (fractured.length > 1) {
      const candidates = ['recombinator_selected','recombinator_unpredictable'];
      requirements.push({
        rule:'multiple_fractured_modifiers',
        candidate_mechanics:candidates,
        accessible_candidates:candidates.filter(id => state.mechanicAccess.has(id)),
        can_be_satisfied_by_prepared_base:state.allowPurchasedBase,
        inaccessible:!hasRecombinatorAccess() && !state.allowPurchasedBase
      });
    }
    return requirements;
  }

  function mechanicAccessPayload() {
    const allowed = MECHANIC_DATA.mechanics.filter(m => state.mechanicAccess.has(m.id)).map(m => m.id);
    const excluded = MECHANIC_DATA.mechanics.filter(m => !state.mechanicAccess.has(m.id)).map(m => m.id);
    return {
      knowledge_package_id: MECHANIC_DATA.package_id,
      rules_patch: MECHANIC_DATA.patch,
      allow_prepared_or_purchased_starting_base: state.allowPurchasedBase,
      allowed_mechanics: allowed,
      excluded_mechanics: excluded,
      target_source_requirements: requiredMechanicSummary()
    };
  }

  function saveAccessPreferences() {
    try {
      localStorage.setItem('poe-target-forge/mechanic-access', JSON.stringify({
        allowed:Array.from(state.mechanicAccess),
        allowPurchasedBase:state.allowPurchasedBase
      }));
    } catch (_) {}
  }

  function loadAccessPreferences() {
    try {
      const raw = JSON.parse(localStorage.getItem('poe-target-forge/mechanic-access') || 'null');
      if (raw && Array.isArray(raw.allowed)) {
        state.mechanicAccess = new Set(raw.allowed.filter(id => MECHANIC_BY_ID.has(id)));
        state.allowPurchasedBase = raw.allowPurchasedBase !== false;
      }
    } catch (_) {}
  }

  function reconcileTargetConstraints(notify = false) {
    const prefixFull = selectedCount('prefix') >= slotLimit('prefix');
    const suffixFull = selectedCount('suffix') >= slotLimit('suffix');
    if (prefixFull && state.constraints.openPrefix) {
      state.constraints.openPrefix = false;
      els.openPrefix.checked = false;
      if (notify) toast('Open prefix was removed because every prefix slot is occupied.');
    }
    if (suffixFull && state.constraints.openSuffix) {
      state.constraints.openSuffix = false;
      els.openSuffix.checked = false;
      if (notify) toast('Open suffix was removed because every suffix slot is occupied.');
    }
    const prefixRow = els.openPrefix.closest('.toggle-row');
    const suffixRow = els.openSuffix.closest('.toggle-row');
    els.openPrefix.disabled = prefixFull;
    els.openSuffix.disabled = suffixFull;
    prefixRow?.classList.toggle('disabled', prefixFull);
    suffixRow?.classList.toggle('disabled', suffixFull);

    const minimumLevel = state.selectedMods.reduce((max, mod) => Math.max(max, safeNumber(mod.required_level, 1)), 1);
    if (state.itemLevel < minimumLevel) {
      state.itemLevel = minimumLevel;
      els.itemLevel.value = minimumLevel;
      if (notify) toast(`Item level was raised to ${minimumLevel} for the selected modifiers.`);
    }
    if (state.rarity === 'magic' && (selectedCount('prefix') > slotLimit('prefix') || selectedCount('suffix') > slotLimit('suffix'))) {
      state.rarity = 'rare';
      els.rarity.value = 'rare';
      if (notify) toast('Rarity was restored to Rare because the target has too many affixes for a Magic item.');
    }
    if (!state.constraints.allowCrafted && state.selectedMods.some(mod => mod.source === 'crafted')) {
      state.constraints.allowCrafted = true;
      els.allowCrafted.checked = true;
      if (notify) toast('Crafted modifiers remain enabled because the target contains one.');
    }
  }

  function validateMod(mod, options = {}) {
    const reasons = [];
    const base = currentBase();
    const selected = state.selectedMods;
    const isSelected = selected.some(existing => existing.id === mod.id);
    const projectedSelected = isSelected || !options.forAdd ? selected : [...selected, mod];

    if (!base) reasons.push({ code:'NO_BASE', message:'Choose an item base first.' });
    else {
      const baseValidation = POE_RULES.baseCompatibility(mod, base, { requireCandidateEvidence: state.data.mode === 'repoe' });
      baseValidation.reasons.forEach(reason => reasons.push(reason));
    }

    if (state.itemLevel < safeNumber(mod.required_level, 1)) {
      reasons.push({ code:'ITEM_LEVEL', message:`Requires item level ${mod.required_level}.` });
    }

    const influenceRule = POE_RULES.influenceCompatibility(mod, state.influences, { maximum:2 });
    const projectedInfluences = new Set(state.influences);
    if (options.forAdd && influenceRule.valid && influenceRule.required) projectedInfluences.add(influenceRule.required);
    if (options.forAdd && !influenceRule.valid) {
      reasons.push({ code:influenceRule.code || 'INFLUENCE_LIMIT', message:influenceRule.message || 'This modifier would require an illegal influence combination.' });
    } else if (!options.forAdd && mod.influence && !state.influences.has(mod.influence)) {
      reasons.push({ code:'INFLUENCE_MISSING', message:`The selected modifier requires ${humanize(mod.influence)} influence, but that influence is not active.` });
    }
    if (mod.source === 'crafted' && !state.constraints.allowCrafted) {
      reasons.push({ code:'CRAFTED_DISABLED', message:'Crafted modifiers are disabled by the target constraints.' });
    }
    if (isSelected && options.forAdd) reasons.push({ code:'ALREADY_SELECTED', message:'Already selected.' });

    if (['prefix','suffix','implicit'].includes(mod.affix)) {
      const reserve = mod.affix === 'prefix' && state.constraints.openPrefix ? 1 : mod.affix === 'suffix' && state.constraints.openSuffix ? 1 : 0;
      const physicalLimit = slotLimit(mod.affix);
      const count = selectedCount(mod.affix, isSelected ? mod.id : null) + (isSelected ? 1 : options.forAdd ? 1 : 0);
      // Optional open-slot constraints should not make a physically legal mod card unavailable.
      // Adding the final physical affix automatically clears the corresponding open-slot request.
      const effectiveLimit = options.forAdd ? physicalLimit : physicalLimit - reserve;
      if (count > effectiveLimit) {
        reasons.push({ code:'SLOT_LIMIT', message:`No legal ${mod.affix} slot remains.` });
      }
    }

    const conflictInfo = POE_RULES.groupConflict(mod, selected);
    if (conflictInfo) {
      reasons.push({ code:'GROUP_CONFLICT', message:`Conflicts with “${conflictInfo.conflict.display}” in modifier group ${conflictInfo.group}.` });
    }

    if (mod.source === 'crafted') {
      const totalCrafted = projectedSelected.filter(m => m.source === 'crafted').length;
      if (totalCrafted > craftedLimit(projectedSelected) && !hasRecombinatorAccess() && !state.allowPurchasedBase) {
        reasons.push({ code:'CRAFTED_LIMIT_ACCESS', message:`More than ${craftedLimit(projectedSelected)} crafted modifier requires a recombinator-created or prepared starting item.` });
      }
    }

    const projectedSynthesis = projectedSelected.some(m => m.source === 'synthesis');
    const projectedEldritch = projectedSelected.some(m => m.source === 'eldritch');
    const projectedFractured = projectedSelected.some(m => m.fractured);
    if (projectedSynthesis && projectedInfluences.size) reasons.push({code:'SYNTH_INFLUENCE', message:'Synthesised items cannot also carry Shaper, Elder or Conqueror influence.'});
    if (projectedEldritch && projectedInfluences.size) reasons.push({code:'ELDRITCH_INFLUENCE', message:'Eldritch implicits cannot coexist with Shaper, Elder or Conqueror influence.'});
    if (projectedSynthesis && projectedEldritch) reasons.push({code:'IMPLICIT_FAMILY', message:'Synthesised and Eldritch implicits cannot coexist; applying Eldritch implicits replaces Synthesis implicits.'});
    if (projectedFractured && (projectedSynthesis || projectedInfluences.size)) reasons.push({code:'FRACTURE_STATE', message:'A fractured target cannot also be synthesised or conventionally influenced.'});

    return { valid: reasons.length === 0, reasons };
  }

  function validateWholeTarget() {
    const issues = [];
    if (!currentBase()) issues.push({severity:'error', code:'NO_BASE', message:'No base item selected.'});
    if (state.influences.size > 2) issues.push({severity:'error', code:'INFLUENCE_LIMIT', message:'An item cannot have more than two influences in this model.'});

    for (const mod of state.selectedMods) {
      const validation = validateMod(mod, {forAdd:false});
      validation.reasons.forEach(reason => issues.push({severity:'error', mod_id:mod.id, ...reason}));
    }

    for (const affix of ['prefix','suffix','implicit']) {
      const reserve = affix === 'prefix' && state.constraints.openPrefix ? 1 : affix === 'suffix' && state.constraints.openSuffix ? 1 : 0;
      const count = selectedCount(affix);
      if (count > slotLimit(affix) - reserve) issues.push({severity:'error', code:'SLOT_LIMIT', message:`Target uses ${count} ${affix} modifiers but only ${slotLimit(affix)-reserve} may be occupied.`});
    }

    const inaccessibleRequirements = requiredMechanicSummary().filter(req => req.inaccessible);
    inaccessibleRequirements.forEach(req => issues.push({severity:'error', code:'MECHANIC_ACCESS', message:req.text ? `No accessible origin or transfer mechanic remains for “${req.text}”.` : `No accessible mechanic remains for ${humanize(req.rule)}.`}));
    const preparedOnly = requiredMechanicSummary().filter(req => !req.inaccessible && req.accessible_candidates?.length === 0 && req.can_be_satisfied_by_prepared_base);
    if (preparedOnly.length) issues.push({severity:'warning', code:'PREPARED_BASE_REQUIRED', message:`${preparedOnly.length} target requirement${preparedOnly.length===1?'':'s'} must already exist on a purchased or prepared starting item.`});
    if (state.selectedMods.some(m => ['essence','delve','incursion','betrayal','synthesis','corruption','recombinator','infamous','allflame','other'].includes(m.source))) {
      issues.push({severity:'warning', code:'SPECIAL_SOURCE', message:'Special-source and transfer routes are represented in the agent knowledge package; exact outcome odds remain patch-sensitive.'});
    }
    if (state.data?.mode === 'repoe') {
      issues.push({severity:'warning', code:'ADAPTER_SCOPE', message:'RePoE supplies the mod pool and groups; exceptional item-state rules are layered on by this site and its agent knowledge package.'});
    }
    return { valid: !issues.some(i => i.severity === 'error'), issues };
  }

  function sourceLabel(mod) {
    if (mod.source === 'influence' && mod.influence) return `${humanize(mod.influence)} influence`;
    return SOURCE_META[mod.source || 'other']?.short || humanize(mod.source || 'other');
  }

  function setData(data, preferredBaseId = null) {
    state.data = data;
    applicableCache = {key:null,mods:[],diagnostics:null};
    const preferred = preferredBaseId && data.baseById.has(preferredBaseId) ? preferredBaseId : null;
    const defaultBase = preferred || data.bases.find(b => /Two-Toned Boots/i.test(b.name))?.id || data.bases[0]?.id || null;
    state.selectedBaseId = defaultBase;
    state.selectedMods = [];
    state.influences.clear();
    renderAll();
  }

  function renderAll() {
    renderDataBanner();
    renderInfluences();
    renderBaseCard();
    renderMechanicAccess();
    reconcileTargetConstraints(false);
    renderSourceControls();
    renderModList();
    renderTarget();
    renderLegality();
    renderStrategy();
  }

  function renderDataBanner() {
    const md = state.data?.metadata || {};
    if (state.data?.mode === 'demo') {
      els.dataModeLabel.textContent = 'Offline demo data';
      els.dataModeDetail.textContent = `${state.data.bases.length} bases and ${state.data.mods.length} representative modifiers. Load RePoE for current data.`;
    } else {
      els.dataModeLabel.textContent = md.name || 'RePoE data loaded';
      els.dataModeDetail.textContent = `${state.data.bases.length.toLocaleString()} equipment bases. Candidate pools are revalidated locally before display.`;
    }
  }

  function renderInfluences() {
    const incompatibleState = state.selectedMods.some(mod => mod.source === 'synthesis' || mod.source === 'eldritch' || mod.fractured);
    els.influenceControls.innerHTML = INFLUENCES.map(inf => {
      const active = state.influences.has(inf);
      const requiredByMod = state.selectedMods.some(mod => mod.influence === inf);
      const blockedByLimit = !active && state.influences.size >= 2;
      const blockedByState = !active && incompatibleState;
      const disabled = blockedByLimit || blockedByState;
      const title = blockedByLimit
        ? 'Two influences are already active. Remove one before adding another.'
        : blockedByState
          ? 'Conventional influence cannot be added to this synthesised, eldritch or fractured target.'
          : requiredByMod
            ? `Required by a selected ${humanize(inf)} modifier.`
            : `Toggle ${humanize(inf)} influence.`;
      return `<label class="chip-check ${disabled ? 'disabled' : ''} ${requiredByMod ? 'required' : ''}" title="${escapeHTML(title)}">
        <input type="checkbox" data-influence="${inf}" ${active ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
        <span>${escapeHTML(inf)}${requiredByMod ? ' •' : ''}</span>
      </label>`;
    }).join('');
  }

  function renderMechanicAccess() {
    if (!els.mechanicAccessControls) return;
    els.allowPurchasedBase.checked = state.allowPurchasedBase;
    const required = requiredMechanicSummary();
    const requiredIds = new Set(required.flatMap(req => req.candidate_mechanics || []));
    const groups = MECHANIC_DATA.categories.map(category => {
      const mechanics = MECHANIC_DATA.mechanics.filter(mechanic => mechanic.category === category.id);
      if (!mechanics.length) return '';
      const enabled = mechanics.filter(mechanic => state.mechanicAccess.has(mechanic.id)).length;
      return `<details class="mechanic-group" ${category.id==='core' || category.id==='targeted' ? 'open' : ''}>
        <summary><span>${escapeHTML(category.label)}</span><span>${enabled}/${mechanics.length}</span></summary>
        <div class="mechanic-group-body">${mechanics.map(mechanic => {
          const checked = state.mechanicAccess.has(mechanic.id);
          const requiredClass = requiredIds.has(mechanic.id) && !checked ? 'unavailable-required' : '';
          return `<label class="mechanic-option ${requiredClass}">
            <input type="checkbox" data-mechanic-id="${escapeHTML(mechanic.id)}" ${checked?'checked':''} />
            <span><strong>${escapeHTML(mechanic.label)}</strong><small>${escapeHTML(mechanic.summary)} · ${escapeHTML(mechanic.status)}</small></span>
          </label>`;
        }).join('')}</div>
      </details>`;
    }).join('');
    els.mechanicAccessControls.innerHTML = groups;
    const enabledCount = state.mechanicAccess.size;
    const inaccessible = required.filter(req => req.inaccessible).length;
    els.mechanicAccessSummary.innerHTML = `${enabledCount}/${MECHANIC_DATA.mechanics.length} mechanics allowed${inaccessible ? ` · <span class="required-mechanic-warning">${inaccessible} target requirement${inaccessible===1?'':'s'} blocked</span>` : ''}`;
  }

  function applyMechanicPreset(preset) {
    if (preset === 'all-current') {
      state.mechanicAccess = new Set(MECHANIC_DATA.mechanics.filter(m => m.status !== 'legacy').map(m => m.id));
    } else if (preset === 'none') {
      state.mechanicAccess = new Set();
    } else if (preset === 'common') {
      state.mechanicAccess = new Set(['core_currency','crafting_bench','metamods','vendor_recipes','socket_link_quality','omens','mirror_copying','essences','fossils','harvest','bestiary','betrayal_unveil','influence_exalts','awakeners_orb','orb_of_dominance','eldritch_implicits','eldritch_currency','fracturing_orb','vaal_corruption','catalysts','anoints']);
    } else if (preset === 'ssf') {
      state.mechanicAccess = new Set(['core_currency','crafting_bench','metamods','vendor_recipes','socket_link_quality','omens','mirror_copying','essences','fossils','harvest','bestiary','betrayal_unveil','rog','eldritch_implicits','eldritch_currency','fracturing_orb','vaal_corruption','catalysts','anoints','memory_strands']);
      state.constraints.ssf = true;
      els.ssfMode.checked = true;
    }
    saveAccessPreferences();
    renderMechanicAccess(); renderModList(); renderLegality(); renderStrategy();
  }

  function renderBaseCard() {
    const base = currentBase();
    if (!base) {
      els.selectedBaseCard.className = 'base-card empty';
      els.selectedBaseCard.textContent = 'Search and select an equipment base.';
      return;
    }
    const props = Object.entries(base.properties || {}).slice(0,4).map(([k,v]) => `<span class="meta-chip">${escapeHTML(humanize(k))}: ${escapeHTML(typeof v === 'object' ? JSON.stringify(v) : v)}</span>`).join('');
    els.selectedBaseCard.className = 'base-card';
    els.selectedBaseCard.innerHTML = `
      <div class="base-title"><strong>${escapeHTML(base.name)}</strong><small>${escapeHTML(base.item_class)}</small></div>
      <div class="base-meta">
        <span class="meta-chip">Drop level ${base.drop_level}</span>
        ${props}
      </div>`;
    els.baseSearch.value = base.name;
  }

  function renderBaseResults(query = '') {
    const q = query.trim().toLowerCase();
    const matches = state.data.bases.filter(base => !q || `${base.name} ${base.item_class} ${base.tags.join(' ')}`.toLowerCase().includes(q)).slice(0,80);
    els.baseResults.innerHTML = matches.map(base => `
      <div class="combo-option ${base.id === state.selectedBaseId ? 'active' : ''}" data-base-id="${escapeHTML(base.id)}">
        <div><strong>${escapeHTML(base.name)}</strong><span>${escapeHTML(base.item_class)}</span></div>
        <span>lvl ${base.drop_level}</span>
      </div>`).join('') || '<div class="combo-option"><span>No matching bases.</span></div>';
    els.baseResults.hidden = false;
  }

  function allSources(mods) {
    return Array.from(new Set(mods.map(m => m.source || 'other'))).sort((a,b) => { const ai=SOURCE_ORDER.indexOf(a), bi=SOURCE_ORDER.indexOf(b); return (ai<0?999:ai)-(bi<0?999:bi); });
  }

  function sourceMeta(source) {
    return SOURCE_META[source] || { label:humanize(source), short:humanize(source), description:'Special modifier source.' };
  }

  function renderSourceControls() {
    const sources = allSources(applicableMods());
    const current = sources.includes(state.filters.source) ? state.filters.source : 'all';
    state.filters.source = current;
    els.sourceFilter.innerHTML = '<option value="all">All source groups</option>' + sources.map(source => {
      const meta = sourceMeta(source);
      return `<option value="${escapeHTML(source)}" ${current===source?'selected':''}>${escapeHTML(meta.label)}</option>`;
    }).join('');
    els.sourcePills.innerHTML = [`<button class="source-pill ${current==='all'?'active':''}" data-source-pill="all">All sources</button>`]
      .concat(sources.map(source => {
        const count = applicableMods().filter(mod => mod.source === source).length;
        return `<button class="source-pill ${current===source?'active':''}" data-source-pill="${escapeHTML(source)}">${escapeHTML(sourceMeta(source).short)} <span>${count}</span></button>`;
      })).join('');
  }

  function modSearchText(mod) {
    return [mod.id,mod.name,mod.display,mod.affix,mod.source,mod.influence,mod.type,...(mod.tags||[]),...(mod.stats||[]).map(s=>s.id)].join(' ').toLowerCase();
  }

  function affixLabel(affix) {
    return affix === 'prefix' ? 'Prefixes' : affix === 'suffix' ? 'Suffixes' : affix === 'implicit' ? 'Implicits' : humanize(affix);
  }

  function primaryModGroup(mod) {
    return (mod.groups && mod.groups[0]) || mod.group || mod.type || mod.name || mod.id;
  }

  function modFamilyKey(mod) {
    return [mod.source || 'other', mod.affix || 'other', primaryModGroup(mod)].join('::');
  }

  function tierNumber(value) {
    const match = String(value || '').match(/(?:^|\b)T(?:ier\s*)?(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  function sortFamilyTiers(mods) {
    return [...mods].sort((a,b) => {
      const at = tierNumber(a.tier), bt = tierNumber(b.tier);
      if (at !== null || bt !== null) return (at ?? 999) - (bt ?? 999) || safeNumber(b.required_level)-safeNumber(a.required_level);
      return safeNumber(b.required_level)-safeNumber(a.required_level) || safeNumber(b.weight)-safeNumber(a.weight) || a.display.localeCompare(b.display);
    });
  }

  function effectiveTierLabel(mod, index, familySize) {
    if (mod.elevated) return 'T0';
    if (mod.tier) return mod.tier;
    if (familySize > 1 && ['natural','influence','delve','incursion'].includes(mod.source)) return `T${index + 1}`;
    return sourceMeta(mod.source).short;
  }

  function familyName(mods) {
    const first = mods[0];
    const names = Array.from(new Set(mods.map(mod => String(mod.name || '').trim()).filter(Boolean)));
    if (names.length === 1) return names[0];
    return humanize(primaryModGroup(first));
  }

  function familyMetrics(mods) {
    const levels = mods.map(mod => safeNumber(mod.required_level, 1));
    const weights = mods.map(mod => safeNumber(mod.weight, 0));
    return {
      maxLevel: Math.max(...levels),
      maxWeight: Math.max(...weights),
      available: mods.filter(mod => validateMod(mod,{forAdd:true}).valid).length,
      selected: mods.filter(mod => state.selectedMods.some(selected => selected.id === mod.id)).length
    };
  }

  function compareFamilies(a, b) {
    const am = familyMetrics(a.mods), bm = familyMetrics(b.mods);
    if (am.selected !== bm.selected) return bm.selected - am.selected;
    if (state.filters.sort === 'level' && am.maxLevel !== bm.maxLevel) return bm.maxLevel-am.maxLevel;
    if (state.filters.sort === 'weight' && am.maxWeight !== bm.maxWeight) return bm.maxWeight-am.maxWeight;
    return a.name.localeCompare(b.name) || bm.maxLevel-am.maxLevel;
  }

  function familySelectedTier(mods) {
    const tiers = sortFamilyTiers(mods);
    const key = modFamilyKey(tiers[0]);
    const alreadySelected = tiers.find(mod => state.selectedMods.some(selected => selected.id === mod.id));
    const rememberedId = state.familyTierSelection.get(key);
    const remembered = tiers.find(mod => mod.id === rememberedId);
    const firstAvailable = tiers.find(mod => validateMod(mod, {forAdd:true}).valid);
    const chosen = alreadySelected || remembered || firstAvailable || tiers[0];
    state.familyTierSelection.set(key, chosen.id);
    return chosen;
  }

  function tierRequirementLabel(mod) {
    if (mod.elevated) return 'T0 · upgrade only';
    return `${effectiveTierLabel(mod,0,1)} · iLvl ${safeNumber(mod.required_level,1)}`;
  }

  function renderModFamily(mods) {
    const tiers = sortFamilyTiers(mods);
    const key = modFamilyKey(tiers[0]);
    const name = familyName(tiers);
    const metrics = familyMetrics(tiers);
    const selected = metrics.selected > 0;
    const chosen = familySelectedTier(tiers);
    const chosenValidation = validateMod(chosen, {forAdd:true});
    const chosenSelected = state.selectedMods.some(existing => existing.id === chosen.id);
    const reason = chosenValidation.reasons[0]?.message || '';
    const weight = chosen.elevated ? 'Upgrade' : chosen.weight !== null && chosen.weight !== undefined ? Number(chosen.weight).toLocaleString() : '—';
    const optionHtml = tiers.map((mod,index) => {
      const validation = validateMod(mod,{forAdd:true});
      const label = mod.elevated
        ? 'T0 Elevated · upgrade only'
        : `${effectiveTierLabel(mod,index,tiers.length)} · iLvl ${safeNumber(mod.required_level,1)}`;
      return `<option value="${escapeHTML(mod.id)}" ${mod.id===chosen.id?'selected':''} ${!validation.valid && !state.selectedMods.some(existing=>existing.id===mod.id)?'disabled':''}>${escapeHTML(label)}</option>`;
    }).join('');
    const title = [chosen.id, `Group: ${primaryModGroup(chosen)}`, ...(chosenValidation.reasons || []).map(entry => entry.message)].join('\n');
    return `<article class="mod-family family-select-row ${selected?'selected':''} ${metrics.available===0?'fully-unavailable':''}" data-mod-family="${escapeHTML(key)}" title="${escapeHTML(title)}">
      <div class="family-main-line">
        <span class="family-status ${selected?'selected':''}">${selected?'✓':metrics.available?'':'×'}</span>
        <strong class="family-compact-name">${escapeHTML(name)}</strong>
        <select class="family-tier-select" data-family-tier-select="${escapeHTML(key)}" aria-label="Choose tier for ${escapeHTML(name)}">${optionHtml}</select>
        <button class="tier-add-button family-add-button" data-add-mod="${escapeHTML(chosen.id)}" ${chosenValidation.valid && !chosenSelected?'':'disabled'} aria-label="${chosenSelected?'Modifier already selected':`Add ${escapeHTML(chosen.display)}`}">${chosenSelected?'✓':'+'}</button>
      </div>
      <div class="family-detail-line ${chosenValidation.valid?'':'unavailable'}">
        <span class="family-detail-text">${escapeHTML(chosen.display)}</span>
        <span class="family-detail-meta">${escapeHTML(sourceMeta(chosen.source).short)} · ${escapeHTML(chosen.elevated ? `T0 via Orb of Dominance · precursor T1 iLvl ${chosen.precursor_required_level || 'unknown'}` : `iLvl ${chosen.required_level}`)} · ${escapeHTML(weight)}</span>
        ${reason ? `<small>${escapeHTML(reason)}</small>` : ''}
      </div>
    </article>`;
  }

  function buildFamilies(mods) {
    const map = new Map();
    for (const mod of mods) {
      const key = modFamilyKey(mod);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(mod);
    }
    return Array.from(map.values()).map(group => ({ name:familyName(group), mods:group })).sort(compareFamilies);
  }

  function renderAffixColumn(affix, mods) {
    if (!mods.length) return '';
    const families = buildFamilies(mods);
    const available = mods.filter(mod => validateMod(mod,{forAdd:true}).valid).length;
    return `<section class="coe-affix-column ${escapeHTML(affix)} ${affix==='implicit'||affix==='other'?'wide':''}">
      <header class="coe-affix-header">
        <span class="affix-marker ${escapeHTML(affix)}">${affix==='prefix'?'P':affix==='suffix'?'S':'I'}</span>
        <strong>${escapeHTML(affixLabel(affix))}</strong>
        <small>${available}/${mods.length} selectable</small>
      </header>
      <div class="mod-family-list">${families.map(family => renderModFamily(family.mods)).join('')}</div>
    </section>`;
  }

  function currentFilteredMods() {
    const pool = applicablePool();
    const q = state.filters.query.trim().toLowerCase();
    return pool.mods.filter(mod => {
      if (state.filters.side !== 'all' && mod.affix !== state.filters.side) return false;
      if (state.filters.source !== 'all' && mod.source !== state.filters.source) return false;
      if (q && !modSearchText(mod).includes(q)) return false;
      const available = validateMod(mod, {forAdd:true}).valid;
      if (!state.filters.showUnavailable && !available) return false;
      return true;
    });
  }

  function renderModList() {
    const pool = applicablePool();
    let filtered = currentFilteredMods();
    const totalFiltered = filtered.length;
    filtered = filtered.slice(0, MAX_RENDERED_MODS);
    const selectedTotal = state.selectedMods.length;
    const diagnostics = pool.diagnostics;
    const rejectedText = diagnostics?.rejected ? ` · ${diagnostics.rejected.toLocaleString()} rejected by base rules` : '';
    els.poolSummary.textContent = `${pool.mods.length.toLocaleString()} legal-on-base mods${diagnostics?.candidates ? ` from ${diagnostics.candidates.toLocaleString()} candidates` : ''}${rejectedText} · ${selectedTotal} selected${totalFiltered > MAX_RENDERED_MODS ? ` · first ${MAX_RENDERED_MODS.toLocaleString()} matches shown` : ''}`;

    if (!currentBase()) {
      els.modList.innerHTML = '<div class="mod-list-empty">Choose a base to populate the modifier browser.</div>';
      return;
    }
    if (!filtered.length) {
      els.modList.innerHTML = '<div class="mod-list-empty">No legal modifiers match these filters.<br>Try another source, side or search.</div>';
      return;
    }

    const sourceGroups = new Map();
    for (const mod of filtered) {
      const source = mod.source || 'other';
      if (!sourceGroups.has(source)) sourceGroups.set(source, new Map());
      const byAffix = sourceGroups.get(source);
      if (!byAffix.has(mod.affix)) byAffix.set(mod.affix, []);
      byAffix.get(mod.affix).push(mod);
    }

    const html = [];
    const orderedSources = [...sourceGroups.keys()].sort((a,b) => {
      const ai=SOURCE_ORDER.indexOf(a), bi=SOURCE_ORDER.indexOf(b);
      return (ai<0?999:ai)-(bi<0?999:bi);
    });
    for (const source of orderedSources) {
      const byAffix = sourceGroups.get(source);
      const groupMods = Array.from(byAffix.values()).flat();
      const availableCount = groupMods.filter(mod => validateMod(mod,{forAdd:true}).valid).length;
      const hasSelected = groupMods.some(mod => state.selectedMods.some(selected => selected.id === mod.id));
      const isOpen = state.filters.query || state.filters.source !== 'all' || state.openSourceGroups.has(source) || hasSelected;
      const meta = sourceMeta(source);
      html.push(`<details class="mod-source-group coe-source-group" data-source-group="${escapeHTML(source)}" ${isOpen?'open':''}>
        <summary>
          <span class="source-summary-copy"><strong>${escapeHTML(meta.label)}</strong><small>${escapeHTML(meta.description)}</small></span>
          <span class="source-summary-count">${availableCount}/${groupMods.length}</span>
        </summary>
        <div class="source-group-body coe-affix-grid">
          ${['prefix','suffix','implicit','other'].map(affix => renderAffixColumn(affix, byAffix.get(affix) || [])).join('')}
        </div>
      </details>`);
    }
    els.modList.className = `mod-list source-categorized coe-mod-list ${state.filters.density === 'compact' ? 'compact' : ''}`;
    els.modList.innerHTML = html.join('');
  }

  function readableItemText() {
    const base = currentBase();
    if (!base) return 'No base selected';
    const rarityName = state.rarity === 'magic' ? 'Magic' : 'Rare';
    const lines = [
      'Item Class: ' + base.item_class,
      'Rarity: ' + rarityName,
      `Target ${base.name}`,
      '--------',
      `Item Level: ${state.itemLevel}`,
      `Quality: ${state.quality}%`
    ];
    if (state.influences.size) lines.push(`Influences: ${Array.from(state.influences).map(humanize).join(', ')}`);
    if (Array.isArray(base.implicits) && base.implicits.length) {
      lines.push('--------', ...base.implicits.map(value => typeof value === 'string' ? value : `Base implicit: ${value}`));
    }
    if (state.selectedMods.length) {
      lines.push('--------');
      state.selectedMods.forEach(mod => lines.push(mod.display + (mod.source === 'crafted' ? ' (crafted)' : '')));
    }
    if (state.constraints.openPrefix || state.constraints.openSuffix) {
      lines.push('--------');
      if (state.constraints.openPrefix) lines.push('[Target constraint: open prefix]');
      if (state.constraints.openSuffix) lines.push('[Target constraint: open suffix]');
    }
    return lines.join('\n');
  }

  function renderTarget() {
    const base = currentBase();
    els.targetItemName.textContent = base ? base.name : 'Unformed Item';
    if (!base) {
      els.itemPreview.innerHTML = '<div class="item-empty-line">Choose a base.</div>';
      return;
    }
    const props = Object.entries(base.properties || {}).slice(0,5).map(([k,v]) => `${humanize(k)}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('<br>');
    const baseImplicits = (base.implicits || []).map(imp => `<div class="item-mod-line">${escapeHTML(typeof imp === 'string' ? imp : `Base implicit: ${imp}`)}</div>`).join('');
    const mods = state.selectedMods.map(mod => `<div class="item-mod-line ${mod.source==='crafted'?'crafted':''} ${mod.source==='influence'?'influence':''} ${mod.fractured?'fractured':''}">${escapeHTML(mod.display)}${mod.source==='crafted'?' (crafted)':''}${mod.fractured?' (fractured)':''}${mod.elevated?' (elevated)':''}</div>`).join('');
    els.itemPreview.innerHTML = `
      <div class="item-title-block">
        <div class="rarity-line">Target ${state.rarity === 'magic' ? 'Magic' : 'Rare'}</div>
        <div class="base-line">${escapeHTML(base.name)}</div>
      </div>
      <div class="item-info">
        Item Class: ${escapeHTML(base.item_class)}<br>
        Item Level: ${state.itemLevel}<br>
        Quality: ${state.quality}%${state.influences.size ? `<br>${escapeHTML(Array.from(state.influences).map(humanize).join(' / '))} Influenced` : ''}
        ${props ? `<br>${props}` : ''}
      </div>
      <div class="item-mods">
        ${baseImplicits}
        ${baseImplicits && mods ? '<div style="height:6px"></div>' : ''}
        ${mods || '<div class="item-empty-line">Add modifiers from the browser.</div>'}
        ${(state.constraints.openPrefix || state.constraints.openSuffix) ? `<div class="item-requirement">${state.constraints.openPrefix?'Open prefix required. ':''}${state.constraints.openSuffix?'Open suffix required.':''}</div>` : ''}
      </div>`;

    if (!state.selectedMods.length) {
      els.selectedMods.innerHTML = '<div class="selected-empty">Nothing selected yet. Add a modifier from the center panel.</div>';
    } else {
      els.selectedMods.innerHTML = state.selectedMods.map(mod => `
        <div class="selected-mod" draggable="true" data-selected-mod="${escapeHTML(mod.id)}">
          <span class="drag-handle">⋮⋮</span>
          <div class="selected-mod-text"><strong>${escapeHTML(mod.display)}</strong><span>${escapeHTML(mod.affix)} · ${escapeHTML(sourceLabel(mod))}</span></div>
          <div class="selected-mod-actions">
            ${mod.source==='influence' && !mod.is_upgrade_only ? `<button class="state-pill ${mod.elevated?'active':''}" data-toggle-elevated="${escapeHTML(mod.id)}" title="Require the elevated version">Elevated</button>` : mod.elevated ? `<span class="state-pill active fixed" title="Upgrade-only elevated modifier">T0 Elevated</span>` : ''}
            ${['prefix','suffix'].includes(mod.affix) ? `<button class="state-pill ${mod.fractured?'active':''}" data-toggle-fracture="${escapeHTML(mod.id)}" title="Require this modifier to be fractured">Fractured</button>` : ''}
            <button class="remove-mod" data-remove-mod="${escapeHTML(mod.id)}" aria-label="Remove">×</button>
          </div>
        </div>`).join('');
    }
  }

  function renderLegality() {
    const result = validateWholeTarget();
    const prefixCount = selectedCount('prefix');
    const suffixCount = selectedCount('suffix');
    els.legalitySummary.className = `legality-summary ${result.valid?'valid':'invalid'}`;
    els.legalitySummary.innerHTML = `
      <span class="legality-title">${result.valid ? '✓ Target passes modeled rules' : '✕ Target has conflicts'}</span>
      <span class="legality-counts">P ${prefixCount}/${slotLimit('prefix')}${state.constraints.openPrefix?' (1 open)':''} · S ${suffixCount}/${slotLimit('suffix')}${state.constraints.openSuffix?' (1 open)':''}</span>`;
    const uniqueIssues = [];
    const seen = new Set();
    result.issues.forEach(issue => {
      const key = `${issue.severity}|${issue.code}|${issue.message}`;
      if (!seen.has(key)) { seen.add(key); uniqueIssues.push(issue); }
    });
    els.legalityIssues.innerHTML = uniqueIssues.length ? uniqueIssues.slice(0,8).map(issue => `<div class="issue ${issue.severity}"><span>${issue.severity==='error'?'!':'△'}</span><span>${escapeHTML(issue.message)}</span></div>`).join('') : '<div class="issue"><span>✓</span><span>No conflicts found.</span></div>';
  }

  function buildStrategy() {
    const mods = state.selectedMods;
    if (!mods.length) return {
      title: 'Define the target first',
      steps: ['Select the affixes that matter, including desired tiers and any open-slot requirement.', 'Export the packet when the target passes the modeled legality checks.'],
      note: 'The strategy generator becomes more specific as source types and affix sides are selected.'
    };
    const steps = [];
    const sources = new Set(mods.map(m => m.source));
    const inaccessible = requiredMechanicSummary().filter(req => req.inaccessible);
    const influenceMods = mods.filter(m => m.influence);
    const prefixes = mods.filter(m => m.affix === 'prefix');
    const suffixes = mods.filter(m => m.affix === 'suffix');
    const hardest = mods.slice().sort((a,b) => (safeNumber(a.weight,999999)-safeNumber(b.weight,999999)) || b.required_level-a.required_level)[0];

    if (inaccessible.length) steps.push(`Resolve ${inaccessible.length} blocked source requirement${inaccessible.length===1?'':'s'} by enabling a compatible mechanic or allowing a prepared starting base.`);
    steps.push(`Acquire an item-level ${state.itemLevel}+ ${currentBase()?.name || 'base'}${state.influences.size ? ` with ${Array.from(state.influences).map(humanize).join(' + ')} influence` : ''}.`);
    if (sources.has('synthesis')) steps.push('Start from the required synthesised base; synthesised implicits are a base-acquisition constraint, not a normal reroll outcome.');
    if (sources.has('corruption')) steps.push('Treat the corruption implicit as the final or near-final step unless a mechanic explicitly preserves further crafting.');
    if (sources.has('essence')) {
      const essence = mods.find(m => m.source === 'essence');
      steps.push(`Use the corresponding essence to force “${essence.display}” while rolling the remaining affixes.`);
    }
    if (influenceMods.length === 1) {
      steps.push(`Prioritize the ${humanize(influenceMods[0].influence)} modifier “${influenceMods[0].display}” using influence-aware rerolls or targeted add/remove methods available in the active patch.`);
    } else if (influenceMods.length > 1) {
      const distinctInfluences = new Set(influenceMods.map(m => m.influence));
      if (distinctInfluences.size > 1) steps.push('Investigate an influence-transfer sequence for the required influenced modifiers, then finish the remaining affix side with locks/reforges.');
      else steps.push(`Build the ${humanize(influenceMods[0].influence)} affix side first using influence-focused rerolls.`);
    }
    const focusSide = prefixes.length >= suffixes.length ? 'prefixes' : 'suffixes';
    if (!sources.has('essence') && hardest) steps.push(`First isolate the lower-weight/high-requirement target “${hardest.display}”, then protect the completed ${focusSide} before working on the other side.`);
    else steps.push(`Once the forced/special modifier is present with acceptable companions, protect the stronger ${focusSide} and finish the opposite side.`);
    if (sources.has('crafted')) steps.push('Reserve bench-crafted modifiers for the final steps; confirm the crafted-mod count and whether a multimod is part of the finished target.');
    if (state.constraints.openPrefix) steps.push('Do not occupy the final prefix; preserve it through every finishing step.');
    if (state.constraints.openSuffix) steps.push('Do not occupy the final suffix; preserve it through every finishing step.');
    if (state.constraints.ssf) steps.push('Compare the plan against SSF material availability and prefer deterministic essence/fossil/bench routes over trade-dependent starting items.');
    steps.push('Ask the crafting evaluator to compare at least three routes by expected cost, median cost, failure risk, and restart conditions before committing currency.');

    return {
      title: 'Seed strategy for an optimizer or GPT',
      steps,
      note: 'This is a rule-based hypothesis, not an exact probability calculation. The exported packet instructs GPT not to invent odds when a simulator or current mechanic data is unavailable.'
    };
  }

  function renderStrategy() {
    const strategy = buildStrategy();
    els.strategyCard.innerHTML = `<ol>${strategy.steps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol><div class="strategy-note">${escapeHTML(strategy.note)}</div>`;
  }

  function compactMod(mod, includeWeights = true) {
    const result = {
      id: mod.id,
      text: mod.display,
      name: mod.name,
      affix: mod.affix,
      source: mod.source,
      influence: mod.influence || null,
      required_item_level: mod.required_level,
      raw_data_required_level: mod.raw_required_level ?? mod.required_level,
      precursor_required_item_level: mod.precursor_required_level ?? null,
      item_level_rule: mod.is_upgrade_only ? 'no_direct_requirement_upgrade_only' : 'minimum_item_level_to_spawn',
      tier: mod.tier || null,
      acquisition_mechanic: mod.acquisition_mechanic || null,
      modifier_group: mod.type || mod.group || null,
      modifier_groups: Array.from(new Set([...(mod.groups || []), mod.type, mod.group].filter(Boolean))),
      tags: mod.tags || [],
      stats: mod.stats || [],
      target_state: { fractured: Boolean(mod.fractured), elevated: Boolean(mod.elevated) },
      base_compatibility: {
        ruleset_id: POE_RULES.RULESET_ID,
        candidate_scope: mod.candidate_scope || null,
        candidate_sources: mod.candidate_sources || [],
        evidence: (mod.base_rule_evaluation || POE_RULES.baseCompatibility(mod, currentBase(), {requireCandidateEvidence:state.data?.mode==='repoe'})).evidence
      }
    };
    if (includeWeights) result.spawn_weight_for_base = mod.weight ?? null;
    return result;
  }

  function buildAgentTarget() {
    const validation = validateWholeTarget();
    const base = currentBase();
    const itemState = {
      synthesised: state.selectedMods.some(mod => mod.source === 'synthesis'),
      eldritch: state.selectedMods.some(mod => mod.source === 'eldritch'),
      corrupted: state.selectedMods.some(mod => mod.source === 'corruption'),
      fractured: state.selectedMods.some(mod => mod.fractured),
      mirrored: false,
      split: false
    };
    return {
      schema: 'poe-target-forge/agent-target-v3',
      knowledge_package_id: MECHANIC_DATA.package_id,
      generated_at: new Date().toISOString(),
      game: 'Path of Exile 1',
      requested_rules_patch: MECHANIC_DATA.patch,
      data_snapshot: state.data.metadata,
      builder_ruleset_id: POE_RULES.RULESET_ID,
      evaluation_policy: {
        objective: 'Find the best legal crafting route under the allowed-mechanics and user constraints.',
        exact_probability_policy: 'Do not invent odds. Use known deterministic rules, supplied spawn weights, in-game displayed chances, or label probability unknown.',
        current_patch_only: true
      },
      mechanic_access: mechanicAccessPayload(),
      target: {
        base: base ? {
          id:base.id,
          name:base.name,
          item_class:base.item_class,
          tags:base.tags,
          base_implicits:base.implicits || [],
          affix_limits:affixLimits(base, state.rarity)
        } : null,
        item_level: state.itemLevel,
        quality: state.quality,
        rarity: state.rarity,
        influences: Array.from(state.influences),
        item_state: itemState,
        selected_modifiers: state.selectedMods.map(mod => compactMod(mod)),
        constraints: {
          keep_open_prefix: state.constraints.openPrefix,
          keep_open_suffix: state.constraints.openSuffix,
          allow_crafted_modifiers: state.constraints.allowCrafted,
          ssf_friendly: state.constraints.ssf,
          budget_and_notes: state.constraints.notes || null
        }
      },
      validation: {
        passes_builder_rules_and_access: validation.valid,
        issues: validation.issues,
        prefix_count: selectedCount('prefix'),
        suffix_count: selectedCount('suffix'),
        implicit_count: selectedCount('implicit'),
        capacities: affixLimits(),
        base_pool_diagnostics: applicablePool().diagnostics
      }
    };
  }

  function buildLeanTarget() {
    return buildAgentTarget();
  }

  function relevantCandidatePool() {
    const selectedTokens = new Set(state.selectedMods.flatMap(mod => [mod.type, ...(mod.tags||[]), ...(mod.stats||[]).map(s=>s.id)].filter(Boolean)));
    const mods = applicableMods().slice().sort((a,b) => {
      const score = mod => [mod.type,...(mod.tags||[]),...(mod.stats||[]).map(s=>s.id)].reduce((sum,t)=>sum+(selectedTokens.has(t)?1:0),0);
      return score(b)-score(a) || SOURCE_ORDER.indexOf(a.source)-SOURCE_ORDER.indexOf(b.source) || a.required_level-b.required_level;
    });
    const selectedIds = new Set(state.selectedMods.map(m=>m.id));
    const prioritized = [...state.selectedMods, ...mods.filter(m=>!selectedIds.has(m.id))];
    return { total: prioritized.length, included: prioritized.slice(0, EXPORT_POOL_LIMIT) };
  }

  function buildPacket() {
    const lean = buildLeanTarget();
    const pool = relevantCandidatePool();
    const strategy = buildStrategy();
    return {
      ...lean,
      schema: 'poe-target-forge/diagnostic-packet-v3',
      purpose: 'Diagnostic fallback for an agent that does not have the reusable knowledge package installed.',
      mechanic_catalog: MECHANIC_DATA,
      instructions_for_gpt: [
        'Treat target.validation and modifier identity/group data as constraints, not suggestions.',
        'Do not claim exact crafting odds or costs unless they can be calculated from supplied weights/actions or verified with an external simulator and current price data.',
        'Reject any route that cannot produce every selected modifier while preserving the requested open slots.',
        'Separate base acquisition, deterministic/forced modifiers, affix-side construction, protection/locking, finishing, and optional corruption.',
        'Compare at least three plausible routes when possible. For each route report prerequisites, ordered steps, restart conditions, major failure modes, estimated material categories, and what current data is still needed.',
        'Prefer a deterministic rules engine or crafting simulator over memory when a patch-specific interaction is uncertain.'
      ],
      strategy_seed: {
        status: 'heuristic_only',
        steps: strategy.steps,
        warning: strategy.note
      },
      modeled_rules: {
        affix_capacity_for_selected_base: affixLimits(),
        general_rare_affix_slots: { prefixes:3, suffixes:3 },
        jewel_and_trinket_rare_slots: { prefixes:2, suffixes:2 },
        special_base_limits_are_enforced: true,
        magic_affix_slots: { prefixes:1, suffixes:1 },
        maximum_influences: 2,
        same_modifier_group_conflicts: true,
        item_level_requirements_enforced: true,
        crafted_modifier_limit: '1 normally; up to 3 with multimod; multiple crafted/fractured states may exist through current recombination and are represented as route requirements.',
        essence_exclusive_modifiers: 'Multiple essence-exclusive modifiers may coexist through transfer/recombination when legal by affix groups and slots.',
        special_mechanic_note: 'Patch 3.29.1.1 mechanics are enumerated in the reusable knowledge package. Exact stochastic simulation is outside this static builder.'
      },
      applicable_modifier_pool: {
        total_applicable: pool.total,
        included: pool.included.length,
        truncated: pool.total > pool.included.length,
        truncation_limit: EXPORT_POOL_LIMIT,
        modifiers: pool.included.map(mod => ({
          ...compactMod(mod),
          currently_selectable: validateMod(mod,{forAdd:true}).valid,
          unavailability_reasons: validateMod(mod,{forAdd:true}).reasons.map(r=>r.message)
        }))
      },
      requested_output_format: {
        recommendation: 'Best route for the user constraints, with explicit uncertainty.',
        comparison_columns: ['route','prerequisites','ordered_steps','restart_condition','failure_modes','estimated_cost_type','probability_or_unknown','advantages','disadvantages'],
        final_checks: ['target legality','open affix preservation','craft availability in active patch','price snapshot freshness']
      }
    };
  }

  function buildStartingPrompt() {
    return `ONE-TIME CHATGPT AGENT SETUP

Upload the files in the bundled knowledge/ directory to a ChatGPT Project or custom GPT knowledge base. Use AGENT_INSTRUCTIONS.md as the agent instructions. Keep the package together and preserve its package id: ${MECHANIC_DATA.package_id}.

After setup, future user messages should contain only the JSON exported from the “Agent target JSON” tab. The agent must:
- validate the package id and requested patch;
- obey allowed_mechanics and excluded_mechanics;
- never recommend an excluded mechanic;
- distinguish a legal finished item from a route that is inaccessible under the user's settings;
- account for mod groups, affix capacities, source-only mods, item states, metamods and current recombinator modes;
- never invent exact odds or prices;
- return prerequisites, ordered steps, restart rules, failure modes and alternatives.

A sample target payload follows:
${JSON.stringify(buildAgentTarget(), null, 2)}`;
  }

  function exportContent(mode = state.exportMode) {
    if (mode === 'agent' || mode === 'lean') return JSON.stringify(buildAgentTarget(), null, 2);
    if (mode === 'prompt') return buildStartingPrompt();
    if (mode === 'readable') return readableItemText();
    return JSON.stringify(buildPacket(), null, 2);
  }

  function renderExport() {
    const explanations = {
      agent: `The normal per-item handoff. Upload the reusable knowledge package once, then send only this compact JSON to the ChatGPT crafting agent. Package: ${MECHANIC_DATA.package_id}.`,
      packet: 'A larger diagnostic fallback containing a truncated applicable-mod pool, rules summary and mechanic catalog. Use only when the GPT does not have the reusable knowledge package.',
      prompt: 'One-time setup text for configuring a ChatGPT Project or custom GPT with the included knowledge files. It is not needed for routine item evaluations.',
      readable: 'A human-readable item representation for discussions, notes, or tools that accept item-like text.'
    };
    const content = exportContent();
    els.exportExplanation.textContent = explanations[state.exportMode];
    els.exportOutput.value = content;
    els.exportSize.textContent = `${content.length.toLocaleString()} characters`;
    $$('.export-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.exportMode === state.exportMode));
    els.downloadExportBtn.textContent = state.exportMode === 'readable' || state.exportMode === 'prompt' ? 'Download text' : 'Download JSON';
  }

  function addMod(id) {
    const mod = applicableMods().find(candidate => candidate.id === id);
    if (!mod) return;
    const validation = validateMod(mod, {forAdd:true});
    if (!validation.valid) {
      toast(validation.reasons[0]?.message || 'This modifier cannot be added.');
      return;
    }
    const autoEnabledInfluence = mod.influence && !state.influences.has(mod.influence) ? mod.influence : null;
    if (autoEnabledInfluence) state.influences.add(autoEnabledInfluence);
    state.selectedMods.push({...mod, fractured:Boolean(mod.fractured), elevated:Boolean(mod.elevated)});
    reconcileTargetConstraints(true);
    renderInfluences(); renderMechanicAccess(); renderModList(); renderTarget(); renderLegality(); renderStrategy();
    if (autoEnabledInfluence) toast(`${humanize(autoEnabledInfluence)} influence enabled for the selected modifier.`);
  }

  function removeMod(id) {
    state.selectedMods = state.selectedMods.filter(mod => mod.id !== id);
    reconcileTargetConstraints(false);
    renderInfluences(); renderMechanicAccess(); renderModList(); renderTarget(); renderLegality(); renderStrategy();
  }

  function selectBase(id) {
    if (!state.data.baseById.has(id)) return;
    state.selectedBaseId = id;
    state.selectedMods = [];
    state.influences.clear();
    state.familyTierSelection.clear();
    applicableCache = {key:null,mods:[],diagnostics:null};
    els.baseResults.hidden = true;
    renderAll();
  }

  function newTarget() {
    state.selectedMods = [];
    state.influences.clear();
    state.itemLevel = 86;
    state.quality = 20;
    state.rarity = 'rare';
    state.constraints = {openPrefix:false,openSuffix:false,allowCrafted:true,ssf:false,notes:''};
    state.filters = {...state.filters, query:'', side:'all', source:'all', showUnavailable:true, density:'compact'};
    els.itemLevel.value = 86; els.qualityInput.value = 20; els.rarity.value = 'rare';
    els.openPrefix.checked = false; els.openSuffix.checked = false; els.allowCrafted.checked = true; els.ssfMode.checked = false; els.budgetInput.value='';
    els.modSearch.value=''; els.sideFilter.value='all'; els.showUnavailable.checked=true;
    renderAll();
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard.');
    } catch {
      const area = document.createElement('textarea');
      area.value = text; area.style.position='fixed'; area.style.opacity='0'; document.body.appendChild(area); area.select();
      document.execCommand('copy'); area.remove(); toast('Copied to clipboard.');
    }
  }

  function downloadText(filename, content, type = 'application/json') {
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  async function loadRemoteData() {
    els.loadRemoteBtn.disabled = true;
    els.remoteProgress.textContent = 'Downloading base items…';
    try {
      const optionalFetch = url => fetch(url).then(response => response.ok ? response : null).catch(() => null);
      const [baseRes, modsRes, byBaseRes, translationsRes, benchRes, essencesRes, itemClassesRes] = await Promise.all([
        fetch(REPOE_URLS.base_items),
        fetch(REPOE_URLS.mods),
        fetch(REPOE_URLS.mods_by_base),
        optionalFetch(REPOE_URLS.stat_translations),
        optionalFetch(REPOE_URLS.crafting_bench_options),
        optionalFetch(REPOE_URLS.essences),
        optionalFetch(REPOE_URLS.item_classes)
      ]);
      if (!baseRes.ok || !modsRes.ok || !byBaseRes.ok) throw new Error('One or more required RePoE files could not be downloaded.');
      els.remoteProgress.textContent = 'Parsing large JSON files…';
      const [base_items, mods, mods_by_base, stat_translations, crafting_bench_options, essences, item_classes] = await Promise.all([
        baseRes.json(), modsRes.json(), byBaseRes.json(),
        translationsRes ? translationsRes.json() : Promise.resolve(null),
        benchRes ? benchRes.json() : Promise.resolve(null),
        essencesRes ? essencesRes.json() : Promise.resolve(null),
        itemClassesRes ? itemClassesRes.json() : Promise.resolve(null)
      ]);
      els.remoteProgress.textContent = 'Building base-to-mod indexes…';
      await new Promise(resolve => setTimeout(resolve, 20));
      const data = normalizeRepoeData({base_items,mods,mods_by_base,stat_translations,crafting_bench_options,essences,item_classes});
      setData(data, state.selectedBaseId);
      els.remoteProgress.textContent = `Loaded ${data.bases.length.toLocaleString()} equipment bases.`;
      toast('RePoE data loaded.');
    } catch (error) {
      console.error(error);
      els.remoteProgress.textContent = `Could not load directly: ${error.message} Serve this folder over HTTP or import downloaded files instead.`;
    } finally {
      els.loadRemoteBtn.disabled = false;
    }
  }

  async function importFiles(fileList) {
    const files = Array.from(fileList);
    const parsed = {};
    for (const file of files) {
      const key = Object.keys(REPOE_URLS).find(name => file.name.includes(name));
      if (!key) continue;
      els.remoteProgress.textContent = `Reading ${file.name}…`;
      parsed[key] = JSON.parse(await file.text());
    }
    const missing = ['base_items','mods','mods_by_base'].filter(key => !parsed[key]);
    if (missing.length) throw new Error(`Missing required files: ${missing.join(', ')}`);
    els.remoteProgress.textContent = 'Building base-to-mod indexes…';
    await new Promise(resolve => setTimeout(resolve, 20));
    const data = normalizeRepoeData(parsed);
    setData(data, state.selectedBaseId);
    els.remoteProgress.textContent = `Imported ${data.bases.length.toLocaleString()} equipment bases.`;
    toast('Local RePoE files imported.');
  }

  function syncConstraintState(event = null) {
    const proposedLevel = Math.max(1, Math.min(100, safeNumber(els.itemLevel.value,86)));
    const minimumLevel = state.selectedMods.reduce((max, mod) => Math.max(max, safeNumber(mod.required_level,1)), 1);
    state.itemLevel = Math.max(proposedLevel, minimumLevel);
    state.quality = Math.max(0, Math.min(30, safeNumber(els.qualityInput.value,20)));
    els.itemLevel.value = state.itemLevel;
    els.qualityInput.value = state.quality;

    const proposedRarity = els.rarity.value;
    const proposedLimits = affixLimits(currentBase(), proposedRarity);
    if (proposedRarity === 'magic' && (selectedCount('prefix') > proposedLimits.prefix || selectedCount('suffix') > proposedLimits.suffix)) {
      els.rarity.value = state.rarity;
      toast('That rarity cannot contain the selected affixes.');
    } else {
      state.rarity = proposedRarity;
    }

    state.constraints.openPrefix = els.openPrefix.checked;
    state.constraints.openSuffix = els.openSuffix.checked;
    state.constraints.allowCrafted = els.allowCrafted.checked;
    state.constraints.ssf = els.ssfMode.checked;
    state.constraints.notes = els.budgetInput.value.trim();
    state.allowPurchasedBase = els.allowPurchasedBase.checked;
    reconcileTargetConstraints(Boolean(event));
    saveAccessPreferences();
    renderMechanicAccess(); renderModList(); renderTarget(); renderLegality(); renderStrategy();
  }


  // Event wiring
  els.baseSearch.addEventListener('focus', () => renderBaseResults(els.baseSearch.value));
  els.baseSearch.addEventListener('input', () => renderBaseResults(els.baseSearch.value));
  els.clearBaseSearch.addEventListener('click', () => { els.baseSearch.value=''; renderBaseResults(''); els.baseSearch.focus(); });
  els.baseResults.addEventListener('click', event => {
    const option = event.target.closest('[data-base-id]'); if (option) selectBase(option.dataset.baseId);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.combo-wrap')) els.baseResults.hidden = true;
  });

  [els.itemLevel,els.qualityInput,els.rarity,els.openPrefix,els.openSuffix,els.allowCrafted,els.ssfMode,els.allowPurchasedBase].forEach(el => el.addEventListener('change', syncConstraintState));
  els.budgetInput.addEventListener('input', () => { state.constraints.notes = els.budgetInput.value.trim(); renderStrategy(); });

  els.influenceControls.addEventListener('change', event => {
    const input = event.target.closest('[data-influence]'); if (!input) return;
    const inf = input.dataset.influence;
    if (!input.checked && state.selectedMods.some(mod => mod.influence === inf)) { input.checked=true; toast(`Remove the selected ${humanize(inf)} modifier before removing its influence.`); return; }
    if (input.checked && (state.selectedMods.some(mod => mod.source === 'synthesis' || mod.source === 'eldritch' || mod.fractured))) { input.checked=false; toast('Influence cannot be added to this synthesised, eldritch or fractured target.'); return; }
    if (input.checked && state.influences.size >= 2) { input.checked=false; toast('An item can have at most two conventional influences.'); return; }
    input.checked ? state.influences.add(inf) : state.influences.delete(inf);
    renderInfluences(); renderMechanicAccess(); renderModList(); renderTarget(); renderLegality(); renderStrategy();
  });

  els.modSearch.addEventListener('input', () => { state.filters.query=els.modSearch.value; renderModList(); });
  els.sideFilter.addEventListener('change', () => { state.filters.side=els.sideFilter.value; renderModList(); });
  els.modSort.addEventListener('change', () => { state.filters.sort=els.modSort.value; renderModList(); });
  els.sourceFilter.addEventListener('change', () => {
    state.filters.source=els.sourceFilter.value;
    if (state.filters.source !== 'all') state.openSourceGroups.add(state.filters.source);
    renderSourceControls(); renderModList();
  });
  els.showUnavailable.addEventListener('change', () => { state.filters.showUnavailable=els.showUnavailable.checked; renderModList(); });
  els.sourcePills.addEventListener('click', event => {
    const pill=event.target.closest('[data-source-pill]'); if(!pill)return;
    state.filters.source=pill.dataset.sourcePill;
    if (state.filters.source !== 'all') state.openSourceGroups.add(state.filters.source);
    renderSourceControls(); renderModList();
  });
  els.mechanicAccessControls.addEventListener('change', event => {
    const input=event.target.closest('[data-mechanic-id]'); if(!input)return;
    input.checked ? state.mechanicAccess.add(input.dataset.mechanicId) : state.mechanicAccess.delete(input.dataset.mechanicId);
    saveAccessPreferences();
    renderMechanicAccess(); renderModList(); renderLegality(); renderStrategy();
  });
  document.addEventListener('click', event => {
    const preset=event.target.closest('[data-mechanic-preset]');
    if(preset) applyMechanicPreset(preset.dataset.mechanicPreset);
  });
  els.modList.addEventListener('click', event => {
    const btn=event.target.closest('[data-add-mod]');
    if (btn) { event.preventDefault(); event.stopPropagation(); addMod(btn.dataset.addMod); }
  });
  els.modList.addEventListener('change', event => {
    const select=event.target.closest('[data-family-tier-select]');
    if(!select) return;
    state.familyTierSelection.set(select.dataset.familyTierSelect, select.value);
    renderModList();
  });
  els.modList.addEventListener('toggle', event => {
    const target = event.target;
    if (target.matches?.('[data-source-group]')) {
      if (target.open) state.openSourceGroups.add(target.dataset.sourceGroup);
      else state.openSourceGroups.delete(target.dataset.sourceGroup);
    }
  }, true);
  els.expandAllMods.addEventListener('click', () => {
    const mods = currentFilteredMods();
    mods.forEach(mod => state.openSourceGroups.add(mod.source || 'other'));
    renderModList();
  });
  els.collapseAllMods.addEventListener('click', () => {
    state.openSourceGroups.clear();
    renderModList();
  });
  document.addEventListener('keydown', event => {
    if (event.key==='/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { event.preventDefault(); els.modSearch.focus(); }
    if (event.key==='Escape') { els.dataModal.hidden=true; els.exportModal.hidden=true; els.baseResults.hidden=true; }
  });
  $$('.view-button').forEach(btn => btn.addEventListener('click', () => {
    state.filters.density=btn.dataset.density; $$('.view-button').forEach(b=>b.classList.toggle('active',b===btn)); renderModList();
  }));

  els.selectedMods.addEventListener('click', event => {
    const remove=event.target.closest('[data-remove-mod]'); if(remove){ removeMod(remove.dataset.removeMod); return; }
    const elevated=event.target.closest('[data-toggle-elevated]');
    if(elevated){
      const mod=state.selectedMods.find(candidate=>candidate.id===elevated.dataset.toggleElevated);
      if(!mod || mod.source!=='influence') return;
      mod.elevated=!mod.elevated;
      renderMechanicAccess(); renderModList(); renderTarget(); renderLegality(); renderStrategy();
      return;
    }
    const fracture=event.target.closest('[data-toggle-fracture]');
    if(fracture){
      const mod=state.selectedMods.find(candidate=>candidate.id===fracture.dataset.toggleFracture);
      if(!mod)return;
      const enabling=!mod.fractured;
      if(enabling && (state.influences.size || state.selectedMods.some(m=>m.source==='synthesis'))){ toast('Fractured modifiers cannot be combined with this influenced or synthesised target.'); return; }
      mod.fractured=enabling;
      renderMechanicAccess(); renderModList(); renderTarget(); renderLegality(); renderStrategy();
    }
  });
  els.selectedMods.addEventListener('dragstart', event => { const row=event.target.closest('[data-selected-mod]'); if(row){state.dragModId=row.dataset.selectedMod; event.dataTransfer.effectAllowed='move';} });
  els.selectedMods.addEventListener('dragover', event => event.preventDefault());
  els.selectedMods.addEventListener('drop', event => {
    event.preventDefault(); const row=event.target.closest('[data-selected-mod]'); if(!row||!state.dragModId)return;
    const from=state.selectedMods.findIndex(m=>m.id===state.dragModId); const to=state.selectedMods.findIndex(m=>m.id===row.dataset.selectedMod);
    if(from>=0&&to>=0){ const [m]=state.selectedMods.splice(from,1); state.selectedMods.splice(to,0,m); renderTarget(); }
    state.dragModId=null;
  });

  els.clearModsBtn.addEventListener('click', () => { state.selectedMods=[]; reconcileTargetConstraints(false); renderInfluences();renderMechanicAccess();renderModList();renderTarget();renderLegality();renderStrategy(); });
  els.copyPobBtn.addEventListener('click', () => copyText(readableItemText()));
  els.copyStrategyBtn.addEventListener('click', () => copyText(JSON.stringify(buildAgentTarget(),null,2)));
  els.newTargetBtn.addEventListener('click', newTarget);

  els.openDataBtn.addEventListener('click', () => { els.dataModal.hidden=false; });
  els.closeDataBtn.addEventListener('click', () => { els.dataModal.hidden=true; });
  els.doneDataBtn.addEventListener('click', () => { els.dataModal.hidden=true; });
  els.restoreDemoBtn.addEventListener('click', () => { setData(normalizeDemoData(window.POE_DEMO_DATA)); els.remoteProgress.textContent='Demo data restored.'; });
  els.loadRemoteBtn.addEventListener('click', loadRemoteData);
  els.dataFiles.addEventListener('change', async () => {
    try { await importFiles(els.dataFiles.files); }
    catch(error) { console.error(error); els.remoteProgress.textContent=error.message; }
    finally { els.dataFiles.value=''; }
  });

  els.exportBtn.addEventListener('click', () => { state.exportMode='agent'; renderExport(); els.exportModal.hidden=false; });
  els.closeExportBtn.addEventListener('click', () => { els.exportModal.hidden=true; });
  $$('.export-tab').forEach(tab => tab.addEventListener('click', () => { state.exportMode=tab.dataset.exportMode; renderExport(); }));
  els.copyExportBtn.addEventListener('click', () => copyText(els.exportOutput.value));
  els.downloadExportBtn.addEventListener('click', () => {
    const isText=['prompt','readable'].includes(state.exportMode);
    downloadText(`poe-target-${state.exportMode}.${isText?'txt':'json'}`, els.exportOutput.value, isText?'text/plain':'application/json');
  });
  [els.dataModal,els.exportModal].forEach(modal => modal.addEventListener('click', event => { if(event.target===modal)modal.hidden=true; }));

  // Initial state
  const demo = normalizeDemoData(window.POE_DEMO_DATA);
  state.itemLevel = safeNumber(els.itemLevel.value,86);
  state.quality = safeNumber(els.qualityInput.value,20);
  loadAccessPreferences();
  setData(demo);
  if (/^https?:$/.test(location.protocol) && !new URLSearchParams(location.search).has('demo')) {
    setTimeout(() => loadRemoteData(), 0);
  }
})();
