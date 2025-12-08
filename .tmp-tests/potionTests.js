// constants.ts
var MAX_HAND_SIZE = 10;
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
var drawCards = (currentDraw, currentDiscard, count) => {
  let drawn = [];
  let newDraw = [...currentDraw];
  let newDiscard = [...currentDiscard];
  for (let i = 0; i < count; i++) {
    if (newDraw.length === 0) {
      if (newDiscard.length === 0) break;
      newDraw = shuffle(newDiscard);
      newDiscard = [];
    }
    const card = newDraw.pop();
    if (card) drawn.push(card);
  }
  return { drawn, newDraw, newDiscard };
};
var processDrawnCards = (drawn, hand, discard, drawPile, stats, message) => {
  let nextHand = [...hand];
  let nextDiscard = [...discard];
  let currentDrawPile = [...drawPile];
  let nextStats = { ...stats };
  let newMessage = message;
  let actualDrawn = [];
  let cardsToProcess = [...drawn];
  let safety = 0;
  while (cardsToProcess.length > 0 && safety < 20) {
    const card = cardsToProcess.shift();
    if (!card) continue;
    if (nextHand.length < MAX_HAND_SIZE) {
      nextHand.push(card);
      actualDrawn.push(card);
      getGlobalLogger().log("CARD_ADDED_TO_HAND", `Added ${card.name} to hand.`);
    } else {
      nextDiscard.push(card);
      newMessage += ` (Hand full! Burned ${card.name})`;
      getGlobalLogger().log("CARD_BURNED", `Hand full, ${card.name} burned to discard.`);
      continue;
    }
    if (card.effects?.some((e) => e.type === "lose_bandwidth") && card.unplayable) {
      nextStats.bandwidth = Math.max(0, nextStats.bandwidth - 1);
      newMessage += ` (Legacy Code drained 1 Bandwidth!)`;
      getGlobalLogger().log("LEGACY_CODE_EFFECT", `Legacy Code drained 1 Bandwidth.`);
    }
    if (card.type === "status" && nextStats.statuses.evolve > 0 && nextStats.statuses.noDraw === 0) {
      safety++;
      getGlobalLogger().log("EVOLVE_TRIGGER", `Evolve triggered, drawing ${nextStats.statuses.evolve} cards.`);
      const evolveResult = drawCards(currentDrawPile, nextDiscard, nextStats.statuses.evolve);
      currentDrawPile = evolveResult.newDraw;
      nextDiscard = evolveResult.newDiscard;
      evolveResult.drawn.forEach((c) => cardsToProcess.push(c));
    }
  }
  return { hand: nextHand, discard: nextDiscard, drawPile: currentDrawPile, stats: nextStats, message: newMessage, drawnCards: actualDrawn };
};
var getAvailablePotions = (character = "cto") => {
  return Object.values(GAME_DATA.potions).filter(
    (p) => p.character === "shared" || p.character === character
  );
};
var getPotionsByRarity = (rarity, character = "cto") => {
  return getAvailablePotions(character).filter((p) => p.rarity === rarity);
};
var generateRandomPotion = (character = "cto", excludeFruitJuice = false) => {
  const roll = Math.random() * 100;
  let rarity;
  if (roll < 65) rarity = "common";
  else if (roll < 90) rarity = "uncommon";
  else rarity = "rare";
  let availablePotions = getPotionsByRarity(rarity, character);
  if (excludeFruitJuice) {
    availablePotions = availablePotions.filter((p) => p.id !== "potion_equity_grant");
  }
  if (availablePotions.length === 0) {
    availablePotions = getAvailablePotions(character);
    if (excludeFruitJuice) {
      availablePotions = availablePotions.filter((p) => p.id !== "potion_equity_grant");
    }
  }
  const selected = availablePotions[Math.floor(Math.random() * availablePotions.length)];
  return { ...selected };
};
var checkPotionDrop = (currentChance) => {
  const roll = Math.random() * 100;
  if (roll < currentChance) {
    const potion = generateRandomPotion();
    getGlobalLogger().log("POTION_DROP", `Potion dropped! ${potion.name} (chance was ${currentChance}%)`);
    return {
      dropped: true,
      newChance: Math.max(0, currentChance - 10),
      potion
    };
  }
  getGlobalLogger().log("POTION_DROP", `No potion drop (chance was ${currentChance}%)`);
  return {
    dropped: false,
    newChance: Math.min(100, currentChance + 10)
  };
};
var canAcquirePotion = (potions) => {
  return potions.some((p) => p === null);
};
var addPotionToSlot = (potions, potion) => {
  const newPotions = [...potions];
  const emptySlotIndex = newPotions.findIndex((p) => p === null);
  if (emptySlotIndex !== -1) {
    newPotions[emptySlotIndex] = potion;
    getGlobalLogger().log("POTION_ACQUIRE", `Added ${potion.name} to slot ${emptySlotIndex}`);
  } else {
    getGlobalLogger().log("POTION_ACQUIRE", `Cannot add ${potion.name} - no empty slots!`);
  }
  return newPotions;
};
var removePotionFromSlot = (potions, slotIndex) => {
  const newPotions = [...potions];
  if (slotIndex >= 0 && slotIndex < newPotions.length) {
    const removed = newPotions[slotIndex];
    newPotions[slotIndex] = null;
    if (removed) {
      getGlobalLogger().log("POTION_REMOVE", `Removed ${removed.name} from slot ${slotIndex}`);
    }
  }
  return newPotions;
};
var getSacredBarkMultiplier = (relics) => {
  const hasSacredBark = relics.some((r) => r.effect?.type === "potion_double");
  return hasSacredBark ? 2 : 1;
};
var initializePotionSlots = (slotCount = 3) => {
  return Array(slotCount).fill(null);
};
var checkFairyPotion = (potions, maxHp, relics) => {
  const fairyIndex = potions.findIndex((p) => p?.id === "potion_backup_plan");
  if (fairyIndex === -1) return null;
  const potion = potions[fairyIndex];
  const multiplier = potion.sacredBarkAffected ? getSacredBarkMultiplier(relics) : 1;
  const healPercent = (potion.effects[0]?.value || 30) * multiplier;
  const healAmount = Math.floor(maxHp * healPercent / 100);
  getGlobalLogger().log("POTION_FAIRY", `Backup Plan activated! Healing to ${healPercent}% (${healAmount} HP)`);
  return { healAmount, slotIndex: fairyIndex };
};
var canUseExitStrategy = (enemies) => {
  return !enemies.some((e) => e.type === "boss");
};
var resolvePotionEffect = (state, potion, slotIndex, targetEnemyId) => {
  let newState = { ...state };
  const multiplier = potion.sacredBarkAffected ? getSacredBarkMultiplier(state.relics) : 1;
  getGlobalLogger().log("POTION_USE", `Used ${potion.name}`, {
    potionName: potion.name,
    slotIndex,
    targetEnemyId,
    multiplier: potion.sacredBarkAffected ? multiplier : 1
  });
  newState.potions = removePotionFromSlot(state.potions, slotIndex);
  const targetEnemy = targetEnemyId ? newState.enemies.find((e) => e.id === targetEnemyId) : newState.enemies[0];
  for (const effect of potion.effects) {
    const value = effect.value * multiplier;
    switch (effect.type) {
      case "damage":
        if (targetEnemy) {
          const damage = calculateDamage(value, newState.playerStats.statuses, targetEnemy.statuses, 1, newState.relics);
          targetEnemy.hp = Math.max(0, targetEnemy.hp - damage);
          getGlobalLogger().log("POTION_EFFECT", `Dealt ${damage} damage to ${targetEnemy.name}`, { amount: damage });
        }
        break;
      case "damage_all":
        for (const enemy of newState.enemies) {
          const damage = calculateDamage(value, newState.playerStats.statuses, enemy.statuses, 1, newState.relics);
          enemy.hp = Math.max(0, enemy.hp - damage);
          getGlobalLogger().log("POTION_EFFECT", `Dealt ${damage} damage to ${enemy.name}`, { amount: damage });
        }
        break;
      case "block":
        newState.playerStats = {
          ...newState.playerStats,
          mitigation: newState.playerStats.mitigation + value
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} block`, { amount: value });
        break;
      case "heal":
        const healAmount = Math.min(value, newState.playerStats.maxHp - newState.playerStats.hp);
        newState.playerStats = {
          ...newState.playerStats,
          hp: newState.playerStats.hp + healAmount
        };
        getGlobalLogger().log("POTION_EFFECT", `Healed ${healAmount} HP`, { amount: healAmount });
        break;
      case "heal_percent":
        const percentHeal = Math.floor(newState.playerStats.maxHp * value / 100);
        const actualHeal = Math.min(percentHeal, newState.playerStats.maxHp - newState.playerStats.hp);
        newState.playerStats = {
          ...newState.playerStats,
          hp: newState.playerStats.hp + actualHeal
        };
        getGlobalLogger().log("POTION_EFFECT", `Healed ${actualHeal} HP (${value}% of max)`, { amount: actualHeal });
        break;
      case "draw":
        const { drawn, newDraw, newDiscard } = drawCards(newState.drawPile, newState.discardPile, value);
        const processedDraw = processDrawnCards(drawn, newState.hand, newDiscard, newDraw, newState.playerStats, "");
        newState = {
          ...newState,
          hand: processedDraw.hand,
          drawPile: processedDraw.drawPile,
          discardPile: processedDraw.discard,
          playerStats: processedDraw.stats
        };
        getGlobalLogger().log("POTION_EFFECT", `Drew ${drawn.length} cards`, { amount: drawn.length });
        break;
      case "gain_energy":
        newState.playerStats = {
          ...newState.playerStats,
          bandwidth: newState.playerStats.bandwidth + value
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} energy`, { amount: value });
        break;
      case "gain_strength":
        newState.playerStats = {
          ...newState.playerStats,
          statuses: {
            ...newState.playerStats.statuses,
            strength: newState.playerStats.statuses.strength + value
          }
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} Strength`, { amount: value });
        break;
      case "gain_dexterity":
        newState.playerStats = {
          ...newState.playerStats,
          statuses: {
            ...newState.playerStats.statuses,
            dexterity: newState.playerStats.statuses.dexterity + value
          }
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} Dexterity`, { amount: value });
        break;
      case "temporary_strength":
        newState.playerStats = {
          ...newState.playerStats,
          statuses: {
            ...newState.playerStats.statuses,
            strength: newState.playerStats.statuses.strength + value
          }
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} temporary Strength`, { amount: value });
        break;
      case "temporary_dexterity":
        newState.playerStats = {
          ...newState.playerStats,
          statuses: {
            ...newState.playerStats.statuses,
            dexterity: newState.playerStats.statuses.dexterity + value
          }
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} temporary Dexterity`, { amount: value });
        break;
      case "apply_vulnerable":
        if (targetEnemy && targetEnemy.statuses.artifact > 0) {
          targetEnemy.statuses.artifact--;
          getGlobalLogger().log("POTION_EFFECT", `${targetEnemy.name}'s Artifact blocked Vulnerable`);
        } else if (targetEnemy) {
          targetEnemy.statuses.vulnerable += value;
          getGlobalLogger().log("POTION_EFFECT", `Applied ${value} Vulnerable to ${targetEnemy.name}`, { amount: value });
        }
        break;
      case "apply_weak":
        if (targetEnemy && targetEnemy.statuses.artifact > 0) {
          targetEnemy.statuses.artifact--;
          getGlobalLogger().log("POTION_EFFECT", `${targetEnemy.name}'s Artifact blocked Weak`);
        } else if (targetEnemy) {
          targetEnemy.statuses.weak += value;
          getGlobalLogger().log("POTION_EFFECT", `Applied ${value} Weak to ${targetEnemy.name}`, { amount: value });
        }
        break;
      case "gain_artifact":
        newState.playerStats = {
          ...newState.playerStats,
          statuses: {
            ...newState.playerStats.statuses,
            artifact: newState.playerStats.statuses.artifact + value
          }
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} Artifact`, { amount: value });
        break;
      case "gain_thorns":
        newState.playerStats = {
          ...newState.playerStats,
          statuses: {
            ...newState.playerStats.statuses,
            thorns: newState.playerStats.statuses.thorns + value
          }
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} Thorns`, { amount: value });
        break;
      case "gain_metallicize":
        newState.playerStats = {
          ...newState.playerStats,
          statuses: {
            ...newState.playerStats.statuses,
            metallicize: newState.playerStats.statuses.metallicize + value
          }
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} Metallicize`, { amount: value });
        break;
      case "gain_max_hp":
        newState.playerStats = {
          ...newState.playerStats,
          maxHp: newState.playerStats.maxHp + value,
          hp: newState.playerStats.hp + value
        };
        getGlobalLogger().log("POTION_EFFECT", `Gained ${value} Max HP`, { amount: value });
        break;
      case "duplicate_next":
        newState.duplicateNextCard = true;
        getGlobalLogger().log("POTION_EFFECT", "Next card played will be played twice");
        break;
      case "upgrade_hand":
        for (const card of newState.hand) {
          if (!card.name.endsWith("+")) {
            card.name = card.name + "+";
            for (const cardEffect of card.effects) {
              if (cardEffect.type === "damage") cardEffect.value += 3;
              if (cardEffect.type === "block") cardEffect.value += 3;
            }
          }
        }
        getGlobalLogger().log("POTION_EFFECT", `Upgraded ${newState.hand.length} cards in hand`);
        break;
      case "gambler":
        const handSize = newState.hand.length;
        newState.discardPile = [...newState.discardPile, ...newState.hand];
        newState.hand = [];
        const gamblerDraw = drawCards(newState.drawPile, newState.discardPile, handSize);
        const processedGambler = processDrawnCards(gamblerDraw.drawn, [], gamblerDraw.newDiscard, gamblerDraw.newDraw, newState.playerStats, "");
        newState = {
          ...newState,
          hand: processedGambler.hand,
          drawPile: processedGambler.drawPile,
          discardPile: processedGambler.discard,
          playerStats: processedGambler.stats
        };
        getGlobalLogger().log("POTION_EFFECT", `Discarded hand and drew ${processedGambler.hand.length} cards`);
        break;
      case "return_from_discard":
        if (newState.discardPile.length > 0) {
          newState.pendingSelection = {
            type: "retrieve",
            count: value,
            action: "add_to_hand",
            context: "discard",
            message: `Choose ${value} card(s) to return to hand`
          };
          newState.status = "CARD_SELECTION";
          getGlobalLogger().log("POTION_EFFECT", `Selecting ${value} cards from discard pile`);
        }
        break;
      case "add_random_attack":
        const attacks = Object.values(GAME_DATA.cards).filter((c) => c.type === "attack" && c.rarity !== "special" && c.rarity !== "starter");
        if (attacks.length > 0) {
          for (let i = 0; i < value; i++) {
            const randomAttack = { ...attacks[Math.floor(Math.random() * attacks.length)], id: `random_attack_${Date.now()}_${i}`, cost: 0 };
            newState.hand.push(randomAttack);
          }
          getGlobalLogger().log("POTION_EFFECT", `Added ${value} random attack(s) to hand`);
        }
        break;
      case "add_random_skill":
        const skills = Object.values(GAME_DATA.cards).filter((c) => c.type === "skill" && c.rarity !== "special" && c.rarity !== "starter");
        if (skills.length > 0) {
          for (let i = 0; i < value; i++) {
            const randomSkill = { ...skills[Math.floor(Math.random() * skills.length)], id: `random_skill_${Date.now()}_${i}`, cost: 0 };
            newState.hand.push(randomSkill);
          }
          getGlobalLogger().log("POTION_EFFECT", `Added ${value} random skill(s) to hand`);
        }
        break;
      case "add_random_power":
        const powers = Object.values(GAME_DATA.cards).filter((c) => c.type === "power" && c.rarity !== "special" && c.rarity !== "starter");
        if (powers.length > 0) {
          const randomPower = { ...powers[Math.floor(Math.random() * powers.length)], id: `random_power_${Date.now()}`, cost: 0 };
          newState.hand.push(randomPower);
          getGlobalLogger().log("POTION_EFFECT", `Added random power to hand: ${randomPower.name}`);
        }
        break;
      case "add_random_colorless":
        const colorless = Object.values(GAME_DATA.cards).filter((c) => c.rarity !== "special" && c.rarity !== "starter");
        if (colorless.length > 0) {
          const randomCard = { ...colorless[Math.floor(Math.random() * colorless.length)], id: `random_colorless_${Date.now()}`, cost: 0 };
          newState.hand.push(randomCard);
          getGlobalLogger().log("POTION_EFFECT", `Added random colorless card to hand: ${randomCard.name}`);
        }
        break;
      case "escape":
        if (canUseExitStrategy(newState.enemies)) {
          newState.status = "MAP";
          newState.enemies = [];
          newState.message = "Escaped from combat!";
          getGlobalLogger().log("POTION_EFFECT", "Escaped from combat");
        }
        break;
      case "snecko":
        for (const card of newState.hand) {
          card.cost = Math.floor(Math.random() * 4);
        }
        getGlobalLogger().log("POTION_EFFECT", "Snecko confusion applied - randomized hand costs");
        break;
      case "fill_potions":
        const character = "cto";
        const newPotions = [...newState.potions];
        for (let i = 0; i < newPotions.length; i++) {
          if (newPotions[i] === null) {
            const randomPotion = generateRandomPotion(character, potion.id === "potion_funding_surge");
            if (randomPotion) {
              newPotions[i] = randomPotion;
              getGlobalLogger().log("POTION_EFFECT", `Generated ${randomPotion.name} in slot ${i}`);
            }
          }
        }
        newState.potions = newPotions;
        break;
      // Fairy potion is handled separately in checkFairyPotion
      case "fairy":
        break;
      // Potions that need additional UI handling or are edge cases
      case "exhaust_choice":
      case "play_top_cards":
      case "gain_ritual":
      case "gain_plated_armor":
      case "gain_regen":
      case "gain_intangible":
        getGlobalLogger().log("POTION_EFFECT", `${effect.type} effect not yet fully implemented`);
        break;
      default:
        getGlobalLogger().log("WARNING", `Unknown potion effect type: ${effect.type}`);
    }
  }
  newState.enemies = newState.enemies.filter((e) => e.hp > 0);
  if (newState.enemies.length === 0 && newState.status === "PLAYING") {
    newState.status = "VICTORY";
    newState.message = "Victory!";
  }
  return newState;
};

// potionTests.ts
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
  console.log(`\u{1F9EA} ${title}`);
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
    potions: [null, null, null],
    potionSlotCount: 3,
    potionDropChance: 40,
    duplicateNextCard: false
  };
}
function createTestEnemy(hp = 50, name = "Test Enemy", type = "normal") {
  return {
    id: `test_${Math.random()}`,
    name,
    act: 1,
    type,
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
function createMockSacredBark() {
  return {
    id: "investors_choice",
    name: "Investor's Choice",
    character: "cto",
    rarity: "boss",
    description: "Potions are twice as effective",
    icon: "\u{1F3AF}",
    trigger: "passive",
    effect: { type: "potion_double" }
  };
}
function testPotionSlots() {
  section("POTION SLOT MANAGEMENT");
  {
    const slots = initializePotionSlots(3);
    test(
      "Initialize 3 potion slots",
      slots.length === 3,
      `Expected 3, got ${slots.length}`
    );
    test(
      "Slots start empty",
      slots.every((s) => s === null),
      `Slots: ${slots.map((s) => s?.name || "null").join(", ")}`
    );
  }
  {
    const slots = [null, null, null];
    test("Can acquire potion with empty slots", canAcquirePotion(slots));
  }
  {
    const potion = GAME_DATA.potions.talent_surge;
    const slots = [potion, null, null];
    test("Can acquire potion with 1/3 slots full", canAcquirePotion(slots));
  }
  {
    const potion = GAME_DATA.potions.talent_surge;
    const slots = [potion, potion, potion];
    test("Cannot acquire potion with full slots", !canAcquirePotion(slots));
  }
  {
    const potion = GAME_DATA.potions.talent_surge;
    const slots = [null, null, null];
    const newSlots = addPotionToSlot(slots, potion);
    test(
      "Add potion to first slot",
      newSlots[0]?.id === potion.id,
      `Slot 0: ${newSlots[0]?.name || "null"}`
    );
    test("Other slots remain empty", newSlots[1] === null && newSlots[2] === null);
  }
  {
    const potion = GAME_DATA.potions.talent_surge;
    const slots = [potion, null, null];
    const newSlots = removePotionFromSlot(slots, 0);
    test("Remove potion from slot 0", newSlots[0] === null);
  }
}
function testPotionDrops() {
  section("POTION DROP MECHANICS");
  {
    const result = checkPotionDrop(40);
    if (!result.dropped) {
      test(
        "Drop chance increases by 10 on no drop",
        result.newChance === 50,
        `Expected 50, got ${result.newChance}`
      );
    } else {
      test(
        "Drop chance decreases by 10 on drop",
        result.newChance === 30,
        `Expected 30, got ${result.newChance}`
      );
    }
  }
  {
    const result = checkPotionDrop(100);
    test("100% drop chance guarantees drop", result.dropped);
  }
  {
    const counts = { common: 0, uncommon: 0, rare: 0 };
    const iterations = 1e3;
    for (let i = 0; i < iterations; i++) {
      const potion = generateRandomPotion("cto", false);
      if (potion) {
        counts[potion.rarity]++;
      }
    }
    const commonRate = counts.common / iterations;
    const uncommonRate = counts.uncommon / iterations;
    const rareRate = counts.rare / iterations;
    test(
      "Common rate ~65%",
      commonRate > 0.5 && commonRate < 0.8,
      `Got ${(commonRate * 100).toFixed(1)}%`
    );
    test(
      "Uncommon rate ~25%",
      uncommonRate > 0.1 && uncommonRate < 0.4,
      `Got ${(uncommonRate * 100).toFixed(1)}%`
    );
    test(
      "Rare rate ~10%",
      rareRate > 0.01 && rareRate < 0.2,
      `Got ${(rareRate * 100).toFixed(1)}%`
    );
  }
  {
    const potions = getAvailablePotions("cto");
    const hasShared = potions.some((p) => p.character === "shared");
    const hasCto = potions.some((p) => p.character === "cto");
    test("Available potions include shared", hasShared);
    test("Available potions include CTO-specific", hasCto);
  }
}
function testPotionEffects() {
  section("POTION EFFECTS");
  {
    const potion = GAME_DATA.potions.talent_surge;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    const prevStrength = state.playerStats.statuses.strength;
    state = resolvePotionEffect(state, potion, 0);
    test(
      "Talent Surge grants +2 Velocity",
      state.playerStats.statuses.strength === prevStrength + 2,
      `Expected ${prevStrength + 2}, got ${state.playerStats.statuses.strength}`
    );
    test("Potion removed from slot", state.potions[0] === null);
  }
  {
    const potion = GAME_DATA.potions.process_upgrade;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    const prevDex = state.playerStats.statuses.dexterity;
    state = resolvePotionEffect(state, potion, 0);
    test(
      "Process Upgrade grants +2 Dexterity",
      state.playerStats.statuses.dexterity === prevDex + 2,
      `Expected ${prevDex + 2}, got ${state.playerStats.statuses.dexterity}`
    );
  }
  {
    const potion = GAME_DATA.potions.emergency_fund;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    state = resolvePotionEffect(state, potion, 0);
    test(
      "Emergency Fund grants 12 block",
      state.playerStats.mitigation === 12,
      `Expected 12, got ${state.playerStats.mitigation}`
    );
  }
  {
    const potion = GAME_DATA.potions.pr_blast;
    let state = createTestState();
    state.enemies = [createTestEnemy(50), createTestEnemy(50)];
    state.potions = [potion, null, null];
    state = resolvePotionEffect(state, potion, 0);
    test(
      "PR Blast damages ALL enemies",
      state.enemies.every((e) => e.hp === 40),
      `Enemy HPs: ${state.enemies.map((e) => e.hp).join(", ")}`
    );
  }
  {
    const potion = GAME_DATA.potions.fud_campaign;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    state = resolvePotionEffect(state, potion, 0, state.enemies[0].id);
    test(
      "FUD Campaign applies 3 Exposed",
      state.enemies[0].statuses.vulnerable === 3,
      `Expected 3, got ${state.enemies[0].statuses.vulnerable}`
    );
  }
  {
    const potion = GAME_DATA.potions.bad_press;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    state = resolvePotionEffect(state, potion, 0, state.enemies[0].id);
    test(
      "Bad Press applies 3 Drained",
      state.enemies[0].statuses.weak === 3,
      `Expected 3, got ${state.enemies[0].statuses.weak}`
    );
  }
  {
    const potion = GAME_DATA.potions.espresso_shot;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    const prevEnergy = state.playerStats.bandwidth;
    state = resolvePotionEffect(state, potion, 0);
    test(
      "Espresso Shot grants +2 bandwidth",
      state.playerStats.bandwidth === prevEnergy + 2,
      `Expected ${prevEnergy + 2}, got ${state.playerStats.bandwidth}`
    );
  }
  {
    const potion = GAME_DATA.potions.angel_check;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    state = resolvePotionEffect(state, potion, 0, state.enemies[0].id);
    test(
      "Angel Check deals 20 damage",
      state.enemies[0].hp === 30,
      `Expected 30, got ${state.enemies[0].hp}`
    );
  }
  {
    const potion = GAME_DATA.potions.sprint_boost;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    const prevHandSize = state.hand.length;
    state = resolvePotionEffect(state, potion, 0);
    test(
      "Sprint Boost draws 3 cards",
      state.hand.length >= prevHandSize + 3 || state.drawPile.length < 3,
      `Hand size went from ${prevHandSize} to ${state.hand.length}`
    );
  }
}
function testSacredBark() {
  section("SACRED BARK / INVESTOR'S CHOICE");
  {
    const relics = [];
    const multiplier = getSacredBarkMultiplier(relics);
    test(
      "No Sacred Bark = 1x multiplier",
      multiplier === 1,
      `Got ${multiplier}`
    );
  }
  {
    const mockSacredBark = createMockSacredBark();
    const relics = [mockSacredBark];
    const multiplier = getSacredBarkMultiplier(relics);
    test(
      "With Sacred Bark = 2x multiplier",
      multiplier === 2,
      `Got ${multiplier}`
    );
  }
  {
    const mockSacredBark = createMockSacredBark();
    const potion = GAME_DATA.potions.talent_surge;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    state.relics = [mockSacredBark];
    const prevStrength = state.playerStats.statuses.strength;
    state = resolvePotionEffect(state, potion, 0);
    test(
      "Talent Surge grants +4 Velocity with Sacred Bark",
      state.playerStats.statuses.strength === prevStrength + 4,
      `Expected ${prevStrength + 4}, got ${state.playerStats.statuses.strength}`
    );
  }
}
function testSpecialPotions() {
  section("SPECIAL POTIONS");
  {
    const normalEnemies = [createTestEnemy(50, "Normal", "normal")];
    const bossEnemies = [createTestEnemy(500, "Boss", "boss")];
    test("Can use Exit Strategy on normal enemies", canUseExitStrategy(normalEnemies));
    test("Cannot use Exit Strategy on boss", !canUseExitStrategy(bossEnemies));
  }
  {
    const potion = GAME_DATA.potions.backup_plan;
    const potions = [potion, null, null];
    const result = checkFairyPotion(potions, 75, []);
    test("Backup Plan found in potions", result !== null);
    if (result) {
      const expectedHeal = Math.floor(75 * 0.3);
      test(
        `Backup Plan heals ~30% of max HP`,
        Math.abs(result.healAmount - expectedHeal) <= 1,
        `Expected ~${expectedHeal}, got ${result.healAmount}`
      );
    }
  }
  {
    const potion = GAME_DATA.potions.clone_script;
    let state = createTestState();
    state.enemies = [createTestEnemy(50)];
    state.potions = [potion, null, null];
    state = resolvePotionEffect(state, potion, 0);
    test(
      "Clone Script sets duplicateNextCard flag",
      state.duplicateNextCard === true
    );
  }
}
console.log("\n\u{1F9EA} POTION SYSTEM TEST SUITE\n");
testPotionSlots();
testPotionDrops();
testPotionEffects();
testSacredBark();
testSpecialPotions();
console.log("\n" + "=".repeat(60));
console.log("\u{1F4CA} TEST SUMMARY");
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
console.log("");
