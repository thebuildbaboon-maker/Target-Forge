(() => {
  'use strict';

  window.POE_CRAFTING_MECHANICS = {
    package_id: 'poe1-crafting-knowledge-3.29.1.1-r3',
    game: 'Path of Exile 1',
    patch: '3.29.1.1',
    league: 'Curse of the Allflame',
    verified_at: '2026-08-02',
    categories: [
      { id: 'core', label: 'Core currency & bench' },
      { id: 'targeted', label: 'Targeted rerolls & forced mods' },
      { id: 'influence', label: 'Influence & eldritch' },
      { id: 'transfer', label: 'Transfer, fracture & recombination' },
      { id: 'special', label: 'Corruption, enchants & special states' },
      { id: 'league', label: 'Current league systems' },
      { id: 'acquisition', label: 'Special base / mod acquisition' },
      { id: 'legacy', label: 'Legacy or Standard-only routes' }
    ],
    mechanics: [
      { id:'core_currency', label:'Basic currency crafting', category:'core', default:true, status:'current', summary:'Transmute, alteration, augmentation, regal, alchemy, chaos, exalt, annul, scour, divine, blessed and related ordinary currency.' },
      { id:'crafting_bench', label:'Crafting Bench', category:'core', default:true, status:'current', summary:'Normal crafted modifiers, remove crafted mods, socket/link/colour recipes and current rare-item reroll bench crafts.' },
      { id:'metamods', label:'Meta-crafts', category:'core', default:true, status:'current', summary:'Prefixes/Suffixes Cannot Be Changed, Cannot Roll Attack/Caster, multimod and interactions that respect or ignore them.' },
      { id:'vendor_recipes', label:'Vendor recipes', category:'core', default:true, status:'current', summary:'Deterministic item and modifier recipes, including recipes that change bases or fixed modifiers.' },
      { id:'hinekora_lock', label:"Hinekora's Lock / outcome preview", category:'core', default:true, status:'current', summary:'Preview or preserve knowledge of the next applicable currency outcome where available.' },
      { id:'socket_link_quality', label:'Sockets, links & ordinary quality', category:'core', default:true, status:'current', summary:'Jeweller, Fusing, Chromatic, Armourer, Blacksmith, Glassblower and bench equivalents under the current white-socket rules.' },
      { id:'omens', label:'Omens that alter crafting outcomes', category:'core', default:true, status:'current', summary:'Applicable omens consumed by currency use, including current socket/colour, chance, annul and related outcome guarantees.' },
      { id:'mirror_copying', label:'Mirror and copy-state handling', category:'core', default:true, status:'current', summary:'Mirror of Kalandra and other copy effects; mirrored items are generally immutable except where an effect explicitly says otherwise.' },

      { id:'essences', label:'Essences', category:'targeted', default:true, status:'current', summary:'Forced essence modifier plus rare-item reforge; high-tier essences ignore metamods.' },
      { id:'fossils', label:'Fossils & resonators', category:'targeted', default:true, status:'current', summary:'Tag-weight adjustment, blocked tags, special fossils and resonator combinations.' },
      { id:'harvest', label:'Harvest crafting', category:'targeted', default:true, status:'current', summary:'Tag reforges, augments, swaps/conversions, influence reforges and enchantments that remain in the active patch.' },
      { id:'bestiary', label:'Bestiary crafting', category:'targeted', default:true, status:'current', summary:'Imprints, aspect crafts, metamod crafts, add-a-mod crafts, corruption and current special recipes.' },
      { id:'betrayal_unveil', label:'Veiled crafting & Unveil', category:'targeted', default:true, status:'current', summary:'Veiled Exalted/Chaos outcomes, double-veiled drops, unveiling and bench versions of unlocked veiled modifiers.' },
      { id:'rog', label:'Rog / Expedition crafting', category:'targeted', default:true, status:'current', summary:'Rog item modification sequence including add, remove, reroll and tier-up offers.' },

      { id:'influence_exalts', label:'Influence Exalted Orbs', category:'influence', default:true, status:'current', summary:'Shaper, Elder and Conqueror influence exalted orbs; add influence plus an eligible influenced modifier.' },
      { id:'awakeners_orb', label:"Awakener's Orb", category:'influence', default:true, status:'current', summary:'Combines two influences and transfers one influenced modifier from each donor/receiver subject to its rules.' },
      { id:'orb_of_dominance', label:'Orb of Dominance', category:'influence', default:true, status:'current', summary:'Removes one influenced modifier and elevates another eligible influenced modifier.' },
      { id:'harvest_influence', label:'Harvest influence crafts', category:'influence', default:true, status:'current', summary:'Current influence reroll/reforge actions and influence-type randomisation where applicable.' },
      { id:'eldritch_implicits', label:'Eldritch implicits', category:'influence', default:true, status:'current', summary:'Embers, Ichors and Orb of Conflict; cannot coexist with Shaper/Elder/Conqueror influence.' },
      { id:'eldritch_currency', label:'Eldritch prefix/suffix currency', category:'influence', default:true, status:'current', summary:'Eldritch Chaos, Exalted and Annulment actions controlled by Exarch/Eater dominance.' },

      { id:'fracturing_orb', label:'Fracturing Orb', category:'transfer', default:true, status:'current', summary:'Fractures a random explicit on a qualifying non-influenced, non-synthesised, non-fractured rare item.' },
      { id:'talisman_fracture', label:'Bestiary Talisman fracture', category:'transfer', default:true, status:'current', summary:'Current 3.29 Bestiary recipes that fracture one or two modifiers on qualifying rare Talismans.' },
      { id:'recombinator_selected', label:'Recombinator — selected mode', category:'transfer', default:true, status:'current', summary:'Select desired modifiers; the game displays success chance and failure may destroy both inputs.' },
      { id:'recombinator_unpredictable', label:'Recombinator — unpredictable mode', category:'transfer', default:true, status:'current', summary:'Classic prefix/suffix pool recombination with guaranteed output; current rules penalise pools heavy in non-natural exclusive modifiers.' },
      { id:'fractured_fossil', label:'Fractured Fossil', category:'transfer', default:true, status:'current', summary:'In 3.29, fractures a random modifier and cannot be used on fractured or influenced items; it no longer creates a split copy.' },

      { id:'vaal_corruption', label:'Vaal Orb corruption', category:'special', default:true, status:'current', summary:'Corruption outcomes including implicit replacement/addition, brick outcomes and no-change outcomes.' },
      { id:'locus_corruption', label:'Locus of Corruption', category:'special', default:true, status:'current', summary:'Double-corruption outcomes and implicit handling.' },
      { id:'tainted_currency', label:'Tainted currency', category:'special', default:true, status:'current', summary:'Limited crafting on corrupted items, including tainted chaos, exalt, divine, catalyst, sockets and links.' },
      { id:'catalysts', label:'Catalysts', category:'special', default:true, status:'current', summary:'Jewellery quality that scales tagged explicit modifiers; includes current catalyst variants.' },
      { id:'anoints', label:'Anoints', category:'special', default:true, status:'current', summary:'Amulet, ring, Blight item and map anointments where applicable.' },
      { id:'heist_enchants', label:'Heist enchants', category:'special', default:true, status:'current', summary:'Tailoring/Tempering Orbs and experimented-base enchant interactions.' },
      { id:'sacred_orb', label:'Sacred Orb / base defence percentile', category:'special', default:true, status:'current', summary:'Rerolls armour base defence percentile where applicable.' },
      { id:'memory_strands', label:'Memory Strands', category:'special', default:true, status:'current', summary:'Orb of Remembrance and Orb of Unravelling tier-up attempts; item memory value is consumed and crafted modifiers need special handling.' },
      { id:'reflecting_mist', label:'Reflecting Mist', category:'special', default:true, status:'current', summary:'Reflects eligible rings/amulets into mirrored positive/negative modifier outcomes.' },
      { id:'flask_instilling_enkindling', label:'Flask enchant crafting', category:'special', default:true, status:'current', summary:'Instilling and Enkindling Orbs and related flask quality/value changes.' },
      { id:'strongbox_engineering', label:'Strongbox engineering', category:'special', default:true, status:'current', summary:'Engineer’s and Infused Engineer’s Orbs plus ordinary strongbox currency crafting.' },
      { id:'map_currency', label:'Map and special-item currency', category:'special', default:true, status:'current', summary:'Chisels, Delirium Orbs, orbs that alter maps and other non-equipment item crafting where relevant.' },

      { id:'allflame_crafting', label:'Allflame ghost-copy crafting', category:'league', default:true, status:'league-only', summary:'Uses Dead Man’s Sulphur to generate visible ghostly currency outcomes; adds Intangibility and cannot be rolled back by Imprint.' },
      { id:'allflame_ducats', label:'Cursed Ducats', category:'league', default:true, status:'league-only', summary:'Merrick, Cyaxan, Genteel, Kishara, Telesia, Rotmother, Brinehook, Katakohi, Tzamoto, Changeling and other current Ducat effects.' },
      { id:'pantheon_aspects', label:'Pantheon Aspect modifiers', category:'league', default:true, status:'league-only', summary:'Current special modifier pool added in Curse of the Allflame.' },
      { id:'genesis_tree', label:'Genesis Tree item generation', category:'league', default:true, status:'league-only', summary:'Current league item/base generation source; treat as acquisition rather than ordinary reroll crafting.' },

      { id:'incursion_drop_mods', label:'Incursion drop-only modifiers', category:'acquisition', default:true, status:'current', summary:'Temple/Incursion item modifiers that usually require acquiring or transferring a source item.' },
      { id:'betrayal_drop_mods', label:'Betrayal drop-only modifiers', category:'acquisition', default:true, status:'current', summary:'Current drop-only Betrayal modifiers separate from ordinary crafted veiled mods.' },
      { id:'delve_drop_mods', label:'Delve drop-only modifiers', category:'acquisition', default:true, status:'current', summary:'Delve-specific modifier bases and drop-only modifiers.' },
      { id:'breach_grasping', label:'Breach / Grasping Mail modifiers', category:'acquisition', default:true, status:'current', summary:'Breachlord explicit modifiers, including recombinator transfer constraints.' },
      { id:'mercenary_infamous', label:'Mercenary Infamous modifiers', category:'acquisition', default:true, status:'current', summary:'Infamous modifiers obtained from Mercenary equipment and treated as exclusive by recombination.' },
      { id:'synthesis_base_acquisition', label:'Synthesised base acquisition', category:'acquisition', default:true, status:'current-limited', summary:'Acquire existing synthesised bases or uniques; 3.29 removed Harvest synthesise and restricted Bestiary implicit reroll to uniques.' },

      { id:'legacy_synthesis_creation', label:'Legacy Synthesis creation', category:'legacy', default:false, status:'legacy', summary:'Historical Synthesiser/Harvest creation routes not available in current 3.29 challenge-league crafting.' },
      { id:'legacy_necropolis', label:'Legacy Necropolis / Haunted mods', category:'legacy', default:false, status:'legacy', summary:'Legacy graveyard and Haunted modifier routes when a Standard item already exists.' },
      { id:'legacy_crucible', label:'Legacy Crucible trees', category:'legacy', default:false, status:'legacy', summary:'Existing Crucible-tree items and historical tree manipulation only.' },
      { id:'legacy_scourge', label:'Legacy Scourge modifiers', category:'legacy', default:false, status:'legacy', summary:'Existing Scourged items and historical krangling; current tainted currency is separate.' }
    ]
  };
})();
