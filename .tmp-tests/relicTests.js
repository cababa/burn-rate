// constants.ts
var GAME_DATA = {
  character: {
    id: "cto",
    name: "CTO",
    role: "Chief Technical Officer",
    emoji: "\u{1F468}\u200D\u{1F4BB}",
    stats: {
      hp: 75,
      maxHp: 75,
      bandwidth: 3,
      capital: 99,
      mitigation: 0,
      statuses: { vulnerable: 0, weak: 0, strength: 0, dexterity: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, frail: 0, growth: 0, corruption: 0 }
    }
  },
  relics: {
    // --- STARTER RELIC ---
    git_repository: {
      id: "relic_git_repository",
      character: "cto",
      name: "Git Repository",
      rarity: "starter",
      trigger: "combat_end",
      effect: { type: "heal", value: 6 },
      description: "At the end of combat, heal 6 Runway.",
      icon: "\u{1F4E6}",
      tooltip: {
        term: "Version Control",
        definition: "A system that records changes to a file or set of files over time so that you can recall specific versions later."
      }
    },
    // --- COMMON RELICS (8) ---
    sticky_note: {
      id: "relic_sticky_note",
      character: "shared",
      name: "Sticky Note",
      rarity: "common",
      trigger: "combat_start",
      effect: { type: "apply_vulnerable_all", value: 1 },
      description: "At the start of combat, apply 1 Exposed to ALL enemies.",
      icon: "\u{1F4DD}",
      tooltip: { term: "Focus", definition: "A simple tool for keeping priorities clear." }
    },
    opening_move: {
      id: "relic_opening_move",
      character: "shared",
      name: "Opening Move",
      rarity: "common",
      trigger: "first_attack",
      effect: { type: "bonus_damage", value: 8 },
      description: "Your first attack each combat deals +8 Execution.",
      icon: "\u{1F3AF}",
      tooltip: { term: "First Mover", definition: "The advantage of being first to act." }
    },
    safety_net: {
      id: "relic_safety_net",
      character: "shared",
      name: "Safety Net",
      rarity: "common",
      trigger: "combat_start",
      effect: { type: "block", value: 10 },
      description: "Start each combat with 10 Buffer.",
      icon: "\u{1F6E1}\uFE0F",
      tooltip: { term: "Preparation", definition: "Having backup plans ready." }
    },
    fresh_eyes: {
      id: "relic_fresh_eyes",
      character: "shared",
      name: "Fresh Eyes",
      rarity: "common",
      trigger: "passive",
      effect: { type: "strength", value: 1 },
      description: "Gain +1 Velocity.",
      icon: "\u{1F440}",
      tooltip: { term: "Perspective", definition: "New viewpoints reveal hidden solutions." }
    },
    fresh_start: {
      id: "relic_fresh_start",
      character: "shared",
      name: "Fresh Start",
      rarity: "common",
      trigger: "first_turn",
      effect: { type: "gain_bandwidth", value: 1 },
      description: "Gain +1 Bandwidth on the first turn of combat.",
      icon: "\u26A1",
      tooltip: { term: "New Beginnings", definition: "Extra energy when starting fresh." }
    },
    fallback_position: {
      id: "relic_fallback_position",
      character: "shared",
      name: "Fallback Position",
      rarity: "common",
      trigger: "turn_end_conditional",
      effect: { type: "block_if_zero", value: 6 },
      description: "If you end your turn with 0 Buffer, gain 6.",
      icon: "\u{1F3E0}",
      tooltip: { term: "Safety", definition: "Automatic protection when exposed." }
    },
    thick_skin: {
      id: "relic_thick_skin",
      character: "shared",
      name: "Thick Skin",
      rarity: "common",
      trigger: "on_damaged",
      effect: { type: "thorns", value: 3 },
      description: "When you take Runway damage, deal 3 back to the attacker.",
      icon: "\u{1F994}",
      tooltip: { term: "Resilience", definition: "Pushing back against setbacks." }
    },
    smart_money: {
      id: "relic_smart_money",
      character: "shared",
      name: "Smart Money",
      rarity: "common",
      trigger: "on_card_reward",
      effect: { type: "bonus_capital", value: 8 },
      description: "Gain +$8k whenever you receive a card reward.",
      icon: "\u{1F4B0}",
      tooltip: { term: "Investment", definition: "Those who believe in you multiply your gains." }
    },
    // --- UNCOMMON RELICS (6) ---
    momentum: {
      id: "relic_momentum",
      character: "shared",
      name: "Momentum",
      rarity: "uncommon",
      trigger: "on_attack_count",
      effect: { type: "strength_per_attacks", value: 1, threshold: 3 },
      description: "Every time you play 3 Attacks in a turn, gain +1 Velocity.",
      icon: "\u{1F680}",
      tooltip: { term: "Acceleration", definition: "Building speed compounds over time." }
    },
    quick_learner: {
      id: "relic_quick_learner",
      character: "shared",
      name: "Quick Learner",
      rarity: "uncommon",
      trigger: "on_attack_count",
      effect: { type: "dexterity_per_attacks", value: 1, threshold: 3 },
      description: "Every time you play 3 Attacks in a turn, gain +1 Dexterity.",
      icon: "\u{1F4DA}",
      tooltip: { term: "Adaptation", definition: "Learning fast improves your defenses." }
    },
    second_wind: {
      id: "relic_second_wind",
      character: "shared",
      name: "Second Wind",
      rarity: "uncommon",
      trigger: "combat_end_conditional",
      effect: { type: "heal_if_low", value: 12, threshold: 50 },
      description: "If your Runway is \u226450% after combat, heal 12.",
      icon: "\u{1F4A8}",
      tooltip: { term: "Recovery", definition: "The ability to bounce back from near-failure." }
    },
    force_multiplier: {
      id: "relic_force_multiplier",
      character: "shared",
      name: "Force Multiplier",
      rarity: "uncommon",
      trigger: "on_enemy_death",
      effect: { type: "energy_and_draw", value: 1 },
      description: "When an enemy dies, gain 1 Bandwidth and draw 1 card.",
      icon: "\u{1F91D}",
      tooltip: { term: "Leverage", definition: "Victories snowball with the right approach." }
    },
    focus_mode: {
      id: "relic_focus_mode",
      character: "shared",
      name: "Focus Mode",
      rarity: "uncommon",
      trigger: "on_attack_count",
      effect: { type: "block_per_attacks", value: 4, threshold: 3 },
      description: "Every time you play 3 Attacks in a turn, gain 4 Buffer.",
      icon: "\u{1F3AF}",
      tooltip: { term: "Concentration", definition: "Focus creates protection." }
    },
    secret_weapon: {
      id: "relic_secret_weapon",
      character: "shared",
      name: "Secret Weapon",
      rarity: "uncommon",
      trigger: "combat_start",
      effect: { type: "start_with_card", value: 1 },
      description: "Choose a skill card. Start each combat with it in hand.",
      icon: "\u{1F0CF}",
      tooltip: { term: "Reliability", definition: "Your go-to tool, always ready." }
    },
    // --- BOSS RELICS (6) ---
    pivoting_power: {
      id: "relic_pivoting_power",
      character: "shared",
      name: "Pivoting Power",
      rarity: "boss",
      trigger: "passive",
      effect: { type: "snecko", draw_bonus: 2 },
      description: "Draw 2 extra cards per turn. Card costs are randomized (0-3).",
      icon: "\u{1F500}",
      tooltip: { term: "Chaos", definition: "Changing direction opens options but adds uncertainty." }
    },
    memory_bank: {
      id: "relic_memory_bank",
      character: "shared",
      name: "Memory Bank",
      rarity: "boss",
      trigger: "passive",
      effect: { type: "retain_hand" },
      description: "Cards are not discarded at the end of your turn.",
      icon: "\u{1F9E0}",
      tooltip: { term: "Retention", definition: "Saving resources for the right moment." }
    },
    rate_limiter: {
      id: "relic_rate_limiter",
      character: "shared",
      name: "Rate Limiter",
      rarity: "boss",
      trigger: "turn_start",
      effect: { type: "gain_bandwidth", value: 1, card_limit: 6 },
      description: "+1 Bandwidth per turn. You can only play 6 cards per turn.",
      icon: "\u23F1\uFE0F",
      tooltip: { term: "Focus", definition: "Focus over frenzy - quality over quantity." }
    },
    cutting_corners: {
      id: "relic_cutting_corners",
      character: "shared",
      name: "Cutting Corners",
      rarity: "boss",
      trigger: "turn_start",
      effect: { type: "gain_bandwidth", value: 1, add_wounds: 2 },
      description: "+1 Bandwidth per turn. Add 2 Bug cards to your deck.",
      icon: "\u2702\uFE0F",
      tooltip: { term: "Tradeoff", definition: "Short-term gains with long-term costs." }
    },
    no_rest_for_the_bold: {
      id: "relic_no_rest_for_bold",
      character: "shared",
      name: "No Rest for the Bold",
      rarity: "boss",
      trigger: "turn_start",
      effect: { type: "gain_bandwidth", value: 1, disable_rest: true },
      description: "+1 Bandwidth per turn. You cannot rest at Retrospective nodes.",
      icon: "\u{1F319}",
      tooltip: { term: "Hustle", definition: "The grind never stops for those who want to win." }
    },
    aggressive_growth: {
      id: "relic_aggressive_growth",
      character: "shared",
      name: "Aggressive Growth",
      rarity: "boss",
      trigger: "turn_start",
      effect: { type: "gain_bandwidth", value: 1, enemy_strength: 1 },
      description: "+1 Bandwidth per turn. Enemies start combat with +1 Velocity.",
      icon: "\u{1F4C8}",
      tooltip: { term: "Risk", definition: "Moving fast, but facing tougher opposition." }
    },
    // --- EXISTING RARE (keep for compatibility) ---
    coffee_drip: {
      id: "relic_coffee_drip",
      character: "shared",
      name: "Coffee Drip",
      rarity: "rare",
      trigger: "turn_start",
      effect: { type: "gain_bandwidth", value: 1 },
      description: "Start each turn with +1 Bandwidth.",
      icon: "\u2615",
      tooltip: {
        term: "Caffeine",
        definition: "A central nervous system stimulant of the methylxanthine class."
      }
    },
    // ==============================================
    // CTO-EXCLUSIVE RELICS (Ironclad equivalent)
    // ==============================================
    // --- CTO COMMON (Red Skull equivalent) ---
    crunch_mode: {
      id: "relic_crunch_mode",
      character: "cto",
      name: "Crunch Mode",
      rarity: "common",
      trigger: "passive",
      effect: { type: "strength_when_low", value: 3, threshold: 50 },
      description: "While your Runway is \u226450%, gain +3 Velocity.",
      icon: "\u{1F525}",
      tooltip: { term: "Crunch", definition: "When the deadline looms, productivity spikes." }
    },
    // --- CTO UNCOMMON (Paper Phrog equivalent) ---
    growth_mindset: {
      id: "relic_growth_mindset",
      character: "cto",
      name: "Growth Mindset",
      rarity: "uncommon",
      trigger: "passive",
      effect: { type: "vulnerable_bonus", value: 25 },
      description: "Exposed enemies take 75% more damage instead of 50%.",
      icon: "\u{1F331}",
      tooltip: { term: "Iteration", definition: "Every weakness is an opportunity to learn." }
    },
    // --- CTO UNCOMMON (Self-Forming Clay equivalent) ---
    antifragile: {
      id: "relic_antifragile",
      character: "cto",
      name: "Antifragile",
      rarity: "uncommon",
      trigger: "on_hp_loss",
      effect: { type: "block_next_turn", value: 3 },
      description: "Whenever you lose Runway, gain 3 Buffer next turn.",
      icon: "\u{1F48E}",
      tooltip: { term: "Antifragile", definition: "Systems that grow stronger under stress." }
    },
    // --- CTO RARE (Champion Belt equivalent) ---
    pressure_cooker: {
      id: "relic_pressure_cooker",
      character: "cto",
      name: "Pressure Cooker",
      rarity: "rare",
      trigger: "on_vulnerable",
      effect: { type: "apply_weak_on_vulnerable", value: 1 },
      description: "Whenever you apply Exposed, also apply 1 Drained.",
      icon: "\u{1FAD5}",
      tooltip: { term: "Pressure", definition: "High stakes bring out flaws in everyone." }
    },
    // --- CTO RARE (Charon's Ashes equivalent) ---
    phoenix_protocol: {
      id: "relic_phoenix_protocol",
      character: "cto",
      name: "Phoenix Protocol",
      rarity: "rare",
      trigger: "on_exhaust",
      effect: { type: "damage_all_on_exhaust", value: 3 },
      description: "Whenever you Archive a card, deal 3 damage to ALL enemies.",
      icon: "\u{1F525}",
      tooltip: { term: "Rebirth", definition: "From deprecated code, new value emerges." }
    },
    // --- CTO RARE (Magic Flower equivalent) ---
    wellness_program: {
      id: "relic_wellness_program",
      character: "cto",
      name: "Wellness Program",
      rarity: "rare",
      trigger: "passive",
      effect: { type: "healing_bonus", value: 50 },
      description: "Healing is 50% more effective during combat.",
      icon: "\u{1F9D8}",
      tooltip: { term: "Wellbeing", definition: "Invest in your team's health for better output." }
    },
    // --- CTO BOSS (Black Blood equivalent - replaces Git Repository) ---
    unicorn_status: {
      id: "relic_unicorn_status",
      character: "cto",
      name: "Unicorn Status",
      rarity: "boss",
      trigger: "combat_end",
      effect: { type: "heal", value: 12 },
      description: "At the end of combat, heal 12 Runway. (Replaces Git Repository)",
      icon: "\u{1F984}",
      tooltip: { term: "Unicorn", definition: "A startup valued at $1B+. Legendary status." }
    },
    // --- CTO BOSS (Runic Cube equivalent) ---
    data_driven: {
      id: "relic_data_driven",
      character: "cto",
      name: "Data-Driven",
      rarity: "boss",
      trigger: "on_hp_loss",
      effect: { type: "draw_on_hp_loss", value: 1 },
      description: "Whenever you lose Runway, draw 1 card.",
      icon: "\u{1F4CA}",
      tooltip: { term: "Analytics", definition: "Pain points reveal what needs attention." }
    },
    // --- CTO SHOP (Brimstone equivalent) ---
    market_dominance: {
      id: "relic_market_dominance",
      character: "cto",
      name: "Market Dominance",
      rarity: "uncommon",
      // Shop relics are typically uncommon rarity
      trigger: "turn_start",
      effect: { type: "strength_both", value: 2, enemy_strength: 1 },
      description: "At the start of your turn, gain 2 Velocity. Enemies also gain 1 Velocity.",
      icon: "\u{1F451}",
      tooltip: { term: "Dominance", definition: "Leading the market attracts stronger competition." }
    }
  },
  // ==============================================
  // POTIONS - Quick Resources (1:1 STS mapping)
  // ==============================================
  potions: {
    // === COMMON POTIONS (65% drop rate) ===
    angel_check: {
      id: "potion_angel_check",
      name: "Angel Check",
      character: "shared",
      rarity: "common",
      target: "enemy",
      description: "Deal 20 damage.",
      icon: "\u{1F4B8}",
      tooltip: { term: "Angel Investment", definition: "A quick capital injection to accelerate your attack." },
      effects: [{ type: "damage", value: 20 }],
      sacredBarkAffected: true
    },
    emergency_fund: {
      id: "potion_emergency_fund",
      name: "Emergency Fund",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Gain 12 Buffer.",
      icon: "\u{1F3E6}",
      tooltip: { term: "Reserve Capital", definition: "Cash set aside for unexpected challenges." },
      effects: [{ type: "block", value: 12 }],
      sacredBarkAffected: true
    },
    sprint_boost: {
      id: "potion_sprint_boost",
      name: "Sprint Boost",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Draw 3 cards.",
      icon: "\u{1F3C3}",
      tooltip: { term: "Sprint", definition: "A focused period of rapid execution." },
      effects: [{ type: "draw", value: 3 }],
      sacredBarkAffected: true
    },
    talent_surge: {
      id: "potion_talent_surge",
      name: "Talent Surge",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Gain 2 Velocity.",
      icon: "\u{1F468}\u200D\u{1F4BB}",
      tooltip: { term: "Talent", definition: "Great people make great products." },
      effects: [{ type: "gain_strength", value: 2 }],
      sacredBarkAffected: true
    },
    process_upgrade: {
      id: "potion_process_upgrade",
      name: "Process Upgrade",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Gain 2 Dexterity.",
      icon: "\u2699\uFE0F",
      tooltip: { term: "Systems", definition: "Better processes protect the team." },
      effects: [{ type: "gain_dexterity", value: 2 }],
      sacredBarkAffected: true
    },
    espresso_shot: {
      id: "potion_espresso_shot",
      name: "Espresso Shot",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Gain 2 Bandwidth.",
      icon: "\u2615",
      tooltip: { term: "Caffeine", definition: "Fuel for the all-nighter." },
      effects: [{ type: "gain_energy", value: 2 }],
      sacredBarkAffected: true
    },
    pr_blast: {
      id: "potion_pr_blast",
      name: "PR Blast",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Deal 10 damage to ALL enemies.",
      icon: "\u{1F4E2}",
      tooltip: { term: "Press Release", definition: "Broadcast your message to everyone." },
      effects: [{ type: "damage_all", value: 10 }],
      sacredBarkAffected: true
    },
    fud_campaign: {
      id: "potion_fud_campaign",
      name: "FUD Campaign",
      character: "shared",
      rarity: "common",
      target: "enemy",
      description: "Apply 3 Exposed.",
      icon: "\u{1F628}",
      tooltip: { term: "FUD", definition: "Fear, Uncertainty, and Doubt \u2014 used against competitors." },
      effects: [{ type: "apply_vulnerable", value: 3 }],
      sacredBarkAffected: true
    },
    bad_press: {
      id: "potion_bad_press",
      name: "Bad Press",
      character: "shared",
      rarity: "common",
      target: "enemy",
      description: "Apply 3 Drained.",
      icon: "\u{1F4F0}",
      tooltip: { term: "Negative Coverage", definition: "Bad publicity weakens even strong rivals." },
      effects: [{ type: "apply_weak", value: 3 }],
      sacredBarkAffected: true
    },
    adrenaline_rush: {
      id: "potion_adrenaline_rush",
      name: "Adrenaline Rush",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Gain 5 Velocity. At end of turn, lose 5 Velocity.",
      icon: "\u{1F489}",
      tooltip: { term: "Adrenaline", definition: "Temporary burst of power under pressure." },
      effects: [{ type: "temporary_strength", value: 5, duration: 1 }],
      sacredBarkAffected: true
    },
    agile_sprint: {
      id: "potion_agile_sprint",
      name: "Agile Sprint",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Gain 5 Dexterity. At end of turn, lose 5 Dexterity.",
      icon: "\u{1F3C3}\u200D\u2642\uFE0F",
      tooltip: { term: "Agile", definition: "Rapid iteration with temporary focus." },
      effects: [{ type: "temporary_dexterity", value: 5, duration: 1 }],
      sacredBarkAffected: true
    },
    pitch_deck: {
      id: "potion_pitch_deck",
      name: "Pitch Deck",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Add 1 of 3 random Attack cards to your hand. It costs 0 this turn.",
      icon: "\u{1F4CA}",
      tooltip: { term: "Pitch Deck", definition: "Ready-made execution plans for investors." },
      effects: [{ type: "add_random_attack", value: 1 }],
      sacredBarkAffected: true
    },
    playbook: {
      id: "potion_playbook",
      name: "Playbook",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Add 1 of 3 random Skill cards to your hand. It costs 0 this turn.",
      icon: "\u{1F4D8}",
      tooltip: { term: "Playbook", definition: "Tactical options on demand." },
      effects: [{ type: "add_random_skill", value: 1 }],
      sacredBarkAffected: true
    },
    strategy_brief: {
      id: "potion_strategy_brief",
      name: "Strategy Brief",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Add 1 of 3 random Power cards to your hand. It costs 0 this turn.",
      icon: "\u{1F4CB}",
      tooltip: { term: "Strategy", definition: "Long-term advantages from well-planned moves." },
      effects: [{ type: "add_random_power", value: 1 }],
      sacredBarkAffected: true
    },
    wild_card: {
      id: "potion_wild_card",
      name: "Wild Card",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Add 1 of 3 random Colorless cards to your hand. It costs 0 this turn.",
      icon: "\u{1F0CF}",
      tooltip: { term: "Wild Card", definition: "Unconventional tactics from outside the playbook." },
      effects: [{ type: "add_random_colorless", value: 1 }],
      sacredBarkAffected: true
    },
    team_offsite: {
      id: "potion_team_offsite",
      name: "Team Offsite",
      character: "shared",
      rarity: "common",
      target: "none",
      description: "Upgrade all cards in your hand for the rest of combat.",
      icon: "\u{1F3D5}\uFE0F",
      tooltip: { term: "Offsite", definition: "Team retreat that enhances capabilities." },
      effects: [{ type: "upgrade_hand", value: 1 }],
      sacredBarkAffected: false
    },
    // CTO-specific Common
    founder_sacrifice: {
      id: "potion_founder_sacrifice",
      name: "Founder Sacrifice",
      character: "cto",
      rarity: "common",
      target: "none",
      description: "Heal 20% of your Max Runway.",
      icon: "\u{1FA78}",
      tooltip: { term: "Founder Sacrifice", definition: "Putting personal resources back into the company." },
      effects: [{ type: "heal_percent", value: 20 }],
      sacredBarkAffected: true
    },
    // === UNCOMMON POTIONS (25% drop rate) ===
    term_sheet: {
      id: "potion_term_sheet",
      name: "Term Sheet",
      character: "shared",
      rarity: "uncommon",
      target: "none",
      description: "Gain 1 Artifact.",
      icon: "\u{1F4DC}",
      tooltip: { term: "Term Sheet", definition: "Legal protection from unfavorable terms." },
      effects: [{ type: "gain_artifact", value: 1 }],
      sacredBarkAffected: true
    },
    insurance_policy: {
      id: "potion_insurance_policy",
      name: "Insurance Policy",
      character: "shared",
      rarity: "uncommon",
      target: "none",
      description: "Gain 4 Plated Armor.",
      icon: "\u{1F6E1}\uFE0F",
      tooltip: { term: "Insurance", definition: "Ongoing protection against future damage." },
      effects: [{ type: "gain_plated_armor", value: 4 }],
      sacredBarkAffected: true
    },
    recurring_revenue: {
      id: "potion_recurring_revenue",
      name: "Recurring Revenue",
      character: "shared",
      rarity: "uncommon",
      target: "none",
      description: "Gain 5 Regeneration.",
      icon: "\u{1F4B5}",
      tooltip: { term: "MRR", definition: "Monthly Recurring Revenue heals your runway over time." },
      effects: [{ type: "gain_regen", value: 5 }],
      sacredBarkAffected: true
    },
    troll_toll: {
      id: "potion_troll_toll",
      name: "Troll Toll",
      character: "shared",
      rarity: "uncommon",
      target: "none",
      description: "Gain 3 Thorns.",
      icon: "\u{1F335}",
      tooltip: { term: "Patent Troll", definition: "Punish anyone who attacks." },
      effects: [{ type: "gain_thorns", value: 3 }],
      sacredBarkAffected: true
    },
    version_restore: {
      id: "potion_version_restore",
      name: "Version Restore",
      character: "shared",
      rarity: "uncommon",
      target: "card_in_discard",
      description: "Choose a card in your discard pile and return it to your hand. It costs 0 this turn.",
      icon: "\u23EE\uFE0F",
      tooltip: { term: "Restore", definition: "Retrieve past work from version history." },
      effects: [{ type: "return_from_discard", value: 1 }],
      sacredBarkAffected: true
    },
    pivot_juice: {
      id: "potion_pivot_juice",
      name: "Pivot Juice",
      character: "shared",
      rarity: "uncommon",
      target: "cards_in_hand",
      description: "Discard any number of cards, then draw that many.",
      icon: "\u{1F504}",
      tooltip: { term: "Pivot", definition: "Swap your current strategy for something better." },
      effects: [{ type: "gambler", value: 0 }],
      sacredBarkAffected: false
    },
    rapid_prototype: {
      id: "potion_rapid_prototype",
      name: "Rapid Prototype",
      character: "shared",
      rarity: "uncommon",
      target: "none",
      description: "Play the top 3 cards of your draw pile.",
      icon: "\u{1F680}",
      tooltip: { term: "MVP", definition: "Minimum Viable Product \u2014 ship fast and iterate." },
      effects: [{ type: "play_top_cards", value: 3 }],
      sacredBarkAffected: true
    },
    clone_script: {
      id: "potion_clone_script",
      name: "Clone Script",
      character: "shared",
      rarity: "uncommon",
      target: "none",
      description: "This turn, your next card is played twice.",
      icon: "\u{1F4CB}",
      tooltip: { term: "Clone", definition: "Duplicate your best move for double impact." },
      effects: [{ type: "duplicate_next", value: 1 }],
      sacredBarkAffected: true
    },
    // CTO-specific Uncommon
    spring_cleaning: {
      id: "potion_spring_cleaning",
      name: "Spring Cleaning",
      character: "cto",
      rarity: "uncommon",
      target: "cards_in_hand",
      description: "Exhaust any number of cards in your hand.",
      icon: "\u{1F9F9}",
      tooltip: { term: "Refactor", definition: "Clear out the cruft and technical debt." },
      effects: [{ type: "exhaust_choice", value: 0 }],
      sacredBarkAffected: false
    },
    // === RARE POTIONS (10% drop rate) ===
    viral_coefficient: {
      id: "potion_viral_coefficient",
      name: "Viral Coefficient",
      character: "shared",
      rarity: "rare",
      target: "none",
      description: "Gain 1 Ritual.",
      icon: "\u{1F4C8}",
      tooltip: { term: "K-Factor", definition: "Compounding growth that builds on itself each turn." },
      effects: [{ type: "gain_ritual", value: 1 }],
      sacredBarkAffected: true
    },
    equity_grant: {
      id: "potion_equity_grant",
      name: "Equity Grant",
      character: "shared",
      rarity: "rare",
      target: "none",
      description: "Gain 5 Max Runway.",
      icon: "\u{1F4C8}",
      tooltip: { term: "Equity", definition: "Permanent value increase in the company." },
      effects: [{ type: "gain_max_hp", value: 5 }],
      sacredBarkAffected: true
    },
    backup_plan: {
      id: "potion_backup_plan",
      name: "Backup Plan",
      character: "shared",
      rarity: "rare",
      target: "none",
      description: "When you would die, heal to 30% of your Max Runway instead and discard this potion.",
      icon: "\u{1F9DA}",
      tooltip: { term: "Contingency", definition: "Emergency failsafe when everything goes wrong." },
      effects: [{ type: "fairy", value: 30 }],
      sacredBarkAffected: true
    },
    exit_strategy: {
      id: "potion_exit_strategy",
      name: "Exit Strategy",
      character: "shared",
      rarity: "rare",
      target: "none",
      description: "Escape from a non-boss combat. Receive no rewards.",
      icon: "\u{1F6AA}",
      tooltip: { term: "Exit", definition: "Strategic retreat to fight another day." },
      effects: [{ type: "escape", value: 1 }],
      sacredBarkAffected: false
    },
    market_chaos: {
      id: "potion_market_chaos",
      name: "Market Chaos",
      character: "shared",
      rarity: "rare",
      target: "none",
      description: "Draw 5 cards. Randomize the costs of all cards in your hand for the rest of combat.",
      icon: "\u{1F3B2}",
      tooltip: { term: "Volatility", definition: "Embrace chaos for potential gains." },
      effects: [{ type: "snecko", value: 5 }],
      sacredBarkAffected: true
    },
    venture_round: {
      id: "potion_venture_round",
      name: "Venture Round",
      character: "shared",
      rarity: "rare",
      target: "none",
      description: "Fill all your empty potion slots with random potions.",
      icon: "\u{1F4B0}",
      tooltip: { term: "Series Funding", definition: "Massive funding haul fills your reserves." },
      effects: [{ type: "fill_potions", value: 1 }],
      sacredBarkAffected: false
    },
    // CTO-specific Rare
    devops_pipeline: {
      id: "potion_devops_pipeline",
      name: "DevOps Pipeline",
      character: "cto",
      rarity: "rare",
      target: "none",
      description: "Gain 6 Metallicize.",
      icon: "\u{1F527}",
      tooltip: { term: "CI/CD", definition: "Automated deployment provides ongoing protection." },
      effects: [{ type: "gain_metallicize", value: 6 }],
      sacredBarkAffected: true
    }
  },
  cards: {
    // --- BASIC ---
    cto_commit: {
      id: "cto_commit",
      character: "cto",
      name: "Commit",
      type: "attack",
      rarity: "starter",
      cost: 1,
      description: "Execute 6.",
      effects: [{ type: "damage", value: 6, target: "enemy" }],
      icon: "\u{1F680}",
      keywords: [],
      tooltip: { term: "Commit", definition: "Shipping small code chunks. Not pretty, but progress." }
    },
    cto_rollback: {
      id: "cto_rollback",
      character: "cto",
      name: "Rollback",
      type: "skill",
      rarity: "starter",
      cost: 1,
      description: "Gain 5 Buffer.",
      effects: [{ type: "block", value: 5, target: "self" }],
      icon: "\u23EA",
      keywords: [],
      tooltip: { term: "Rollback", definition: "Reverting to a stable state. Prevents the crash." }
    },
    cto_hotfix: {
      id: "cto_hotfix",
      character: "cto",
      name: "Hotfix",
      type: "attack",
      rarity: "starter",
      cost: 2,
      description: "Execute 8. Apply 2 Exposed.",
      effects: [
        { type: "damage", value: 8, target: "enemy" },
        { type: "apply_status", value: 2, status: "vulnerable", target: "enemy" }
      ],
      icon: "\u{1F525}",
      keywords: [],
      tooltip: { term: "Hotfix", definition: "A messy fix that works. Leaves the system exposed." }
    },
    // --- COMMON ---
    cto_quick_fix: {
      // Anger
      id: "cto_quick_fix",
      character: "cto",
      name: "Quick Fix",
      type: "attack",
      rarity: "common",
      cost: 0,
      description: "Execute 6. Add a copy of this card to discard.",
      effects: [
        { type: "damage", value: 6, target: "enemy" },
        { type: "add_copy", value: 1, target: "self" }
      ],
      icon: "\u{1FA79}",
      keywords: [],
      tooltip: { term: "Quick Fix", definition: "A temporary solution that gets the job done but might need revisiting." }
    },
    cto_brute_force: {
      // Heavy Blade
      id: "cto_brute_force",
      character: "cto",
      name: "Brute Force",
      type: "attack",
      rarity: "common",
      cost: 2,
      description: "Execute 14. Velocity affects this card 3 times.",
      effects: [
        { type: "damage", value: 14, target: "enemy", strengthMultiplier: 3 }
      ],
      icon: "\u{1F528}",
      keywords: [],
      tooltip: { term: "Brute Force", definition: "Solving a problem through raw computational power or effort, ignoring elegance." }
    },
    cto_sprint_planning: {
      // Pommel Strike
      id: "cto_sprint_planning",
      character: "cto",
      name: "Sprint Plan",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 9. Draw 1 card.",
      effects: [
        { type: "damage", value: 9, target: "enemy" },
        { type: "draw", value: 1, target: "self" }
      ],
      icon: "\u{1F4C5}",
      keywords: [],
      tooltip: { term: "Sprint Planning", definition: "Setting goals for the next iteration. Clears the path for execution." }
    },
    cto_risk_mitigation: {
      // Clothesline
      id: "cto_risk_mitigation",
      character: "cto",
      name: "Risk Mitigation",
      type: "attack",
      rarity: "common",
      cost: 2,
      description: "Execute 12. Apply 2 Drained.",
      effects: [
        { type: "damage", value: 12, target: "enemy" },
        { type: "apply_status", value: 2, status: "weak", target: "enemy" }
      ],
      icon: "\u{1F454}",
      keywords: [],
      tooltip: { term: "Risk Mitigation", definition: "Strategies to reduce the impact of potential threats." }
    },
    cto_refactor: {
      // True Grit
      id: "cto_refactor",
      character: "cto",
      name: "Refactor",
      type: "skill",
      rarity: "common",
      cost: 1,
      description: "Gain 7 Buffer. Archive a random card.",
      effects: [
        { type: "block", value: 7, target: "self" },
        { type: "exhaust_random", value: 1, target: "self" }
      ],
      icon: "\u267B\uFE0F",
      keywords: [],
      tooltip: { term: "Refactor", definition: "Restructuring code without changing its external behavior. Improves maintainability." }
    },
    cto_ship_it: {
      // Clash
      id: "cto_ship_it",
      character: "cto",
      name: "Ship It!",
      type: "attack",
      rarity: "common",
      cost: 0,
      description: "Can only be played if every card in your hand is an Attack. Execute 14.",
      playCondition: "only_attacks_in_hand",
      effects: [
        { type: "damage", value: 14, target: "enemy" }
      ],
      icon: "\u{1F6A2}",
      keywords: [],
      tooltip: { term: "Ship It!", definition: "Deploying to production. The ultimate goal of the sprint." }
    },
    cto_tooling: {
      // Armaments
      id: "cto_tooling",
      character: "cto",
      name: "Tooling",
      type: "skill",
      rarity: "common",
      cost: 1,
      description: "Gain 5 Buffer. Upgrade a card in your hand.",
      effects: [
        { type: "block", value: 5, target: "self" },
        { type: "upgrade_hand", value: 1, target: "self" }
      ],
      icon: "\u{1F6E0}\uFE0F",
      keywords: [],
      tooltip: { term: "Tooling", definition: "Investing in developer experience and infrastructure. Makes everything better." }
    },
    cto_leverage: {
      // Body Slam
      id: "cto_leverage",
      character: "cto",
      name: "Leverage",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute equal to your current Buffer.",
      effects: [
        { type: "damage_scale_mitigation", value: 1, target: "enemy" }
      ],
      icon: "\u{1F3D7}\uFE0F",
      keywords: [],
      tooltip: { term: "Leverage", definition: "Using existing assets to achieve outsized results." }
    },
    cto_batch_deploy: {
      // Cleave
      id: "cto_batch_deploy",
      character: "cto",
      name: "Batch Deploy",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 8 to ALL enemies.",
      effects: [
        { type: "damage", value: 8, target: "all_enemies" }
      ],
      icon: "\u{1F4E6}",
      keywords: [],
      tooltip: { term: "Batch Deploy", definition: "Releasing multiple changes at once. Efficient but risky." }
    },
    cto_cherry_pick: {
      // Headbutt
      id: "cto_cherry_pick",
      character: "cto",
      name: "Cherry Pick",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 9. Place a card from discard on top of Backlog.",
      effects: [
        { type: "damage", value: 9, target: "enemy" },
        { type: "retrieve_discard", value: 1, target: "self" }
      ],
      icon: "\u{1F352}",
      keywords: [],
      tooltip: { term: "Cherry Pick", definition: "Selecting specific commits to apply to another branch." }
    },
    cto_dual_track: {
      // Iron Wave
      id: "cto_dual_track",
      character: "cto",
      name: "Dual Track",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 5. Gain 5 Buffer.",
      effects: [
        { type: "damage", value: 5, target: "enemy" },
        { type: "block", value: 5, target: "self" }
      ],
      icon: "\u{1F6E4}\uFE0F",
      keywords: [],
      tooltip: { term: "Dual Track", definition: "Discovery and Delivery happening in parallel." }
    },
    cto_compounding_commits: {
      // Perfected Strike
      id: "cto_compounding_commits",
      character: "cto",
      name: "Compounding",
      type: "attack",
      rarity: "common",
      cost: 2,
      description: "Execute 6. Deals +2 for every 'Commit' in your deck.",
      effects: [
        { type: "damage_scale_matches", value: 6, matchString: "Commit", target: "enemy" }
      ],
      icon: "\u{1F4DA}",
      keywords: [],
      tooltip: { term: "Compounding", definition: "Small improvements adding up to massive value over time." }
    },
    cto_yolo_deploy: {
      // Reckless Charge
      id: "cto_yolo_deploy",
      character: "cto",
      name: "YOLO Deploy",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 7. Shuffle a 'Legacy Code' into your Backlog.",
      effects: [
        { type: "damage", value: 7, target: "enemy" },
        { type: "add_card", value: 1, cardId: "status_legacy_code", target: "self" }
      ],
      icon: "\u{1F920}",
      keywords: [],
      tooltip: { term: "YOLO Deploy", definition: "Deploying on Friday at 5pm without tests. What could go wrong?" }
    },
    cto_shotgun_debug: {
      // Sword Boomerang
      id: "cto_shotgun_debug",
      character: "cto",
      name: "Shotgun Debug",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 3 to a random enemy 3 times.",
      effects: [
        { type: "damage", value: 3, target: "enemy" },
        { type: "damage", value: 3, target: "enemy" },
        { type: "damage", value: 3, target: "enemy" }
      ],
      icon: "\u{1F52B}",
      keywords: [],
      tooltip: { term: "Shotgun Debugging", definition: "Changing random things until it works. Not recommended." }
    },
    cto_pair_programming: {
      // Twin Strike
      id: "cto_pair_programming",
      character: "cto",
      name: "Pair Prog",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 5 twice.",
      effects: [
        { type: "damage", value: 5, target: "enemy" },
        { type: "damage", value: 5, target: "enemy" }
      ],
      icon: "\u{1F465}",
      keywords: [],
      tooltip: { term: "Pair Programming", definition: "Two developers, one keyboard. Higher quality, shared context." }
    },
    cto_tech_shortcut: {
      // Wild Strike
      id: "cto_tech_shortcut",
      character: "cto",
      name: "Tech Shortcut",
      type: "attack",
      rarity: "common",
      cost: 1,
      description: "Execute 12. Shuffle a 'Legacy Code' into your discard.",
      effects: [
        { type: "damage", value: 12, target: "enemy" },
        { type: "add_card", value: 1, cardId: "status_legacy_code", target: "self" }
      ],
      icon: "\u2702\uFE0F",
      keywords: [],
      tooltip: { term: "Technical Shortcut", definition: "Quick solution that creates debt. Fast now, painful later." }
    },
    // --- UNCOMMON ---
    cto_root_cause: {
      // Uppercut
      id: "cto_root_cause",
      character: "cto",
      name: "Root Cause",
      type: "attack",
      rarity: "uncommon",
      cost: 2,
      description: "Execute 13. Apply 1 Drained and 1 Exposed.",
      effects: [
        { type: "damage", value: 13, target: "enemy" },
        { type: "apply_status", value: 1, status: "weak", target: "enemy" },
        { type: "apply_status", value: 1, status: "vulnerable", target: "enemy" }
      ],
      icon: "\u{1F50D}",
      keywords: [],
      tooltip: { term: "Root Cause Analysis", definition: "Finding the fundamental reason for a problem to prevent recurrence." }
    },
    cto_troubleshooting: {
      // Evolve
      id: "cto_troubleshooting",
      character: "cto",
      name: "Troubleshoot",
      type: "power",
      rarity: "uncommon",
      cost: 1,
      description: "Whenever you draw a Status card, draw 1 card.",
      effects: [
        { type: "apply_status", value: 1, status: "evolve", target: "self" }
      ],
      icon: "\u{1F4A1}",
      keywords: [],
      tooltip: { term: "Troubleshooting", definition: "Systematic search for the source of a problem." }
    },
    cto_lean_ops: {
      // Feel No Pain
      id: "cto_lean_ops",
      character: "cto",
      name: "Lean Ops",
      type: "power",
      rarity: "uncommon",
      cost: 1,
      description: "Whenever a card is Archived, gain 3 Buffer.",
      effects: [
        { type: "apply_status", value: 3, status: "feelNoPain", target: "self" }
      ],
      icon: "\u{1F9D8}",
      keywords: [],
      tooltip: { term: "Lean Operations", definition: "Maximizing value while minimizing waste." }
    },
    cto_caching: {
      // Metallicize
      id: "cto_caching",
      character: "cto",
      name: "Caching",
      type: "power",
      rarity: "uncommon",
      cost: 1,
      description: "At the end of your turn, gain 3 Buffer.",
      effects: [
        { type: "apply_status", value: 3, status: "metallicize", target: "self" }
      ],
      icon: "\u{1F4BE}",
      keywords: [],
      tooltip: { term: "Caching", definition: "Storing data in a temporary storage area for faster access." }
    },
    cto_code_review: {
      // Inflame
      id: "cto_code_review",
      character: "cto",
      name: "Code Review",
      type: "power",
      rarity: "uncommon",
      cost: 1,
      description: "Gain 2 Velocity.",
      effects: [{ type: "apply_status", value: 2, status: "strength", target: "self" }],
      icon: "\u{1F453}",
      keywords: [],
      tooltip: { term: "Code Review", definition: "Systematic examination of computer source code." }
    },
    cto_resource_allocation: {
      // Spot Weakness
      id: "cto_resource_allocation",
      character: "cto",
      name: "Resource Alloc",
      type: "skill",
      rarity: "uncommon",
      cost: 1,
      description: "If an enemy intends to attack, gain 3 Velocity.",
      effects: [
        { type: "conditional_strength", value: 3, target: "self" }
      ],
      icon: "\u{1F3AF}",
      keywords: [],
      tooltip: { term: "Resource Allocation", definition: "Assigning available resources to the most critical tasks." }
    },
    cto_flow_state: {
      // Battle Trance
      id: "cto_flow_state",
      character: "cto",
      name: "Flow State",
      type: "skill",
      rarity: "uncommon",
      cost: 0,
      description: "Draw 3 cards. You cannot draw any more cards this turn.",
      effects: [
        { type: "draw", value: 3, target: "self" },
        { type: "apply_status", value: 1, status: "noDraw", target: "self" }
      ],
      icon: "\u{1F30A}",
      keywords: [],
      tooltip: { term: "Flow State", definition: "A mental state of complete immersion and focus." }
    },
    cto_market_window: {
      // Carnage
      id: "cto_market_window",
      character: "cto",
      name: "Market Window",
      type: "attack",
      rarity: "uncommon",
      cost: 2,
      ethereal: true,
      description: "Fleeting. Execute 20.",
      effects: [
        { type: "damage", value: 20, target: "enemy" }
      ],
      icon: "\u23F1\uFE0F",
      keywords: ["fleeting"],
      tooltip: { term: "Market Window", definition: "A limited time opportunity to launch a product." }
    },
    cto_talent_poach: {
      // Disarm
      id: "cto_talent_poach",
      character: "cto",
      name: "Talent Poach",
      type: "skill",
      rarity: "uncommon",
      cost: 1,
      exhaust: true,
      description: "Enemy loses 2 Velocity. Archive.",
      effects: [
        { type: "apply_status", value: -2, status: "strength", target: "enemy" }
      ],
      icon: "\u{1F3A3}",
      keywords: ["exhaust"],
      tooltip: { term: "Talent Poaching", definition: "Hiring key employees from competitors to weaken them." }
    },
    cto_viral_loop: {
      // Dropkick
      id: "cto_viral_loop",
      character: "cto",
      name: "Viral Loop",
      type: "attack",
      rarity: "uncommon",
      cost: 1,
      description: "Execute 5. If enemy is Exposed, gain 1 Bandwidth and Draw 1 card.",
      effects: [
        { type: "damage", value: 5, target: "enemy" },
        { type: "conditional_refund", value: 1, target: "self" }
      ],
      icon: "\u27B0",
      keywords: [],
      tooltip: { term: "Viral Loop", definition: "A mechanism that encourages users to invite others, creating exponential growth." }
    },
    cto_firewall: {
      // Flame Barrier
      id: "cto_firewall",
      character: "cto",
      name: "Firewall",
      type: "skill",
      rarity: "uncommon",
      cost: 2,
      description: "Gain 12 Buffer. Whenever you are attacked this turn, Execute 4 to the attacker.",
      effects: [
        { type: "block", value: 12, target: "self" },
        { type: "apply_status", value: 4, status: "thorns", target: "self" }
      ],
      icon: "\u{1F525}\u{1F9F1}",
      keywords: [],
      tooltip: { term: "Firewall", definition: "A network security system that monitors and controls incoming and outgoing traffic." }
    },
    cto_hackathon: {
      // Pummel
      id: "cto_hackathon",
      character: "cto",
      name: "Hackathon",
      type: "attack",
      rarity: "uncommon",
      cost: 1,
      exhaust: true,
      description: "Execute 2, 4 times. Archive.",
      effects: [
        { type: "damage", value: 2, target: "enemy" },
        { type: "damage", value: 2, target: "enemy" },
        { type: "damage", value: 2, target: "enemy" },
        { type: "damage", value: 2, target: "enemy" }
      ],
      icon: "\u{1F355}",
      keywords: ["exhaust"],
      tooltip: { term: "Hackathon", definition: "An event where people engage in rapid collaborative engineering." }
    },
    cto_antifragile: {
      // Rupture
      id: "cto_antifragile",
      character: "cto",
      name: "Antifragile",
      type: "power",
      rarity: "uncommon",
      cost: 1,
      description: "Whenever you lose Runway from a card, gain 1 Velocity.",
      effects: [
        { type: "apply_status", value: 1, status: "antifragile", target: "self" }
      ],
      icon: "\u{1F4AA}",
      keywords: [],
      tooltip: { term: "Antifragile", definition: "Systems that benefit from shocks, volatility, and stress." }
    },
    cto_network_effects: {
      // Demon Form
      id: "cto_network_effects",
      character: "cto",
      name: "Network Effects",
      type: "power",
      rarity: "rare",
      cost: 3,
      description: "At the start of each turn, gain 2 Velocity.",
      effects: [
        { type: "apply_status", value: 2, status: "growth", target: "self" }
      ],
      icon: "\u{1F578}\uFE0F",
      keywords: [],
      tooltip: { term: "Network Effects", definition: "Expensive to build, but once running, your execution compounds infinitely." }
    },
    cto_tech_debt: {
      // Corruption
      id: "cto_tech_debt",
      character: "cto",
      name: "Tech Debt",
      type: "power",
      rarity: "rare",
      cost: 3,
      description: "Skills cost 0 Bandwidth. Whenever you play a Skill, Archive it.",
      effects: [
        { type: "apply_status", value: 1, status: "corruption", target: "self" }
      ],
      icon: "\u{1F4B3}",
      keywords: [],
      tooltip: { term: "Tech Debt", definition: "Move incredibly fast now, but you're burning infrastructure. Win before you run out." }
    },
    cto_bridge_round: {
      // Seeing Red
      id: "cto_bridge_round",
      character: "cto",
      name: "Bridge Round",
      type: "skill",
      rarity: "uncommon",
      cost: 1,
      exhaust: true,
      description: "Gain 2 Bandwidth. Archive.",
      effects: [
        { type: "gain_bandwidth", value: 2, target: "self" }
      ],
      icon: "\u{1F309}",
      keywords: ["exhaust"],
      tooltip: { term: "Bridge Round", definition: "Short-term funding to keep the company afloat until the next major round." }
    },
    cto_market_disruption: {
      // Shockwave
      id: "cto_market_disruption",
      character: "cto",
      name: "Disruption",
      type: "skill",
      rarity: "uncommon",
      cost: 2,
      exhaust: true,
      description: "Apply 3 Drained and 3 Exposed to ALL enemies. Archive.",
      effects: [
        { type: "apply_status", value: 3, status: "weak", target: "all_enemies" },
        { type: "apply_status", value: 3, status: "vulnerable", target: "all_enemies" }
      ],
      icon: "\u{1F4A5}",
      keywords: ["exhaust"],
      tooltip: { term: "Market Disruption", definition: "A new market innovation that displaces established market-leading firms." }
    },
    cto_blitzscaling: {
      // Whirlwind
      id: "cto_blitzscaling",
      character: "cto",
      name: "Blitzscaling",
      type: "attack",
      rarity: "uncommon",
      cost: -1,
      // X Cost
      description: "Execute 5 to ALL enemies X times.",
      effects: [
        { type: "damage", value: 5, target: "all_enemies" }
      ],
      icon: "\u{1F32A}\uFE0F",
      keywords: [],
      tooltip: { term: "Blitzscaling", definition: "Prioritizing speed over efficiency in an environment of uncertainty." }
    },
    // --- STATUS ---
    status_legacy_code: {
      // Wound
      id: "status_legacy_code",
      character: "status",
      name: "Legacy Code",
      type: "status",
      rarity: "special",
      cost: -1,
      unplayable: true,
      retain: true,
      description: "Unplayable. Retain.",
      effects: [],
      icon: "\u{1F3DA}\uFE0F",
      keywords: ["retain", "unplayable"],
      tooltip: { term: "Legacy Code", definition: "Code inherited from someone else or an older version of the software." }
    },
    status_bug: {
      // Dazed
      id: "status_bug",
      character: "status",
      name: "Bug",
      type: "status",
      rarity: "special",
      cost: -1,
      unplayable: true,
      ethereal: true,
      description: "Unplayable. Fleeting.",
      effects: [],
      icon: "\u{1F41B}",
      keywords: ["fleeting", "unplayable"],
      tooltip: { term: "Software Bug", definition: "An error, flaw or fault in a computer program or system." }
    },
    status_burnout: {
      // Burn
      id: "status_burnout",
      character: "status",
      name: "Burnout",
      type: "status",
      rarity: "special",
      cost: -1,
      unplayable: true,
      description: "Unplayable. At end of turn, lose 2 Runway.",
      effects: [
        { type: "lose_hp_turn_end", value: 2, target: "self" }
      ],
      icon: "\u{1F525}",
      keywords: ["unplayable"],
      tooltip: { term: "Burnout", definition: "State of emotional, physical, and mental exhaustion caused by excessive and prolonged stress." }
    },
    status_scope_creep: {
      // Slimed
      id: "status_scope_creep",
      character: "status",
      name: "Scope Creep",
      type: "status",
      rarity: "special",
      cost: 1,
      exhaust: true,
      description: "Archive.",
      effects: [],
      icon: "\u{1F419}",
      keywords: ["exhaust"],
      tooltip: { term: "Scope Creep", definition: "Uncontrolled changes or continuous growth in a project's scope." }
    },
    status_context_switch: {
      // Void
      id: "status_context_switch",
      character: "status",
      name: "Context Switch",
      type: "status",
      rarity: "special",
      cost: -1,
      unplayable: true,
      ethereal: true,
      description: "Unplayable. Fleeting. When drawn, lose 1 Bandwidth.",
      effects: [
        { type: "lose_bandwidth", value: 1, target: "self" }
      ],
      icon: "\u{1F500}",
      keywords: ["fleeting", "unplayable", "exhaust"],
      tooltip: { term: "Context Switching", definition: "Storing and restoring the state of a process so that execution can be resumed from the same point later." }
    },
    card_bug: {
      id: "card_bug",
      character: "status",
      name: "Bug",
      type: "status",
      rarity: "common",
      cost: -2,
      description: "Unplayable. Fleeting.",
      unplayable: true,
      ethereal: true,
      effects: [],
      icon: "\u{1F41B}",
      keywords: ["fleeting"],
      tooltip: { term: "Bug", definition: "A minor issue. Unplayable. Fades away at end of turn." }
    }
  },
  enemies: {
    // --- COMMON ---
    fanboy: {
      // Cultist
      id: "fanboy",
      name: "Feature Creep",
      act: 1,
      type: "normal",
      hp: 50,
      // 48-54
      maxHp: 50,
      mitigation: 0,
      emoji: "\u{1F4E6}",
      description: "Starts small. Grows uncontrollably if you don't execute fast.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "buff",
        value: 3,
        icon: "buff",
        description: "Add Feature"
      },
      rewards: {
        capital: { min: 10, max: 15 },
        card_reward: true
      }
    },
    spaghetti_code: {
      // Jaw Worm
      id: "spaghetti_code",
      name: "The Copycat",
      act: 1,
      type: "normal",
      hp: 42,
      // 40-44
      maxHp: 42,
      mitigation: 0,
      emoji: "\u{1F99C}",
      description: "Imitates your moves. Bites back.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "attack",
        value: 11,
        icon: "attack",
        description: "Mimic"
      },
      rewards: {
        capital: { min: 12, max: 18 },
        card_reward: true
      }
    },
    critical_bug: {
      // Louse Red
      id: "critical_bug",
      name: "The Doubter",
      act: 1,
      type: "normal",
      hp: 13,
      // 10-15
      maxHp: 13,
      mitigation: 0,
      emoji: "\u{1F928}",
      description: "Questions everything. Doubt compounds.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 5, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "buff",
        value: 3,
        icon: "buff",
        description: "Raise Doubt"
      },
      rewards: {
        capital: { min: 5, max: 10 },
        card_reward: true
      }
    },
    minor_bug: {
      // Louse Green
      id: "minor_bug",
      name: "The Naysayer",
      act: 1,
      type: "normal",
      hp: 13,
      // 10-15
      maxHp: 13,
      mitigation: 0,
      emoji: "\u{1F44E}",
      description: "Says 'it won't work.' Slows you down.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 5, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 2,
        icon: "debuff",
        description: "Discourage"
      },
      rewards: {
        capital: { min: 5, max: 10 },
        card_reward: true
      }
    },
    quick_hack: {
      // Acid Slime S
      id: "quick_hack",
      name: "The Shortcut Taker",
      act: 1,
      type: "normal",
      hp: 10,
      // 8-12
      maxHp: 10,
      mitigation: 0,
      emoji: "\u2702\uFE0F",
      description: "Cuts corners. Weakens foundations.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 1,
        icon: "debuff",
        description: "Cut Corners"
      },
      rewards: {
        capital: { min: 3, max: 7 },
        card_reward: false
      }
    },
    tech_debt: {
      // Acid Slime M
      id: "tech_debt",
      name: "The Procrastinator",
      act: 1,
      type: "normal",
      hp: 30,
      // 28-32
      maxHp: 30,
      mitigation: 0,
      emoji: "\u{1F634}",
      description: "Avoids responsibility. Creates baggage.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 1,
        icon: "debuff",
        description: "Delay"
      },
      rewards: {
        capital: { min: 8, max: 12 },
        card_reward: true
      }
    },
    legacy_module: {
      // Acid Slime L
      id: "legacy_module",
      name: "The Old Guard",
      act: 1,
      type: "normal",
      hp: 67,
      // 65-69
      maxHp: 67,
      mitigation: 0,
      emoji: "\u{1F474}",
      description: "Stuck in old ways. Splits into cronies.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 2,
        icon: "debuff",
        description: "Resist Change"
      },
      rewards: {
        capital: { min: 15, max: 20 },
        card_reward: true
      }
    },
    hotfix: {
      // Spike Slime S
      id: "hotfix",
      name: "The Gambler",
      act: 1,
      type: "normal",
      hp: 12,
      // 10-14
      maxHp: 12,
      mitigation: 0,
      emoji: "\u{1F3B2}",
      description: "Takes risky bets. Might hurt you.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "attack",
        value: 5,
        icon: "attack",
        description: "Roll Dice"
      },
      rewards: {
        capital: { min: 3, max: 7 },
        card_reward: false
      }
    },
    bad_merge: {
      // Spike Slime M
      id: "bad_merge",
      name: "The Gossip",
      act: 1,
      type: "normal",
      hp: 30,
      // 28-32
      maxHp: 30,
      mitigation: 0,
      emoji: "\u{1F5E3}\uFE0F",
      description: "Spreads rumors. Hurts morale.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 1,
        icon: "debuff",
        description: "Spread Rumors"
      },
      rewards: {
        capital: { min: 8, max: 12 },
        card_reward: true
      }
    },
    merge_conflict: {
      // Spike Slime L
      id: "merge_conflict",
      name: "The Politician",
      act: 1,
      type: "normal",
      hp: 67,
      // 64-70
      maxHp: 67,
      mitigation: 0,
      emoji: "\u{1F3AD}",
      description: "Plays both sides. Causes division.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 2,
        icon: "debuff",
        description: "Play Politics"
      },
      rewards: {
        capital: { min: 15, max: 20 },
        card_reward: true
      }
    },
    micromanager: {
      // Blue Slaver
      id: "micromanager",
      name: "The Micromanager",
      act: 1,
      type: "normal",
      hp: 48,
      // 46-50
      maxHp: 48,
      mitigation: 0,
      emoji: "\u{1F454}",
      description: "Nitpicks every detail. Stabs you with tasks.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "attack",
        value: 12,
        icon: "attack",
        description: "Nitpick"
      },
      rewards: {
        capital: { min: 12, max: 18 },
        card_reward: true
      }
    },
    feature_pusher: {
      // Red Slaver
      id: "feature_pusher",
      name: "The Dreamer",
      act: 1,
      type: "normal",
      hp: 48,
      // 46-50
      maxHp: 48,
      mitigation: 0,
      emoji: "\u{1F4AD}",
      description: "Always wants more. Never satisfied.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "attack",
        value: 13,
        icon: "attack",
        description: "Demand More"
      },
      rewards: {
        capital: { min: 12, max: 18 },
        card_reward: true
      }
    },
    headhunter: {
      // Looter
      id: "headhunter",
      name: "The Poacher",
      act: 1,
      type: "normal",
      hp: 46,
      // 44-48
      maxHp: 46,
      mitigation: 0,
      emoji: "\u{1F98A}",
      description: "Tries to steal your best people.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "attack",
        value: 10,
        icon: "attack",
        description: "Steal Talent"
      },
      rewards: {
        capital: { min: 15, max: 25 },
        card_reward: true
      }
    },
    memory_leak: {
      // Fungi Beast
      id: "memory_leak",
      name: "The Energy Vampire",
      act: 1,
      type: "normal",
      hp: 25,
      // 22-28
      maxHp: 25,
      mitigation: 0,
      emoji: "\u{1F9DB}",
      description: "Drains your resources over time.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "buff",
        value: 3,
        icon: "buff",
        description: "Drain"
      },
      rewards: {
        capital: { min: 8, max: 12 },
        card_reward: true
      }
    },
    // --- ELITES ---
    scope_creep: {
      // Gremlin Nob
      id: "scope_creep",
      name: "The Scope Creep",
      act: 1,
      type: "elite",
      hp: 76,
      maxHp: 76,
      mitigation: 0,
      emoji: "\u{1F419}",
      description: "Elite: Arms reach for more. Grows stronger when you defend.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "buff",
        value: 1,
        icon: "buff",
        description: "Expand Scope"
      },
      rewards: {
        capital: { min: 25, max: 35 },
        card_reward: true
      }
    },
    over_engineer: {
      // Lagavulin
      id: "over_engineer",
      name: "The Deadline",
      act: 1,
      type: "elite",
      hp: 110,
      // 109-111
      maxHp: 110,
      mitigation: 0,
      emoji: "\u23F0",
      description: "Sits dormant. When it wakes, it hits your Runway hard.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 8, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 1, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 1,
        icon: "debuff",
        description: "Approach"
      },
      rewards: {
        capital: { min: 25, max: 35 },
        card_reward: true
      }
    },
    legacy_monolith: {
      // Sentry 1
      id: "legacy_monolith",
      name: "The Gatekeeper",
      act: 1,
      type: "elite",
      hp: 42,
      // 38-42
      maxHp: 42,
      mitigation: 0,
      emoji: "\u{1F6AA}",
      description: "Blocks progress. Protected by red tape.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 2,
        icon: "debuff",
        description: "Reject"
      },
      rewards: {
        capital: { min: 10, max: 15 },
        card_reward: true
      }
    },
    legacy_hack: {
      // Sentry 2
      id: "legacy_hack",
      name: "The Critic",
      act: 1,
      type: "elite",
      hp: 42,
      maxHp: 42,
      mitigation: 0,
      emoji: "\u{1F4DD}",
      description: "Attacks every idea.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "attack",
        value: 9,
        icon: "attack",
        description: "Criticize"
      },
      rewards: {
        capital: { min: 10, max: 15 },
        card_reward: false
      }
    },
    legacy_patch: {
      // Sentry 3
      id: "legacy_patch",
      name: "The Bureaucrat",
      act: 1,
      type: "elite",
      hp: 42,
      maxHp: 42,
      mitigation: 0,
      emoji: "\u{1F4CB}",
      description: "Creates paperwork. Adds obstacles.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 2,
        icon: "debuff",
        description: "File Report"
      },
      rewards: {
        capital: { min: 10, max: 15 },
        card_reward: false
      }
    },
    // --- BOSSES ---
    boss_the_pivot: {
      // The Guardian
      id: "boss_the_pivot",
      name: "The Pivot",
      act: 1,
      type: "boss",
      hp: 240,
      maxHp: 240,
      mitigation: 0,
      emoji: "\u{1F504}",
      description: "Existential crisis. Can you survive the change?",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "buff",
        value: 9,
        icon: "buff",
        description: "Charging Up"
      },
      rewards: {
        capital: { min: 100, max: 100 },
        card_reward: true
      }
    },
    boss_burn_rate: {
      // Hexaghost
      id: "boss_burn_rate",
      name: "The Burn Rate",
      act: 1,
      type: "boss",
      hp: 250,
      maxHp: 250,
      mitigation: 0,
      emoji: "\u{1F525}",
      description: "Dwindling cash. Damage scales with your Runway.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "attack",
        value: 0,
        // Scales with HP
        icon: "attack",
        description: "Divider"
      },
      rewards: {
        capital: { min: 100, max: 100 },
        card_reward: true
      }
    },
    boss_the_monolith: {
      // Slime Boss
      id: "boss_the_monolith",
      name: "The Goliath",
      act: 1,
      type: "boss",
      hp: 140,
      // Splits at 50% (70)
      maxHp: 140,
      mitigation: 0,
      emoji: "\u{1F3C6}",
      description: "The big competitor. Splits into smaller rivals.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
      currentIntent: {
        type: "debuff",
        value: 3,
        icon: "debuff",
        description: "Crush"
      },
      rewards: {
        capital: { min: 100, max: 100 },
        card_reward: true
      }
    }
  }
};

// logger.ts
var GameLogger = class {
  constructor(enabled = true) {
    this.entries = [];
    this.currentTurn = 0;
    this.currentFloor = 1;
    this.enabled = true;
    this.enabled = enabled;
  }
  /**
   * Set the current turn (for log context)
   */
  setTurn(turn) {
    this.currentTurn = turn;
  }
  /**
   * Set the current floor (for log context)
   */
  setFloor(floor) {
    this.currentFloor = floor;
  }
  /**
   * Enable or disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  /**
   * Log an entry
   */
  log(category, message, context = {}) {
    if (!this.enabled) return;
    const entry = {
      timestamp: Date.now(),
      turn: this.currentTurn,
      floor: this.currentFloor,
      category,
      message,
      context
    };
    this.entries.push(entry);
  }
  /**
   * Log a warning
   */
  warn(category, message, context = {}) {
    this.log("WARNING", `[${category}] ${message}`, context);
  }
  /**
   * Get all log entries
   */
  getEntries() {
    return [...this.entries];
  }
  /**
   * Get entries filtered by category
   */
  getEntriesByCategory(category) {
    return this.entries.filter((e) => e.category === category);
  }
  /**
   * Get entries for a specific turn
   */
  getEntriesByTurn(turn) {
    return this.entries.filter((e) => e.turn === turn);
  }
  /**
   * Clear all entries
   */
  clear() {
    this.entries = [];
    this.currentTurn = 0;
    this.currentFloor = 1;
  }
  /**
   * Export as JSON string
   */
  toJSON() {
    return JSON.stringify(this.entries, null, 2);
  }
  /**
   * Export as LLM-readable narrative text
   */
  toNarrativeText() {
    const lines = [];
    let lastTurn = -1;
    let lastFloor = -1;
    for (const entry of this.entries) {
      if (entry.turn !== lastTurn || entry.floor !== lastFloor) {
        if (lines.length > 0) lines.push("");
        lines.push(`=== TURN ${entry.turn} | FLOOR ${entry.floor} ===`);
        lastTurn = entry.turn;
        lastFloor = entry.floor;
      }
      lines.push(this.formatEntry(entry));
    }
    return lines.join("\n");
  }
  /**
   * Format a single entry for narrative output
   */
  formatEntry(entry) {
    const { category, message, context } = entry;
    let detail = "";
    switch (category) {
      case "CARD_PLAY":
        if (context.cardCost !== void 0) {
          detail = ` (${context.cardCost} energy)`;
        }
        if (context.target) {
          detail += ` targeting ${context.target}`;
        }
        break;
      case "DAMAGE_DEALT":
        if (context.targetHpBefore !== void 0 && context.targetHpAfter !== void 0) {
          detail = ` (HP: ${context.targetHpBefore} \u2192 ${context.targetHpAfter})`;
        }
        break;
      case "DAMAGE_TAKEN":
        if (context.blocked && context.blocked > 0) {
          detail = ` (${context.blocked} blocked, ${context.unblocked || 0} unblocked)`;
        }
        if (context.playerHp !== void 0) {
          detail += ` (HP: ${context.playerHp})`;
        }
        break;
      case "STATUS_APPLIED":
        if (context.statusValue) {
          detail = ` x${context.statusValue}`;
        }
        break;
      case "ENEMY_INTENT":
        if (context.intentDescription) {
          detail = `: ${context.intentDescription}`;
        }
        break;
      case "ENEMY_SPAWN":
        if (context.enemyHp && context.enemyMaxHp) {
          detail = ` (${context.enemyHp}/${context.enemyMaxHp} HP)`;
        }
        break;
      case "REWARD":
        const rewards = [];
        if (context.capital) rewards.push(`$${context.capital}k capital`);
        if (context.relicName) rewards.push(`Relic: ${context.relicName}`);
        if (context.cardRewards?.length) rewards.push(`Cards: ${context.cardRewards.join(", ")}`);
        if (rewards.length) detail = `: ${rewards.join(", ")}`;
        break;
    }
    return `[${category}] ${message}${detail}`;
  }
  /**
   * Get summary statistics
   */
  getSummary() {
    const entriesByCategory = {};
    const turns = /* @__PURE__ */ new Set();
    const floors = /* @__PURE__ */ new Set();
    for (const entry of this.entries) {
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;
      turns.add(entry.turn);
      floors.add(entry.floor);
    }
    return {
      totalEntries: this.entries.length,
      entriesByCategory,
      turnsLogged: turns.size,
      floorsLogged: floors.size
    };
  }
};
var globalLogger = null;
function getGlobalLogger() {
  if (!globalLogger) {
    globalLogger = new GameLogger();
  }
  return globalLogger;
}

// gameLogic.ts
var calculateDamage = (baseDamage, attackerStatus, defenderStatus, strengthMultiplier = 1, relics) => {
  let damage = baseDamage + attackerStatus.strength * strengthMultiplier;
  if (attackerStatus.weak > 0) damage = damage * 0.75;
  if (defenderStatus.vulnerable > 0) {
    const vulnerableMultiplier = relics ? getVulnerableMultiplierInternal(relics) : 1.5;
    damage = damage * vulnerableMultiplier;
  }
  return Math.floor(damage);
};
var getVulnerableMultiplierInternal = (relics) => {
  const growthMindset = relics.find((r) => r.effect.type === "vulnerable_bonus");
  if (growthMindset) {
    return 1.75;
  }
  return 1.5;
};
var generateStarterDeck = () => {
  const deck = [];
  for (let i = 0; i < 5; i++) deck.push({ ...GAME_DATA.cards.cto_commit, id: `commit_${i}_${Math.random().toString(36).substr(2, 9)}` });
  for (let i = 0; i < 4; i++) deck.push({ ...GAME_DATA.cards.cto_rollback, id: `rollback_${i}_${Math.random().toString(36).substr(2, 9)}` });
  deck.push({ ...GAME_DATA.cards.cto_hotfix, id: `hotfix_${Math.random().toString(36).substr(2, 9)}` });
  return deck;
};
var shuffle = (cards) => {
  return [...cards].sort(() => Math.random() - 0.5);
};
var applyCombatStartRelics = (currentStats, relics, enemies) => {
  let newStats = { ...currentStats, statuses: { ...currentStats.statuses } };
  let newEnemies = enemies.map((e) => ({ ...e, statuses: { ...e.statuses } }));
  let messages = [];
  relics.forEach((relic) => {
    relic.attackCounter = 0;
    relic.usedThisCombat = false;
    if (relic.trigger === "combat_start" && relic.effect.type === "block") {
      newStats.mitigation += relic.effect.value || 0;
      messages.push(`${relic.name}: +${relic.effect.value} Mitigation`);
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} applied ${relic.effect.value} block at combat start.`);
    }
    if (relic.trigger === "combat_start" && relic.effect.type === "apply_vulnerable_all") {
      const pressureCookerWeak = getPressureCookerWeak(relics);
      newEnemies.forEach((e) => {
        e.statuses.vulnerable += relic.effect.value || 1;
        if (pressureCookerWeak > 0) {
          e.statuses.weak += pressureCookerWeak;
        }
      });
      messages.push(`${relic.name}: All enemies Exposed!`);
      if (pressureCookerWeak > 0) {
        messages.push(`Pressure Cooker: All enemies Drained!`);
      }
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} applied vulnerable to all enemies at combat start.`);
    }
    if (relic.trigger === "passive" && relic.effect.type === "strength") {
      newStats.statuses.strength += relic.effect.value || 1;
      messages.push(`${relic.name}: +${relic.effect.value} Strength`);
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} applied ${relic.effect.value} strength at combat start.`);
    }
    if (relic.effect.enemy_strength) {
      newEnemies.forEach((e) => {
        e.statuses.strength += relic.effect.enemy_strength || 0;
      });
      messages.push(`${relic.name}: Enemies have +${relic.effect.enemy_strength} Strength`);
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} applied ${relic.effect.enemy_strength} strength to enemies at combat start.`);
    }
  });
  return { stats: newStats, enemies: newEnemies, message: messages.join(" ") };
};
var getRelicWoundsToAdd = (relics) => {
  const wounds = [];
  relics.forEach((relic) => {
    if (relic.effect.add_wounds && relic.effect.add_wounds > 0) {
      const bugCard = GAME_DATA.cards.card_bug;
      if (bugCard) {
        for (let i = 0; i < relic.effect.add_wounds; i++) {
          wounds.push({ ...bugCard, id: `wound_${relic.id}_${i}_${Date.now()}` });
        }
        getGlobalLogger().log("RELIC_EFFECT", `${relic.name} added ${relic.effect.add_wounds} Bug cards to deck.`);
      }
    }
  });
  return wounds;
};
var applyOnCardReward = (relics, currentStats) => {
  let newStats = { ...currentStats };
  const messages = [];
  relics.forEach((relic) => {
    if (relic.trigger === "on_card_reward" && relic.effect.type === "bonus_capital") {
      newStats.capital += relic.effect.value || 0;
      messages.push(`${relic.name}: +$${relic.effect.value}k!`);
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} capital on card reward.`);
    }
  });
  return { stats: newStats, messages };
};
var getSecretWeaponCard = (relics, deck) => {
  const secretWeapon = relics.find((r) => r.effect.type === "start_with_card");
  if (!secretWeapon) return null;
  if (secretWeapon.chosenCardId) {
    let chosen2 = deck.find((c) => c.id === secretWeapon.chosenCardId);
    if (!chosen2) {
      const chosenBase = secretWeapon.chosenCardId.split("_")[0];
      chosen2 = deck.find((c) => c.id.startsWith(chosenBase) && c.type === "skill");
    }
    if (chosen2) {
      getGlobalLogger().log("RELIC_EFFECT", `${secretWeapon.name} added ${chosen2.name} to starting hand.`);
      return chosen2;
    }
  }
  const skillCards = deck.filter((c) => c.type === "skill");
  if (skillCards.length === 0) return null;
  const chosen = skillCards[Math.floor(Math.random() * skillCards.length)];
  getGlobalLogger().log("RELIC_EFFECT", `${secretWeapon.name} added ${chosen.name} to starting hand (random fallback).`);
  return chosen;
};
var applyCombatEndRelics = (currentStats, relics) => {
  let newStats = { ...currentStats };
  let messages = [];
  relics.forEach((relic) => {
    if (relic.trigger === "combat_end" && relic.effect.type === "heal") {
      const healAmount = relic.effect.value || 0;
      const oldHp = newStats.hp;
      newStats.hp = Math.min(newStats.maxHp, newStats.hp + healAmount);
      const actualHeal = newStats.hp - oldHp;
      if (actualHeal > 0) {
        messages.push(`${relic.name}: +${actualHeal} Runway`);
        getGlobalLogger().log("RELIC_EFFECT", `${relic.name} healed ${actualHeal} HP at combat end.`);
      }
    }
    if (relic.trigger === "combat_end_conditional" && relic.effect.type === "heal_if_low") {
      const threshold = (relic.effect.threshold || 50) / 100;
      if (newStats.hp <= newStats.maxHp * threshold) {
        const healAmount = relic.effect.value || 12;
        const oldHp = newStats.hp;
        newStats.hp = Math.min(newStats.maxHp, newStats.hp + healAmount);
        const actualHeal = newStats.hp - oldHp;
        if (actualHeal > 0) {
          messages.push(`${relic.name}: +${actualHeal} Runway (Second Wind!)`);
          getGlobalLogger().log("RELIC_EFFECT", `${relic.name} healed ${actualHeal} HP (conditional) at combat end.`);
        }
      }
    }
  });
  return { stats: newStats, message: messages.join(" ") };
};
var getTurnStartBandwidth = (relics, turn = 1) => {
  let bandwidth = 3;
  relics.forEach((relic) => {
    if (relic.trigger === "turn_start" && relic.effect.type === "gain_bandwidth") {
      bandwidth += relic.effect.value || 0;
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} bandwidth at turn start.`);
    }
    if (relic.trigger === "first_turn" && relic.effect.type === "gain_bandwidth" && turn === 1) {
      bandwidth += relic.effect.value || 0;
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} bandwidth on first turn.`);
    }
    if (relic.trigger === "on_attack_count") {
      relic.attackCounter = 0;
    }
  });
  return bandwidth;
};
var applyTurnEndRelics = (currentStats, relics) => {
  let newStats = { ...currentStats };
  let messages = [];
  relics.forEach((relic) => {
    if (relic.trigger === "turn_end_conditional" && relic.effect.type === "block_if_zero") {
      if (newStats.mitigation === 0) {
        newStats.mitigation += relic.effect.value || 6;
        messages.push(`${relic.name}: +${relic.effect.value} Mitigation (fallback)`);
        getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} block at turn end (conditional).`);
      }
    }
  });
  return { stats: newStats, message: messages.join(" ") };
};
var applyOnAttackRelics = (relics, stats) => {
  let newStats = { ...stats, statuses: { ...stats.statuses } };
  let bonusDamage = 0;
  let messages = [];
  relics.forEach((relic) => {
    if (relic.trigger === "first_attack" && relic.effect.type === "bonus_damage" && !relic.usedThisCombat) {
      bonusDamage += relic.effect.value || 8;
      relic.usedThisCombat = true;
      messages.push(`${relic.name}: +${relic.effect.value} damage!`);
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} bonus damage on first attack.`);
    }
    if (relic.trigger === "on_attack_count") {
      relic.attackCounter = (relic.attackCounter || 0) + 1;
      const threshold = relic.effect.threshold || 3;
      if (relic.attackCounter >= threshold) {
        relic.attackCounter = 0;
        if (relic.effect.type === "strength_per_attacks") {
          newStats.statuses.strength += relic.effect.value || 1;
          messages.push(`${relic.name}: +${relic.effect.value} Execution Power!`);
          getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} Execution Power.`);
        }
        if (relic.effect.type === "block_per_attacks") {
          newStats.mitigation += relic.effect.value || 4;
          messages.push(`${relic.name}: +${relic.effect.value} Mitigation!`);
          getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} Mitigation.`);
        }
        if (relic.effect.type === "dexterity_per_attacks") {
          newStats.statuses.dexterity = (newStats.statuses.dexterity || 0) + (relic.effect.value || 1);
          messages.push(`${relic.name}: +${relic.effect.value} Dexterity!`);
          getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} Dexterity.`);
        }
      }
    }
  });
  return { stats: newStats, bonusDamage, messages };
};
var applyOnEnemyDeathRelics = (relics, stats) => {
  let newStats = { ...stats };
  let drawCards2 = 0;
  let messages = [];
  relics.forEach((relic) => {
    if (relic.trigger === "on_enemy_death" && relic.effect.type === "energy_and_draw") {
      newStats.bandwidth += relic.effect.value || 1;
      drawCards2 += relic.effect.value || 1;
      messages.push(`${relic.name}: +${relic.effect.value} Bandwidth, Draw ${relic.effect.value}!`);
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} bandwidth and draw on enemy death.`);
    }
  });
  return { stats: newStats, drawCards: drawCards2, messages };
};
var applyOnDamagedRelics = (relics, damageAmount, attackerId) => {
  let thornsDamage = 0;
  let messages = [];
  if (damageAmount > 0) {
    relics.forEach((relic) => {
      if (relic.trigger === "on_damaged" && relic.effect.type === "thorns") {
        thornsDamage += relic.effect.value || 3;
        messages.push(`${relic.name}: ${relic.effect.value} damage reflected!`);
        getGlobalLogger().log("RELIC_EFFECT", `${relic.name} reflected ${relic.effect.value} damage.`);
      }
    });
  }
  return { thornsDamage, messages };
};
var canRestAtSite = (relics) => {
  return !relics.some((r) => r.effect.disable_rest === true);
};
var getCardLimit = (relics) => {
  for (const relic of relics) {
    if (relic.effect.card_limit) return relic.effect.card_limit;
  }
  return null;
};
var getDrawBonus = (relics) => {
  let bonus = 0;
  relics.forEach((relic) => {
    if (relic.effect.draw_bonus) bonus += relic.effect.draw_bonus;
  });
  return bonus;
};
var hasSneckoEffect = (relics) => {
  return relics.some((r) => r.effect.type === "snecko");
};
var hasRetainHand = (relics) => {
  return relics.some((r) => r.effect.type === "retain_hand");
};
var getCrunchModeStrength = (relics, hp, maxHp) => {
  const crunchMode = relics.find((r) => r.effect.type === "strength_when_low");
  if (!crunchMode) return 0;
  const threshold = (crunchMode.effect.threshold || 50) / 100;
  if (hp <= maxHp * threshold) {
    return crunchMode.effect.value || 3;
  }
  return 0;
};
var getVulnerableMultiplier = (relics) => {
  const growthMindset = relics.find((r) => r.effect.type === "vulnerable_bonus");
  if (growthMindset) {
    return 1.75;
  }
  return 1.5;
};
var applyOnHpLossRelics = (relics, damageAmount) => {
  let blockNextTurn = 0;
  let drawCards2 = 0;
  const messages = [];
  if (damageAmount > 0) {
    relics.forEach((relic) => {
      if (relic.trigger === "on_hp_loss" && relic.effect.type === "block_next_turn") {
        blockNextTurn += relic.effect.value || 3;
        messages.push(`${relic.name}: +${relic.effect.value} Buffer next turn!`);
        getGlobalLogger().log("RELIC_EFFECT", `${relic.name} will grant ${relic.effect.value} block next turn.`);
      }
      if (relic.trigger === "on_hp_loss" && relic.effect.type === "draw_on_hp_loss") {
        drawCards2 += relic.effect.value || 1;
        messages.push(`${relic.name}: Draw ${relic.effect.value}!`);
        getGlobalLogger().log("RELIC_EFFECT", `${relic.name} drew ${relic.effect.value} cards on HP loss.`);
      }
    });
  }
  return { blockNextTurn, drawCards: drawCards2, messages };
};
var getPressureCookerWeak = (relics) => {
  const pressureCooker = relics.find((r) => r.effect.type === "apply_weak_on_vulnerable");
  if (pressureCooker) {
    return pressureCooker.effect.value || 1;
  }
  return 0;
};
var getPhoenixProtocolDamage = (relics) => {
  const phoenix = relics.find((r) => r.effect.type === "damage_all_on_exhaust");
  if (phoenix) {
    return phoenix.effect.value || 3;
  }
  return 0;
};
var getHealingMultiplier = (relics) => {
  const wellness = relics.find((r) => r.effect.type === "healing_bonus");
  if (wellness) {
    return 1 + (wellness.effect.value || 50) / 100;
  }
  return 1;
};
var applyMarketDominanceRelics = (relics, stats, enemies) => {
  let newStats = { ...stats, statuses: { ...stats.statuses } };
  let newEnemies = enemies.map((e) => ({ ...e, statuses: { ...e.statuses } }));
  const messages = [];
  relics.forEach((relic) => {
    if (relic.effect.type === "strength_both") {
      newStats.statuses.strength += relic.effect.value || 2;
      messages.push(`${relic.name}: +${relic.effect.value} Velocity`);
      getGlobalLogger().log("RELIC_EFFECT", `${relic.name} granted ${relic.effect.value} strength at turn start.`);
      if (relic.effect.enemy_strength) {
        newEnemies.forEach((e) => {
          e.statuses.strength += relic.effect.enemy_strength || 1;
        });
        messages.push(`(Enemies +${relic.effect.enemy_strength})`);
        getGlobalLogger().log("RELIC_EFFECT", `${relic.name} also granted ${relic.effect.enemy_strength} strength to enemies.`);
      }
    }
  });
  return { stats: newStats, enemies: newEnemies, messages };
};

// relicTests.ts
var passed = 0;
var failed = 0;
var failures = [];
function test(name, condition, details) {
  if (condition) {
    console.log(`\u2705 ${name}`);
    passed++;
  } else {
    console.log(`\u274C ${name}${details ? ` - ${details}` : ""}`);
    failed++;
    failures.push(name + (details ? ` (${details})` : ""));
  }
}
function section(title) {
  console.log(`
${"=".repeat(60)}`);
  console.log(`\u{1F4CB} ${title}`);
  console.log("=".repeat(60));
}
function createTestState() {
  const deck = shuffle(generateStarterDeck());
  return {
    playerStats: {
      ...GAME_DATA.character.stats,
      hp: GAME_DATA.character.stats.hp,
      maxHp: GAME_DATA.character.stats.maxHp,
      bandwidth: 3,
      mitigation: 0,
      statuses: { ...GAME_DATA.character.stats.statuses }
    },
    enemies: [],
    hand: [],
    drawPile: deck,
    deck: [...deck],
    discardPile: [],
    exhaustPile: [],
    relics: [],
    turn: 1,
    floor: 1,
    status: "PLAYING",
    rewardOptions: [],
    message: "",
    map: [],
    currentMapPosition: null,
    vendorStock: [],
    pendingDiscard: 0,
    // Potion system
    potions: [null, null, null],
    potionSlotCount: 3,
    potionDropChance: 40,
    duplicateNextCard: false
  };
}
function createTestEnemy(hp = 50, name = "Test Enemy") {
  return {
    id: `test_${Math.random()}`,
    name,
    act: 1,
    type: "normal",
    hp,
    maxHp: hp,
    mitigation: 0,
    emoji: "\u{1F47E}",
    description: "Test enemy",
    statuses: {
      vulnerable: 0,
      strength: 0,
      growth: 0,
      weak: 0,
      metallicize: 0,
      evolve: 0,
      feelNoPain: 0,
      noDraw: 0,
      thorns: 0,
      antifragile: 0,
      artifact: 0,
      curlUp: 0,
      malleable: 0,
      asleep: 0,
      frail: 0
    },
    currentIntent: { type: "attack", value: 10, icon: "attack", description: "Attack" },
    rewards: { capital: { min: 10, max: 20 }, card_reward: true }
  };
}
function testStarterRelics() {
  section("STARTER RELICS");
  {
    let state = createTestState();
    state.playerStats.hp = 50;
    state.playerStats.maxHp = 75;
    state.relics = [GAME_DATA.relics.git_repository];
    const { stats, message } = applyCombatEndRelics(state.playerStats, state.relics);
    test(
      "Git Repository heals 6 HP at combat end",
      stats.hp === 56,
      `Expected 56, got ${stats.hp}`
    );
    test(
      "Git Repository shows heal message",
      message.includes("6"),
      `Message: "${message}"`
    );
  }
  {
    let state = createTestState();
    state.playerStats.hp = 73;
    state.playerStats.maxHp = 75;
    state.relics = [GAME_DATA.relics.git_repository];
    const { stats } = applyCombatEndRelics(state.playerStats, state.relics);
    test(
      "Git Repository respects max HP cap",
      stats.hp === 75,
      `Expected 75 (capped), got ${stats.hp}`
    );
  }
}
function testCommonRelics() {
  section("COMMON RELICS");
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50), createTestEnemy(50)];
    state.relics = [GAME_DATA.relics.sticky_note];
    const { enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);
    test(
      "Sticky Note applies 1 Exposed to ALL enemies",
      enemies.every((e) => e.statuses.vulnerable >= 1),
      `Enemy vulnerable: ${enemies.map((e) => e.statuses.vulnerable).join(", ")}`
    );
  }
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.relics = [{ ...GAME_DATA.relics.opening_move }];
    state.playerStats.bandwidth = 3;
    state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };
    const { bonusDamage: bonus1, stats: stats1 } = applyOnAttackRelics(state.relics, state.playerStats);
    test(
      "Opening Move grants +8 bonus on first attack",
      bonus1 === 8,
      `Expected 8, got ${bonus1}`
    );
    const { bonusDamage: bonus2 } = applyOnAttackRelics(state.relics, stats1);
    test(
      "Opening Move does NOT grant bonus on second attack",
      bonus2 === 0,
      `Expected 0, got ${bonus2}`
    );
  }
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.relics = [GAME_DATA.relics.safety_net];
    const { stats } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);
    test(
      "Safety Net grants 10 Mitigation at combat start",
      stats.mitigation === 10,
      `Expected 10, got ${stats.mitigation}`
    );
  }
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.relics = [GAME_DATA.relics.fresh_eyes];
    state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };
    const { stats } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);
    test(
      "Fresh Eyes grants +1 Strength",
      stats.statuses.strength === 1,
      `Expected 1, got ${stats.statuses.strength}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.fresh_start];
    const bw1 = getTurnStartBandwidth(state.relics, 1);
    const bw2 = getTurnStartBandwidth(state.relics, 2);
    test(
      "Fresh Start grants +1 bandwidth on turn 1",
      bw1 === 4,
      `Expected 4, got ${bw1}`
    );
    test(
      "Fresh Start does NOT grant on turn 2",
      bw2 === 3,
      `Expected 3, got ${bw2}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.fallback_position];
    state.playerStats.mitigation = 0;
    const { stats } = applyTurnEndRelics(state.playerStats, state.relics);
    test(
      "Fallback Position grants 6 Mitigation if at 0 block",
      stats.mitigation === 6,
      `Expected 6, got ${stats.mitigation}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.fallback_position];
    state.playerStats.mitigation = 5;
    const { stats } = applyTurnEndRelics(state.playerStats, state.relics);
    test(
      "Fallback Position does NOT trigger with existing block",
      stats.mitigation === 5,
      `Expected 5, got ${stats.mitigation}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.thick_skin];
    const { thornsDamage } = applyOnDamagedRelics(state.relics, 10, "enemy_1");
    test(
      "Thick Skin deals 3 thorns damage when hit",
      thornsDamage === 3,
      `Expected 3, got ${thornsDamage}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.thick_skin];
    const { thornsDamage } = applyOnDamagedRelics(state.relics, 0, "enemy_1");
    test(
      "Thick Skin does NOT trigger on 0 damage",
      thornsDamage === 0,
      `Expected 0, got ${thornsDamage}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.smart_money];
    state.playerStats.capital = 100;
    const { stats } = applyOnCardReward(state.relics, state.playerStats);
    test(
      "Smart Money grants +8 capital on card reward",
      stats.capital === 108,
      `Expected 108, got ${stats.capital}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.crunch_mode];
    state.playerStats.hp = 30;
    state.playerStats.maxHp = 75;
    const bonusStrength = getCrunchModeStrength(state.relics, state.playerStats.hp, state.playerStats.maxHp);
    test(
      "Crunch Mode grants +3 Strength when HP \u226450%",
      bonusStrength === 3,
      `Expected 3, got ${bonusStrength}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.crunch_mode];
    state.playerStats.hp = 50;
    state.playerStats.maxHp = 75;
    const bonusStrength = getCrunchModeStrength(state.relics, state.playerStats.hp, state.playerStats.maxHp);
    test(
      "Crunch Mode does NOT grant Strength when HP >50%",
      bonusStrength === 0,
      `Expected 0, got ${bonusStrength}`
    );
  }
}
function testUncommonRelics() {
  section("UNCOMMON RELICS");
  {
    let state = createTestState();
    state.relics = [{ ...GAME_DATA.relics.momentum }];
    state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };
    let result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    test(
      "Momentum: 1st attack - no Strength yet",
      state.playerStats.statuses.strength === 0,
      `Got ${state.playerStats.statuses.strength}`
    );
    result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    test(
      "Momentum: 2nd attack - no Strength yet",
      state.playerStats.statuses.strength === 0,
      `Got ${state.playerStats.statuses.strength}`
    );
    result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    test(
      "Momentum: 3rd attack grants +1 Strength",
      state.playerStats.statuses.strength === 1,
      `Expected 1, got ${state.playerStats.statuses.strength}`
    );
  }
  {
    let state = createTestState();
    state.relics = [{ ...GAME_DATA.relics.quick_learner }];
    state.playerStats.statuses = { ...state.playerStats.statuses, dexterity: 0 };
    let result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    test(
      "Quick Learner grants +1 Dexterity after 3 attacks",
      state.playerStats.statuses.dexterity === 1,
      `Expected 1, got ${state.playerStats.statuses.dexterity}`
    );
  }
  {
    let state = createTestState();
    state.relics = [{ ...GAME_DATA.relics.focus_mode }];
    state.playerStats.mitigation = 0;
    let result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    result = applyOnAttackRelics(state.relics, state.playerStats);
    state.playerStats = result.stats;
    test(
      "Focus Mode grants +4 Mitigation after 3 attacks",
      state.playerStats.mitigation === 4,
      `Expected 4, got ${state.playerStats.mitigation}`
    );
  }
  {
    let state = createTestState();
    state.playerStats.hp = 30;
    state.playerStats.maxHp = 75;
    state.relics = [GAME_DATA.relics.second_wind];
    const { stats } = applyCombatEndRelics(state.playerStats, state.relics);
    test(
      "Second Wind heals 12 HP when at \u226450%",
      stats.hp === 42,
      `Expected 42, got ${stats.hp}`
    );
  }
  {
    let state = createTestState();
    state.playerStats.hp = 50;
    state.playerStats.maxHp = 75;
    state.relics = [GAME_DATA.relics.second_wind];
    const { stats } = applyCombatEndRelics(state.playerStats, state.relics);
    test(
      "Second Wind does NOT trigger when HP >50%",
      stats.hp === 50,
      `Expected 50, got ${stats.hp}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.force_multiplier];
    state.playerStats.bandwidth = 2;
    const { stats, drawCards: cardsToDraw } = applyOnEnemyDeathRelics(state.relics, state.playerStats);
    test(
      "Force Multiplier grants +1 bandwidth on enemy death",
      stats.bandwidth === 3,
      `Expected 3, got ${stats.bandwidth}`
    );
    test(
      "Force Multiplier grants +1 card draw on enemy death",
      cardsToDraw === 1,
      `Expected 1, got ${cardsToDraw}`
    );
  }
  {
    let state = createTestState();
    const skillCard = state.deck.find((c) => c.type === "skill");
    state.relics = [{ ...GAME_DATA.relics.secret_weapon }];
    const chosenCard = getSecretWeaponCard(state.relics, state.deck);
    test(
      "Secret Weapon returns a skill card",
      chosenCard !== null && chosenCard.type === "skill",
      `Got ${chosenCard?.type || "null"}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.growth_mindset];
    const multiplier = getVulnerableMultiplier(state.relics);
    test(
      "Growth Mindset increases Vulnerable to 75%",
      multiplier === 1.75,
      `Expected 1.75, got ${multiplier}`
    );
  }
  {
    const testEnemy = createTestEnemy(50);
    testEnemy.statuses.vulnerable = 2;
    const relics = [GAME_DATA.relics.growth_mindset];
    const playerStatus = { ...GAME_DATA.character.stats.statuses };
    const neutralStatus = { ...testEnemy.statuses, vulnerable: 0 };
    const normalDamage = calculateDamage(6, playerStatus, neutralStatus, 1, relics);
    const vulnerableDamage = calculateDamage(6, playerStatus, testEnemy.statuses, 1, relics);
    test(
      "Growth Mindset: 6 base damage becomes 10 vs Vulnerable",
      vulnerableDamage === 10,
      // 6 * 1.75 = 10.5, floored = 10
      `Expected 10 (6 * 1.75), got ${vulnerableDamage}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.antifragile];
    const { blockNextTurn } = applyOnHpLossRelics(state.relics, 10);
    test(
      "Antifragile grants 3 block next turn on HP loss",
      blockNextTurn === 3,
      `Expected 3, got ${blockNextTurn}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.antifragile];
    const { blockNextTurn } = applyOnHpLossRelics(state.relics, 0);
    test(
      "Antifragile does NOT trigger on 0 damage",
      blockNextTurn === 0,
      `Expected 0, got ${blockNextTurn}`
    );
  }
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50), createTestEnemy(50)];
    state.relics = [GAME_DATA.relics.market_dominance];
    state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };
    const { stats, enemies } = applyMarketDominanceRelics(state.relics, state.playerStats, state.enemies);
    test(
      "Market Dominance grants +2 Strength to player",
      stats.statuses.strength === 2,
      `Expected 2, got ${stats.statuses.strength}`
    );
    test(
      "Market Dominance grants +1 Strength to all enemies",
      enemies.every((e) => e.statuses.strength === 1),
      `Enemy strength: ${enemies.map((e) => e.statuses.strength).join(", ")}`
    );
  }
}
function testRareRelics() {
  section("RARE RELICS");
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.coffee_drip];
    const bandwidth = getTurnStartBandwidth(state.relics);
    test(
      "Coffee Drip grants +1 bandwidth every turn",
      bandwidth === 4,
      `Expected 4, got ${bandwidth}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.pressure_cooker];
    const weakAmount = getPressureCookerWeak(state.relics);
    test(
      "Pressure Cooker grants 1 Weak when applying Vulnerable",
      weakAmount === 1,
      `Expected 1, got ${weakAmount}`
    );
  }
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.relics = [GAME_DATA.relics.sticky_note, GAME_DATA.relics.pressure_cooker];
    const { enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);
    test(
      "Pressure Cooker + Sticky Note applies both Vulnerable and Weak",
      enemies[0].statuses.vulnerable >= 1 && enemies[0].statuses.weak >= 1,
      `Vulnerable: ${enemies[0].statuses.vulnerable}, Weak: ${enemies[0].statuses.weak}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.phoenix_protocol];
    const damage = getPhoenixProtocolDamage(state.relics);
    test(
      "Phoenix Protocol deals 3 damage on exhaust",
      damage === 3,
      `Expected 3, got ${damage}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.wellness_program];
    const multiplier = getHealingMultiplier(state.relics);
    test(
      "Wellness Program increases healing by 50%",
      multiplier === 1.5,
      `Expected 1.5, got ${multiplier}`
    );
  }
}
function testBossRelics() {
  section("BOSS RELICS");
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.pivoting_power];
    const hasSnecko = hasSneckoEffect(state.relics);
    const drawBonus = getDrawBonus(state.relics);
    test(
      "Pivoting Power enables Snecko effect",
      hasSnecko === true,
      `Expected true, got ${hasSnecko}`
    );
    test(
      "Pivoting Power grants +2 draw bonus",
      drawBonus === 2,
      `Expected 2, got ${drawBonus}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.memory_bank];
    const retains = hasRetainHand(state.relics);
    test(
      "Memory Bank enables retain hand",
      retains === true,
      `Expected true, got ${retains}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.rate_limiter];
    const bandwidth = getTurnStartBandwidth(state.relics);
    const cardLimit = getCardLimit(state.relics);
    test(
      "Rate Limiter grants +1 bandwidth",
      bandwidth === 4,
      `Expected 4, got ${bandwidth}`
    );
    test(
      "Rate Limiter limits to 6 cards per turn",
      cardLimit === 6,
      `Expected 6, got ${cardLimit}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.cutting_corners];
    const bandwidth = getTurnStartBandwidth(state.relics);
    const wounds = getRelicWoundsToAdd(state.relics);
    test(
      "Cutting Corners grants +1 bandwidth",
      bandwidth === 4,
      `Expected 4, got ${bandwidth}`
    );
    test(
      "Cutting Corners adds 2 Bug cards",
      wounds.length === 2,
      `Expected 2, got ${wounds.length}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.no_rest_for_the_bold];
    const bandwidth = getTurnStartBandwidth(state.relics);
    const canRest = canRestAtSite(state.relics);
    test(
      "No Rest for Bold grants +1 bandwidth",
      bandwidth === 4,
      `Expected 4, got ${bandwidth}`
    );
    test(
      "No Rest for Bold disables resting",
      canRest === false,
      `Expected false, got ${canRest}`
    );
  }
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.relics = [GAME_DATA.relics.aggressive_growth];
    const bandwidth = getTurnStartBandwidth(state.relics);
    const { enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);
    test(
      "Aggressive Growth grants +1 bandwidth",
      bandwidth === 4,
      `Expected 4, got ${bandwidth}`
    );
    test(
      "Aggressive Growth gives enemies +1 Strength",
      enemies[0].statuses.strength === 1,
      `Expected 1, got ${enemies[0].statuses.strength}`
    );
  }
  {
    let state = createTestState();
    state.playerStats.hp = 50;
    state.playerStats.maxHp = 75;
    state.relics = [GAME_DATA.relics.unicorn_status];
    const { stats } = applyCombatEndRelics(state.playerStats, state.relics);
    test(
      "Unicorn Status heals 12 HP at combat end",
      stats.hp === 62,
      `Expected 62, got ${stats.hp}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.data_driven];
    const { drawCards: cardsToDraw } = applyOnHpLossRelics(state.relics, 10);
    test(
      "Data-Driven draws 1 card on HP loss",
      cardsToDraw === 1,
      `Expected 1, got ${cardsToDraw}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.data_driven];
    const { drawCards: cardsToDraw } = applyOnHpLossRelics(state.relics, 0);
    test(
      "Data-Driven does NOT trigger on 0 damage",
      cardsToDraw === 0,
      `Expected 0, got ${cardsToDraw}`
    );
  }
}
function testRelicStacking() {
  section("RELIC STACKING & COMBOS");
  {
    let state = createTestState();
    state.relics = [
      GAME_DATA.relics.coffee_drip,
      GAME_DATA.relics.rate_limiter,
      GAME_DATA.relics.cutting_corners
    ];
    const bandwidth = getTurnStartBandwidth(state.relics);
    test(
      "Multiple bandwidth relics stack (3 + 1 + 1 + 1 = 6)",
      bandwidth === 6,
      `Expected 6, got ${bandwidth}`
    );
  }
  {
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.relics = [
      GAME_DATA.relics.safety_net,
      GAME_DATA.relics.sticky_note,
      GAME_DATA.relics.fresh_eyes
    ];
    state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };
    const { stats, enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);
    test(
      "Safety Net + Fresh Eyes: Block and Strength applied",
      stats.mitigation === 10 && stats.statuses.strength === 1,
      `Block: ${stats.mitigation}, Strength: ${stats.statuses.strength}`
    );
    test(
      "Sticky Note applies Vulnerable alongside other relics",
      enemies[0].statuses.vulnerable >= 1,
      `Vulnerable: ${enemies[0].statuses.vulnerable}`
    );
  }
  {
    let state = createTestState();
    state.relics = [GAME_DATA.relics.antifragile, GAME_DATA.relics.data_driven];
    const { blockNextTurn, drawCards: cardsToDraw } = applyOnHpLossRelics(state.relics, 10);
    test(
      "Antifragile + Data-Driven both trigger on HP loss",
      blockNextTurn === 3 && cardsToDraw === 1,
      `Block next turn: ${blockNextTurn}, Cards to draw: ${cardsToDraw}`
    );
  }
  {
    let state = createTestState();
    state.relics = [
      { ...GAME_DATA.relics.momentum },
      { ...GAME_DATA.relics.quick_learner },
      { ...GAME_DATA.relics.focus_mode }
    ];
    state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0, dexterity: 0 };
    state.playerStats.mitigation = 0;
    for (let i = 0; i < 3; i++) {
      const result = applyOnAttackRelics(state.relics, state.playerStats);
      state.playerStats = result.stats;
    }
    test(
      "All on_attack_count relics trigger after 3 attacks",
      state.playerStats.statuses.strength === 1 && state.playerStats.statuses.dexterity === 1 && state.playerStats.mitigation === 4,
      `Strength: ${state.playerStats.statuses.strength}, Dex: ${state.playerStats.statuses.dexterity}, Block: ${state.playerStats.mitigation}`
    );
  }
  {
    let state = createTestState();
    state.playerStats.hp = 30;
    state.playerStats.maxHp = 75;
    state.relics = [
      GAME_DATA.relics.git_repository,
      // +6
      GAME_DATA.relics.second_wind
      // +12 if ≤50%
    ];
    const { stats } = applyCombatEndRelics(state.playerStats, state.relics);
    test(
      "Git Repository + Second Wind heal 18 total when \u226450%",
      stats.hp === 48,
      // 30 + 6 + 12 = 48
      `Expected 48, got ${stats.hp}`
    );
  }
}
function testRelicMappings() {
  section("RELIC 1:1 MAPPING VERIFICATION");
  const relics = GAME_DATA.relics;
  const requiredProps = ["id", "name", "rarity", "trigger", "effect", "description", "icon"];
  let allValid = true;
  Object.entries(relics).forEach(([key, relic]) => {
    const r = relic;
    const missing = requiredProps.filter((prop) => !(prop in r) || r[prop] === void 0);
    if (missing.length > 0) {
      console.log(`\u274C ${key} missing: ${missing.join(", ")}`);
      allValid = false;
    }
  });
  test("All relics have required properties", allValid);
  const byRarity = {};
  Object.entries(relics).forEach(([key, relic]) => {
    const r = relic;
    if (!byRarity[r.rarity]) byRarity[r.rarity] = [];
    byRarity[r.rarity].push(key);
  });
  console.log("\n\u{1F4CA} Relic Distribution:");
  Object.entries(byRarity).forEach(([rarity, keys]) => {
    console.log(`   ${rarity}: ${keys.length} relics`);
  });
  test("Has starter relic", byRarity["starter"]?.length >= 1, `Got ${byRarity["starter"]?.length || 0}`);
  test("Has common relics", byRarity["common"]?.length >= 5, `Got ${byRarity["common"]?.length || 0}`);
  test("Has uncommon relics", byRarity["uncommon"]?.length >= 4, `Got ${byRarity["uncommon"]?.length || 0}`);
  test("Has boss relics", byRarity["boss"]?.length >= 5, `Got ${byRarity["boss"]?.length || 0}`);
  const validTriggers = [
    "turn_start",
    "turn_end",
    "combat_start",
    "combat_end",
    "on_play",
    "on_draw",
    "passive",
    "first_attack",
    "first_turn",
    "turn_end_conditional",
    "on_damaged",
    "on_card_reward",
    "on_attack_count",
    "combat_end_conditional",
    "on_enemy_death",
    "on_hp_loss",
    "on_vulnerable",
    "on_exhaust"
  ];
  let allTriggersValid = true;
  Object.entries(relics).forEach(([key, relic]) => {
    const r = relic;
    if (!validTriggers.includes(r.trigger)) {
      console.log(`\u274C ${key} has invalid trigger: ${r.trigger}`);
      allTriggersValid = false;
    }
  });
  test("All relics have valid trigger types", allTriggersValid);
  const handledEffects = [
    "heal",
    "block",
    "apply_vulnerable_all",
    "strength",
    "gain_bandwidth",
    "block_if_zero",
    "thorns",
    "bonus_capital",
    "bonus_damage",
    "strength_per_attacks",
    "dexterity_per_attacks",
    "block_per_attacks",
    "heal_if_low",
    "energy_and_draw",
    "start_with_card",
    "snecko",
    "retain_hand",
    "strength_when_low",
    "vulnerable_bonus",
    "block_next_turn",
    "draw_on_hp_loss",
    "apply_weak_on_vulnerable",
    "damage_all_on_exhaust",
    "healing_bonus",
    "strength_both"
  ];
  let allEffectsHandled = true;
  Object.entries(relics).forEach(([key, relic]) => {
    const r = relic;
    const effectType = r.effect?.type;
    if (effectType && !handledEffects.includes(effectType)) {
      console.log(`\u26A0\uFE0F ${key} effect type may need handler: ${effectType}`);
      allEffectsHandled = false;
    }
  });
  test("All relic effect types have handlers", allEffectsHandled);
}
console.log("\n\u{1F50D} COMPREHENSIVE RELIC TEST SUITE\n");
console.log("Testing all relics for 1:1 StS mapping accuracy...\n");
testStarterRelics();
testCommonRelics();
testUncommonRelics();
testRareRelics();
testBossRelics();
testRelicStacking();
testRelicMappings();
console.log("\n" + "=".repeat(60));
console.log("\u{1F4CA} RELIC TEST SUMMARY");
console.log("=".repeat(60));
console.log(`\u2705 Passed: ${passed}`);
console.log(`\u274C Failed: ${failed}`);
console.log(`\u{1F4C8} Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
if (failures.length > 0) {
  console.log("\n\u274C FAILED TESTS:");
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
}
console.log("\n");
export {
  testBossRelics,
  testCommonRelics,
  testRareRelics,
  testStarterRelics,
  testUncommonRelics
};
