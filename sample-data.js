/*
  Representative offline data for UI/rules-engine demonstration.
  It is deliberately labeled as demo data in the interface. Load RePoE for a
  much larger current dataset.
*/
(() => {
  const bases = [
    { id: 'demo/vaal-regalia', name: 'Vaal Regalia', item_class: 'Body Armour', domain: 'item', drop_level: 68, tags: ['body_armour','int_armour','energy_shield_armour','armour'], properties: { energy_shield: 163 } },
    { id: 'demo/astral-plate', name: 'Astral Plate', item_class: 'Body Armour', domain: 'item', drop_level: 62, tags: ['body_armour','str_armour','armour'], properties: { armour: 711 }, implicits: ['+12% to all Elemental Resistances'] },
    { id: 'demo/triumphant-lamellar', name: 'Triumphant Lamellar', item_class: 'Body Armour', domain: 'item', drop_level: 69, tags: ['body_armour','str_dex_armour','armour','evasion_armour'], properties: { armour: 348, evasion: 348 } },
    { id: 'demo/hubris-circlet', name: 'Hubris Circlet', item_class: 'Helmet', domain: 'item', drop_level: 69, tags: ['helmet','int_armour','energy_shield_armour','armour'], properties: { energy_shield: 100 } },
    { id: 'demo/titan-gauntlets', name: 'Titan Gauntlets', item_class: 'Gloves', domain: 'item', drop_level: 69, tags: ['gloves','str_armour','armour'], properties: { armour: 241 } },
    { id: 'demo/dragonscale-boots', name: 'Dragonscale Boots', item_class: 'Boots', domain: 'item', drop_level: 65, tags: ['boots','str_dex_armour','armour','evasion_armour'], properties: { armour: 121, evasion: 121 } },
    { id: 'demo/two-toned-boots', name: 'Two-Toned Boots', item_class: 'Boots', domain: 'item', drop_level: 70, tags: ['boots','dex_int_armour','evasion_armour','energy_shield_armour','armour'], properties: { evasion: 126, energy_shield: 26 }, implicits: ['+12% to Fire and Cold Resistances'] },
    { id: 'demo/amethyst-ring', name: 'Amethyst Ring', item_class: 'Ring', domain: 'item', drop_level: 30, tags: ['ring','jewellery'], properties: {}, implicits: ['+23% to Chaos Resistance'] },
    { id: 'demo/citrine-amulet', name: 'Citrine Amulet', item_class: 'Amulet', domain: 'item', drop_level: 16, tags: ['amulet','jewellery'], properties: {}, implicits: ['+24 to Strength and Dexterity'] },
    { id: 'demo/stygian-vise', name: 'Stygian Vise', item_class: 'Belt', domain: 'item', drop_level: 70, tags: ['belt','jewellery','abyss_belt'], properties: {}, implicits: ['Has 1 Abyssal Socket'] },
    { id: 'demo/convoking-wand', name: 'Convoking Wand', item_class: 'Wand', domain: 'item', drop_level: 72, tags: ['wand','one_hand_weapon','caster_weapon','minion_weapon','weapon'], properties: { physical_damage: '27–51', critical_strike_chance: '7.00%', attacks_per_second: '1.40' }, implicits: ['Can roll Minion Modifiers'] },
    { id: 'demo/prophecy-wand', name: 'Prophecy Wand', item_class: 'Wand', domain: 'item', drop_level: 68, tags: ['wand','one_hand_weapon','caster_weapon','weapon'], properties: { physical_damage: '35–65', critical_strike_chance: '8.00%', attacks_per_second: '1.20' }, implicits: ['40% increased Spell Damage'] },
    { id: 'demo/spine-bow', name: 'Spine Bow', item_class: 'Bow', domain: 'item', drop_level: 64, tags: ['bow','two_hand_weapon','attack_weapon','weapon'], properties: { physical_damage: '38–115', critical_strike_chance: '6.50%', attacks_per_second: '1.40' } },
    { id: 'demo/jewelled-foil', name: 'Jewelled Foil', item_class: 'One Hand Sword', domain: 'item', drop_level: 68, tags: ['one_hand_sword','one_hand_weapon','attack_weapon','weapon'], properties: { physical_damage: '32–60', critical_strike_chance: '5.50%', attacks_per_second: '1.60' }, implicits: ['+25% to Global Critical Strike Multiplier'] }
  ];

  const mods = [];
  const add = (m) => mods.push({
    required_level: 1,
    source: 'natural',
    tags: [],
    stats: [],
    ...m,
    generation_type: m.affix || m.generation_type || 'prefix',
    type: m.type || m.group || m.id
  });
  const tiers = (cfg) => cfg.tiers.forEach((t, index) => add({
    id: `${cfg.id}${index + 1}`,
    name: cfg.name,
    display: typeof cfg.display === 'function' ? cfg.display(t, index) : cfg.display,
    affix: cfg.affix,
    group: cfg.group,
    type: cfg.group,
    required_level: t.ilvl,
    tier: `T${index + 1}`,
    source: cfg.source || 'natural',
    influence: cfg.influence || null,
    applies_to: cfg.applies_to,
    tags: cfg.tags || [],
    stats: [{ id: cfg.stat || cfg.id, min: t.min, max: t.max }],
    weight: t.weight || 1000,
    notes: cfg.notes || ''
  }));

  const allArmour = ['body_armour','helmet','gloves','boots'];
  const jewellery = ['ring','amulet','belt'];
  const weapons = ['weapon'];

  tiers({ id:'MaximumLife', name:'Maximum Life', display:t=>`+${t.min}–${t.max} to maximum Life`, affix:'prefix', group:'MaximumLife', stat:'maximum_life', applies_to:[...allArmour,...jewellery], tags:['life'], tiers:[
    {ilvl:86,min:120,max:129,weight:200},{ilvl:81,min:110,max:119},{ilvl:73,min:100,max:109},{ilvl:64,min:90,max:99},{ilvl:54,min:80,max:89},{ilvl:44,min:70,max:79}
  ]});
  tiers({ id:'MaximumEnergyShieldFlat', name:'Maximum Energy Shield', display:t=>`+${t.min}–${t.max} to maximum Energy Shield`, affix:'prefix', group:'FlatEnergyShield', stat:'maximum_energy_shield', applies_to:['energy_shield_armour'], tags:['defences','energy_shield'], tiers:[
    {ilvl:86,min:136,max:145,weight:250},{ilvl:78,min:121,max:135},{ilvl:72,min:106,max:120},{ilvl:60,min:91,max:105}
  ]});
  tiers({ id:'IncreasedEnergyShield', name:'Increased Energy Shield', display:t=>`${t.min}–${t.max}% increased Energy Shield`, affix:'prefix', group:'PercentEnergyShield', stat:'increased_energy_shield', applies_to:['energy_shield_armour'], tags:['defences','energy_shield'], tiers:[
    {ilvl:84,min:101,max:110,weight:300},{ilvl:72,min:91,max:100},{ilvl:60,min:81,max:90},{ilvl:44,min:71,max:80}
  ]});
  tiers({ id:'IncreasedArmour', name:'Increased Armour', display:t=>`${t.min}–${t.max}% increased Armour`, affix:'prefix', group:'PercentArmour', stat:'increased_armour', applies_to:['str_armour','str_dex_armour'], tags:['defences','armour'], tiers:[
    {ilvl:84,min:101,max:110},{ilvl:72,min:91,max:100},{ilvl:60,min:81,max:90},{ilvl:44,min:71,max:80}
  ]});
  tiers({ id:'IncreasedEvasion', name:'Increased Evasion Rating', display:t=>`${t.min}–${t.max}% increased Evasion Rating`, affix:'prefix', group:'PercentEvasion', stat:'increased_evasion', applies_to:['dex_armour','str_dex_armour','dex_int_armour'], tags:['defences','evasion'], tiers:[
    {ilvl:84,min:101,max:110},{ilvl:72,min:91,max:100},{ilvl:60,min:81,max:90}
  ]});
  tiers({ id:'MovementSpeed', name:'Movement Speed', display:t=>`${t.min}% increased Movement Speed`, affix:'prefix', group:'MovementSpeed', stat:'movement_speed', applies_to:['boots'], tags:['speed'], tiers:[
    {ilvl:86,min:35,max:35,weight:250},{ilvl:55,min:30,max:30},{ilvl:30,min:25,max:25},{ilvl:1,min:20,max:20}
  ]});

  const resistance = (element, label) => tiers({ id:`${element}Resistance`, name:`${label} Resistance`, display:t=>`+${t.min}–${t.max}% to ${label} Resistance`, affix:'suffix', group:`${element}Resistance`, stat:`${element.toLowerCase()}_resistance`, applies_to:[...allArmour,...jewellery], tags:['resistance',element.toLowerCase()], tiers:[
    {ilvl:84,min:46,max:48,weight:500},{ilvl:72,min:43,max:45},{ilvl:60,min:40,max:42},{ilvl:48,min:36,max:39},{ilvl:36,min:32,max:35}
  ]});
  resistance('Fire','Fire'); resistance('Cold','Cold'); resistance('Lightning','Lightning');
  tiers({ id:'ChaosResistance', name:'Chaos Resistance', display:t=>`+${t.min}–${t.max}% to Chaos Resistance`, affix:'suffix', group:'ChaosResistance', stat:'chaos_resistance', applies_to:[...allArmour,...jewellery], tags:['resistance','chaos'], tiers:[
    {ilvl:81,min:36,max:40,weight:250},{ilvl:65,min:31,max:35},{ilvl:50,min:26,max:30},{ilvl:30,min:21,max:25}
  ]});
  tiers({ id:'Strength', name:'Strength', display:t=>`+${t.min}–${t.max} to Strength`, affix:'suffix', group:'Strength', stat:'strength', applies_to:[...allArmour,...jewellery], tags:['attribute'], tiers:[
    {ilvl:82,min:56,max:60},{ilvl:74,min:51,max:55},{ilvl:60,min:46,max:50},{ilvl:44,min:41,max:45}
  ]});
  tiers({ id:'Dexterity', name:'Dexterity', display:t=>`+${t.min}–${t.max} to Dexterity`, affix:'suffix', group:'Dexterity', stat:'dexterity', applies_to:[...allArmour,...jewellery], tags:['attribute'], tiers:[
    {ilvl:82,min:56,max:60},{ilvl:74,min:51,max:55},{ilvl:60,min:46,max:50},{ilvl:44,min:41,max:45}
  ]});
  tiers({ id:'Intelligence', name:'Intelligence', display:t=>`+${t.min}–${t.max} to Intelligence`, affix:'suffix', group:'Intelligence', stat:'intelligence', applies_to:[...allArmour,...jewellery], tags:['attribute'], tiers:[
    {ilvl:82,min:56,max:60},{ilvl:74,min:51,max:55},{ilvl:60,min:46,max:50},{ilvl:44,min:41,max:45}
  ]});
  tiers({ id:'SpellSuppression', name:'Chance to Suppress Spell Damage', display:t=>`+${t.min}–${t.max}% chance to Suppress Spell Damage`, affix:'suffix', group:'SpellSuppression', stat:'spell_suppression', applies_to:['evasion_armour','dex_int_armour','str_dex_armour'], tags:['defences'], tiers:[
    {ilvl:85,min:20,max:22,weight:250},{ilvl:75,min:17,max:19},{ilvl:60,min:14,max:16},{ilvl:45,min:11,max:13}
  ]});
  tiers({ id:'Rarity', name:'Item Rarity', display:t=>`${t.min}–${t.max}% increased Rarity of Items found`, affix:'suffix', group:'ItemRarity', stat:'item_rarity', applies_to:[...allArmour,...jewellery], tags:['rarity'], tiers:[
    {ilvl:75,min:21,max:26},{ilvl:50,min:16,max:20},{ilvl:30,min:11,max:15}
  ]});

  tiers({ id:'SpellDamage', name:'Spell Damage', display:t=>`${t.min}–${t.max}% increased Spell Damage`, affix:'prefix', group:'SpellDamage', stat:'spell_damage', applies_to:['caster_weapon'], tags:['caster'], tiers:[
    {ilvl:84,min:95,max:109,weight:100},{ilvl:74,min:80,max:94},{ilvl:62,min:65,max:79},{ilvl:50,min:50,max:64}
  ]});
  tiers({ id:'MinionDamage', name:'Minion Damage', display:t=>`Minions deal ${t.min}–${t.max}% increased Damage`, affix:'prefix', group:'MinionDamage', stat:'minion_damage', applies_to:['minion_weapon'], tags:['minion'], tiers:[
    {ilvl:84,min:75,max:79},{ilvl:72,min:65,max:74},{ilvl:60,min:55,max:64}
  ]});
  tiers({ id:'PhysicalDamagePercent', name:'Physical Damage', display:t=>`${t.min}–${t.max}% increased Physical Damage`, affix:'prefix', group:'LocalPhysicalDamagePercent', stat:'local_physical_damage_percent', applies_to:['attack_weapon'], tags:['physical','attack'], tiers:[
    {ilvl:83,min:170,max:179,weight:25},{ilvl:77,min:160,max:169},{ilvl:73,min:150,max:159},{ilvl:65,min:140,max:149}
  ]});
  tiers({ id:'FlatPhysicalDamage', name:'Added Physical Damage', display:t=>`Adds ${t.min}–${t.max} Physical Damage`, affix:'prefix', group:'LocalAddedPhysicalDamage', stat:'local_added_physical_damage', applies_to:['attack_weapon'], tags:['physical','attack'], tiers:[
    {ilvl:83,min:38,max:72,weight:50},{ilvl:77,min:32,max:61},{ilvl:65,min:26,max:49},{ilvl:50,min:20,max:38}
  ]});
  tiers({ id:'AttackSpeed', name:'Attack Speed', display:t=>`${t.min}–${t.max}% increased Attack Speed`, affix:'suffix', group:'LocalAttackSpeed', stat:'local_attack_speed', applies_to:['attack_weapon'], tags:['speed','attack'], tiers:[
    {ilvl:83,min:17,max:19,weight:100},{ilvl:77,min:14,max:16},{ilvl:60,min:11,max:13}
  ]});
  tiers({ id:'WeaponCriticalChance', name:'Critical Strike Chance', display:t=>`${t.min}–${t.max}% increased Critical Strike Chance`, affix:'suffix', group:'LocalCriticalChance', stat:'local_critical_chance', applies_to:['attack_weapon'], tags:['critical','attack'], tiers:[
    {ilvl:83,min:35,max:38},{ilvl:73,min:30,max:34},{ilvl:60,min:25,max:29}
  ]});
  tiers({ id:'CastSpeed', name:'Cast Speed', display:t=>`${t.min}–${t.max}% increased Cast Speed`, affix:'suffix', group:'CastSpeed', stat:'cast_speed', applies_to:['caster_weapon','amulet','ring'], tags:['caster','speed'], tiers:[
    {ilvl:84,min:27,max:30,weight:250},{ilvl:72,min:23,max:26},{ilvl:55,min:19,max:22}
  ]});
  tiers({ id:'SpellCriticalChance', name:'Critical Strike Chance for Spells', display:t=>`${t.min}–${t.max}% increased Critical Strike Chance for Spells`, affix:'suffix', group:'SpellCriticalChance', stat:'spell_critical_chance', applies_to:['caster_weapon'], tags:['caster','critical'], tiers:[
    {ilvl:84,min:100,max:109},{ilvl:72,min:85,max:99},{ilvl:55,min:70,max:84}
  ]});
  tiers({ id:'CriticalMultiplier', name:'Global Critical Strike Multiplier', display:t=>`+${t.min}–${t.max}% to Global Critical Strike Multiplier`, affix:'suffix', group:'CriticalMultiplier', stat:'critical_multiplier', applies_to:['amulet','caster_weapon','attack_weapon'], tags:['critical'], tiers:[
    {ilvl:82,min:35,max:38,weight:250},{ilvl:72,min:31,max:34},{ilvl:55,min:27,max:30}
  ]});

  // Gem-level and deterministic/special-source examples.
  add({ id:'AllSpellSkillGems1', name:'All Spell Skill Gems', display:'+1 to Level of all Spell Skill Gems', affix:'prefix', group:'AllSpellSkillGems', type:'AllSpellSkillGems', required_level:55, tier:'T1', applies_to:['wand','amulet'], source:'natural', tags:['gem','caster'], weight:50, stats:[{id:'all_spell_skill_gem_level',min:1,max:1}] });
  add({ id:'FireSpellSkillGems1', name:'Fire Spell Skill Gems', display:'+1 to Level of all Fire Spell Skill Gems', affix:'prefix', group:'ElementSpellSkillGems', type:'ElementSpellSkillGems', required_level:55, tier:'T1', applies_to:['wand','amulet'], source:'natural', tags:['gem','fire','caster'], weight:100, stats:[{id:'fire_spell_skill_gem_level',min:1,max:1}] });
  add({ id:'ColdSpellSkillGems1', name:'Cold Spell Skill Gems', display:'+1 to Level of all Cold Spell Skill Gems', affix:'prefix', group:'ElementSpellSkillGems', type:'ElementSpellSkillGems', required_level:55, tier:'T1', applies_to:['wand','amulet'], source:'natural', tags:['gem','cold','caster'], weight:100, stats:[{id:'cold_spell_skill_gem_level',min:1,max:1}] });
  add({ id:'LightningSpellSkillGems1', name:'Lightning Spell Skill Gems', display:'+1 to Level of all Lightning Spell Skill Gems', affix:'prefix', group:'ElementSpellSkillGems', type:'ElementSpellSkillGems', required_level:55, tier:'T1', applies_to:['wand','amulet'], source:'natural', tags:['gem','lightning','caster'], weight:100, stats:[{id:'lightning_spell_skill_gem_level',min:1,max:1}] });
  add({ id:'MinionSkillGems1', name:'Minion Skill Gems', display:'+1 to Level of all Minion Skill Gems', affix:'prefix', group:'MinionSkillGems', required_level:60, tier:'T1', applies_to:['minion_weapon','amulet'], source:'natural', tags:['gem','minion'], weight:100, stats:[{id:'minion_skill_gem_level',min:1,max:1}] });
  add({ id:'BowSkillGems2', name:'Socketed Bow Gems', display:'+2 to Level of Socketed Bow Gems', affix:'prefix', group:'SocketedBowGemLevel', required_level:64, tier:'T1', applies_to:['bow'], source:'natural', tags:['gem','attack'], weight:100, stats:[{id:'socketed_bow_gem_level',min:2,max:2}] });

  add({ id:'EssenceMoreAttackSpeed', name:'Essence Attack Speed', display:'27% increased Attack Speed', affix:'suffix', group:'LocalAttackSpeed', required_level:1, tier:'Essence', applies_to:['attack_weapon'], source:'essence', tags:['speed','attack'], weight:0, stats:[{id:'local_attack_speed',min:27,max:27}], notes:'Essence-only forced modifier.' });
  add({ id:'EssenceSpellDamage', name:'Essence Spell Damage', display:'Minions deal 94% increased Damage', affix:'prefix', group:'MinionDamage', required_level:1, tier:'Essence', applies_to:['minion_weapon'], source:'essence', tags:['minion'], weight:0, stats:[{id:'minion_damage',min:94,max:94}], notes:'Essence-only forced modifier.' });
  add({ id:'EssenceReservationHelmet', name:'Essence Reservation Efficiency', display:'Socketed Gems have 10% increased Reservation Efficiency', affix:'suffix', group:'SocketedReservationEfficiency', required_level:1, tier:'Essence', applies_to:['helmet'], source:'essence', tags:['gem','aura'], weight:0, stats:[{id:'socketed_reservation_efficiency',min:10,max:10}], notes:'Essence-only forced modifier.' });
  add({ id:'EssenceAddedFireWeapon', name:'Essence Added Fire Damage', display:'Adds 112–189 Fire Damage', affix:'prefix', group:'LocalAddedFireDamage', required_level:1, tier:'Essence', applies_to:['attack_weapon'], source:'essence', tags:['fire','attack'], weight:0, stats:[{id:'local_added_fire_damage',min:112,max:189}], notes:'Essence-only forced modifier.' });

  add({ id:'DelveCurseOnHitRing', name:'Curse on Hit', display:'Curse Enemies with Elemental Weakness on Hit', affix:'suffix', group:'CurseOnHit', required_level:60, tier:'Delve', applies_to:['ring'], source:'delve', tags:['caster','curse'], weight:50, stats:[{id:'curse_on_hit_elemental_weakness',min:1,max:1}] });
  add({ id:'DelvePhysicalTakenHelmet', name:'Physical Damage Taken as Fire', display:'10% of Physical Damage from Hits taken as Fire Damage', affix:'prefix', group:'PhysicalTakenAsElement', required_level:68, tier:'Delve', applies_to:['helmet'], source:'delve', tags:['physical','fire','defences'], weight:50, stats:[{id:'physical_damage_taken_as_fire',min:10,max:10}] });

  const influenceMod = (m) => add({ source:'influence', weight:50, ...m });
  influenceMod({ id:'HunterAdditionalCurseBody', name:'Additional Curse', display:'You can apply an additional Curse', affix:'prefix', group:'AdditionalCurse', required_level:85, tier:'T1', applies_to:['body_armour'], influence:'hunter', tags:['curse','caster'], stats:[{id:'additional_curse',min:1,max:1}] });
  influenceMod({ id:'HunterAttackCritBody', name:'Attack Critical Strike Chance', display:'Attacks have +1.5% to Critical Strike Chance', affix:'suffix', group:'AttackBaseCrit', required_level:84, tier:'T1', applies_to:['body_armour'], influence:'hunter', tags:['critical','attack'], stats:[{id:'attack_base_critical_chance',min:1.5,max:1.5}] });
  influenceMod({ id:'RedeemerAuraEffectBody', name:'Aura Effect', display:'10% increased effect of Non-Curse Auras from your Skills', affix:'prefix', group:'AuraEffect', required_level:80, tier:'T1', applies_to:['body_armour'], influence:'redeemer', tags:['aura'], stats:[{id:'non_curse_aura_effect',min:10,max:10}] });
  influenceMod({ id:'CrusaderExplodeBody', name:'Enemies Explode', display:'Enemies you Kill have a chance to Explode, dealing Physical Damage', affix:'prefix', group:'EnemiesExplode', required_level:85, tier:'T1', applies_to:['body_armour'], influence:'crusader', tags:['physical'], stats:[{id:'enemies_explode',min:1,max:1}] });
  influenceMod({ id:'ShaperSpellCritBody', name:'Spell Critical Strike Chance', display:'Spells have +1.5% to Critical Strike Chance', affix:'suffix', group:'SpellBaseCrit', required_level:84, tier:'T1', applies_to:['body_armour'], influence:'shaper', tags:['critical','caster'], stats:[{id:'spell_base_critical_chance',min:1.5,max:1.5}] });
  influenceMod({ id:'ElderLifePercentBody', name:'Increased Maximum Life', display:'12% increased maximum Life', affix:'prefix', group:'PercentMaximumLife', required_level:84, tier:'T1', applies_to:['body_armour'], influence:'elder', tags:['life'], stats:[{id:'increased_maximum_life',min:12,max:12}] });
  influenceMod({ id:'HunterTailwindBoots', name:'Tailwind', display:'You have Tailwind if you have dealt a Critical Strike Recently', affix:'suffix', group:'Tailwind', required_level:75, tier:'T1', applies_to:['boots'], influence:'hunter', tags:['speed','critical'], stats:[{id:'tailwind_on_crit',min:1,max:1}] });
  influenceMod({ id:'RedeemerOnslaughtBoots', name:'Onslaught on Kill', display:'Chance to gain Onslaught for 4 seconds on Kill', affix:'suffix', group:'OnslaughtOnKill', required_level:75, tier:'T1', applies_to:['boots'], influence:'redeemer', tags:['speed'], stats:[{id:'onslaught_on_kill',min:15,max:15}] });
  influenceMod({ id:'ShaperCooldownBoots', name:'Cooldown Recovery Rate', display:'15% increased Cooldown Recovery Rate', affix:'suffix', group:'CooldownRecovery', required_level:80, tier:'T1', applies_to:['boots'], influence:'shaper', tags:['speed'], stats:[{id:'cooldown_recovery_rate',min:15,max:15}] });
  influenceMod({ id:'HunterChaosDotAmulet', name:'Chaos Damage over Time Multiplier', display:'+16% to Chaos Damage over Time Multiplier', affix:'prefix', group:'ChaosDotMultiplier', required_level:82, tier:'T1', applies_to:['amulet'], influence:'hunter', tags:['chaos','caster'], stats:[{id:'chaos_dot_multiplier',min:16,max:16}] });
  influenceMod({ id:'WarlordPhysicalGemAmulet', name:'Physical Skill Gems', display:'+1 to Level of all Physical Skill Gems', affix:'prefix', group:'PhysicalSkillGems', required_level:82, tier:'T1', applies_to:['amulet'], influence:'warlord', tags:['physical','gem'], stats:[{id:'physical_skill_gem_level',min:1,max:1}] });
  influenceMod({ id:'ShaperExtraArrowBow', name:'Additional Arrow', display:'Bow Attacks fire 1 additional Arrow', affix:'suffix', group:'AdditionalArrow', required_level:86, tier:'T1', applies_to:['bow'], influence:'shaper', tags:['attack','projectile'], stats:[{id:'additional_arrow',min:1,max:1}] });
  influenceMod({ id:'HunterChaosDamageBow', name:'Chaos Damage', display:'Adds 81–125 Chaos Damage', affix:'prefix', group:'LocalAddedChaosDamage', required_level:83, tier:'T1', applies_to:['bow'], influence:'hunter', tags:['chaos','attack'], stats:[{id:'local_added_chaos_damage',min:81,max:125}] });
  influenceMod({ id:'ShaperGainElementAsChaosWand', name:'Elemental Damage as Chaos', display:'Gain 8% of Elemental Damage as Extra Chaos Damage', affix:'prefix', group:'GainElementAsChaos', required_level:85, tier:'T1', applies_to:['wand'], influence:'shaper', tags:['chaos','caster'], stats:[{id:'gain_element_as_chaos',min:8,max:8}] });
  influenceMod({ id:'CrusaderLightningPenWand', name:'Lightning Penetration', display:'Damage Penetrates 6% Lightning Resistance', affix:'prefix', group:'LightningPenetration', required_level:80, tier:'T1', applies_to:['wand'], influence:'crusader', tags:['lightning','caster'], stats:[{id:'lightning_penetration',min:6,max:6}] });

  // Crafted examples intentionally share groups with natural mods.
  add({ id:'CraftedLife', name:'Crafted Maximum Life', display:'+55 to maximum Life', affix:'prefix', group:'MaximumLife', required_level:1, tier:'Crafted', applies_to:[...allArmour,...jewellery], source:'crafted', tags:['life'], weight:0, stats:[{id:'maximum_life',min:55,max:55}] });
  add({ id:'CraftedMovementSpeed', name:'Crafted Movement Speed', display:'24% increased Movement Speed', affix:'prefix', group:'MovementSpeed', required_level:1, tier:'Crafted', applies_to:['boots'], source:'crafted', tags:['speed'], weight:0, stats:[{id:'movement_speed',min:24,max:24}] });
  add({ id:'CraftedFireResistance', name:'Crafted Fire Resistance', display:'+35% to Fire Resistance', affix:'suffix', group:'FireResistance', required_level:1, tier:'Crafted', applies_to:[...allArmour,...jewellery], source:'crafted', tags:['resistance','fire'], weight:0, stats:[{id:'fire_resistance',min:35,max:35}] });
  add({ id:'CraftedCastSpeed', name:'Crafted Cast Speed', display:'16% increased Cast Speed', affix:'suffix', group:'CastSpeed', required_level:1, tier:'Crafted', applies_to:['caster_weapon','amulet','ring'], source:'crafted', tags:['caster','speed'], weight:0, stats:[{id:'cast_speed',min:16,max:16}] });
  add({ id:'CraftedTriggerWand', name:'Trigger a Socketed Spell', display:'Trigger a Socketed Spell when you Use a Skill, with an 8 second Cooldown', affix:'suffix', group:'CraftedTrigger', required_level:1, tier:'Crafted', applies_to:['wand'], source:'crafted', tags:['caster'], weight:0, stats:[{id:'trigger_socketed_spell',min:1,max:1}] });
  add({ id:'CraftedMultiMod', name:'Can have multiple Crafted Modifiers', display:'Can have up to 3 Crafted Modifiers', affix:'suffix', group:'MultiMod', required_level:1, tier:'Crafted', applies_to:[...allArmour,...jewellery,...weapons], source:'crafted', tags:['meta'], weight:0, stats:[{id:'multimod',min:1,max:1}] });
  add({ id:'CraftedPrefixesCannotChange', name:'Prefixes Cannot Be Changed', display:'Prefixes Cannot Be Changed', affix:'suffix', group:'PrefixesCannotChange', required_level:1, tier:'Crafted', applies_to:[...allArmour,...jewellery,...weapons], source:'crafted', tags:['meta'], weight:0, stats:[{id:'prefixes_cannot_change',min:1,max:1}] });
  add({ id:'CraftedSuffixesCannotChange', name:'Suffixes Cannot Be Changed', display:'Suffixes Cannot Be Changed', affix:'prefix', group:'SuffixesCannotChange', required_level:1, tier:'Crafted', applies_to:[...allArmour,...jewellery,...weapons], source:'crafted', tags:['meta'], weight:0, stats:[{id:'suffixes_cannot_change',min:1,max:1}] });

  // Synthesis/corruption-style implicits for the builder's separate implicit area.
  add({ id:'SynthLifeImplicit', name:'Synthesised Maximum Life', display:'5% increased maximum Life', affix:'implicit', generation_type:'implicit', group:'SynthLifeImplicit', required_level:1, tier:'Synthesis', applies_to:[...allArmour,...jewellery], source:'synthesis', tags:['life'], weight:0, stats:[{id:'synth_increased_life',min:5,max:5}] });
  add({ id:'SynthOnslaughtImplicit', name:'Synthesised Onslaught', display:'You have Onslaught while at maximum Endurance Charges', affix:'implicit', generation_type:'implicit', group:'SynthOnslaughtImplicit', required_level:1, tier:'Synthesis', applies_to:['boots'], source:'synthesis', tags:['speed'], weight:0, stats:[{id:'synth_onslaught',min:1,max:1}] });
  add({ id:'CorruptPlusGemImplicit', name:'Corrupted Gem Level', display:'+2 to Level of Socketed AoE Gems', affix:'implicit', generation_type:'implicit', group:'CorruptGemImplicit', required_level:1, tier:'Corruption', applies_to:['body_armour','helmet','gloves','boots'], source:'corruption', tags:['gem'], weight:0, stats:[{id:'corrupt_aoe_gem_level',min:2,max:2}] });

  window.POE_DEMO_DATA = {
    metadata: {
      name: 'Representative offline demo',
      game: 'poe1',
      patch: 'demo-not-authoritative',
      source: 'bundled',
      generated_at: '2026-08-02'
    },
    bases,
    mods
  };
})();
