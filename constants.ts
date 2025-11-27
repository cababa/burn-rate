

import { CardData, EnemyData, CharacterStats, RelicData } from './types';

export const CARD_TYPE_CONFIG = {
    attack: {
        label: "Attack",
        icon: "⚔️",
        textColor: "text-danger",
        borderColor: "border-danger/50 hover:border-danger"
    },
    skill: {
        label: "Skill",
        icon: "🛡️",
        textColor: "text-info",
        borderColor: "border-info/50 hover:border-info"
    },
    power: {
        label: "Power",
        icon: "⚡",
        textColor: "text-warning",
        borderColor: "border-warning/50 hover:border-warning"
    },
    status: {
        label: "Status",
        icon: "💀",
        textColor: "text-gray-400",
        borderColor: "border-gray-500/50 hover:border-gray-500"
    }
};

export const GAME_DATA = {
  character: {
    id: "cto",
    name: "CTO",
    role: "Chief Technical Officer",
    emoji: "👨‍💻",
    stats: {
      hp: 75, // Standard Ironclad start is 80, adjusted slightly
      maxHp: 75,
      bandwidth: 3,
      capital: 0,
      mitigation: 0,
      statuses: { vulnerable: 0, weak: 0, strength: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0 }
    } as CharacterStats
  },
  relics: {
      git_repository: {
          id: "relic_git_repository",
          name: "Git Repository",
          rarity: "starter",
          trigger: "combat_end",
          effect: { type: "heal", value: 6 },
          description: "At the end of combat, heal 6 Runway.",
          icon: "📦",
          tooltip: {
              term: "Version Control",
              definition: "A system that records changes to a file or set of files over time so that you can recall specific versions later."
          }
      } as RelicData,
      coffee_drip: {
          id: "relic_coffee_drip",
          name: "Coffee Drip",
          rarity: "rare",
          trigger: "turn_start",
          effect: { type: "bandwidth", value: 1 },
          description: "Start each turn with +1 Bandwidth.",
          icon: "☕",
          tooltip: {
              term: "Caffeine",
              definition: "A central nervous system stimulant of the methylxanthine class."
          }
      } as RelicData
  },
  cards: {
    // --- BASIC ---
    cto_commit: {
      id: "cto_commit",
      name: "Commit",
      type: "attack",
      cost: 1,
      description: "Deal 6 Execution damage.",
      effects: [{ type: "damage", value: 6, target: "enemy" }],
      icon: "🚀"
    } as CardData,
    cto_rollback: {
      id: "cto_rollback",
      name: "Rollback",
      type: "skill",
      cost: 1,
      description: "Gain 5 Mitigation.",
      effects: [{ type: "block", value: 5, target: "self" }],
      icon: "⏪"
    } as CardData,
    cto_hotfix: {
        id: "cto_hotfix",
        name: "Hotfix",
        type: "attack",
        cost: 2,
        description: "Deal 8 Dmg. Apply 2 Vulnerable.",
        effects: [
            { type: "damage", value: 8, target: "enemy" },
            { type: "apply_status", value: 2, status: 'vulnerable', target: "enemy" }
        ],
        icon: "🔥"
    } as CardData,

    // --- COMMON ---
    cto_quick_fix: { // Anger
        id: "cto_quick_fix",
        name: "Quick Fix",
        type: "attack",
        cost: 0,
        description: "Deal 6 Dmg. Add a copy of this card to discard.",
        effects: [
            { type: "damage", value: 6, target: "enemy" },
            { type: "add_copy", value: 1, target: "self" }
        ],
        icon: "🩹"
    } as CardData,
    cto_brute_force: { // Heavy Blade
        id: "cto_brute_force",
        name: "Brute Force",
        type: "attack",
        cost: 2,
        description: "Deal 14 Dmg. Strength affects this card 3 times.",
        effects: [
            { type: "damage", value: 14, target: "enemy", strengthMultiplier: 3 }
        ],
        icon: "🔨"
    } as CardData,
    cto_sprint_planning: { // Pommel Strike
        id: "cto_sprint_planning",
        name: "Sprint Plan",
        type: "attack",
        cost: 1,
        description: "Deal 9 Dmg. Draw 1 card.",
        effects: [
            { type: "damage", value: 9, target: "enemy" },
            { type: "draw", value: 1, target: "self" }
        ],
        icon: "📅"
    } as CardData,
    cto_risk_mitigation: { // Clothesline
        id: "cto_risk_mitigation",
        name: "Risk Mitigation",
        type: "attack",
        cost: 2,
        description: "Deal 12 Dmg. Apply 2 Weak.",
        effects: [
            { type: "damage", value: 12, target: "enemy" },
            { type: "apply_status", value: 2, status: 'weak', target: "enemy" }
        ],
        icon: "👔"
    } as CardData,
    cto_refactor: { // True Grit
        id: "cto_refactor",
        name: "Refactor",
        type: "skill",
        cost: 1,
        description: "Gain 7 Mitigation. Exhaust a random card.",
        effects: [
            { type: "block", value: 7, target: "self" },
            { type: "exhaust_random", value: 1, target: "self" }
        ],
        icon: "♻️"
    } as CardData,
    cto_ship_it: { // Clash
        id: "cto_ship_it",
        name: "Ship It!",
        type: "attack",
        cost: 0,
        description: "Can only be played if every card in your hand is an Attack. Deal 14 Dmg.",
        playCondition: 'only_attacks_in_hand',
        effects: [
            { type: "damage", value: 14, target: "enemy" }
        ],
        icon: "🚢"
    } as CardData,
    cto_tooling: { // Armaments
        id: "cto_tooling",
        name: "Tooling",
        type: "skill",
        cost: 1,
        description: "Gain 5 Mitigation. Upgrade a card in your hand.",
        effects: [
            { type: "block", value: 5, target: "self" },
            { type: "upgrade_hand", value: 1, target: "self" }
        ],
        icon: "🛠️"
    } as CardData,
    cto_leverage: { // Body Slam
        id: "cto_leverage",
        name: "Leverage",
        type: "attack",
        cost: 1,
        description: "Deal Dmg equal to your current Mitigation.",
        effects: [
            { type: "damage_scale_mitigation", value: 1, target: "enemy" }
        ],
        icon: "🏗️"
    } as CardData,
    cto_batch_deploy: { // Cleave
        id: "cto_batch_deploy",
        name: "Batch Deploy",
        type: "attack",
        cost: 1,
        description: "Deal 8 Dmg to ALL enemies.",
        effects: [
            { type: "damage", value: 8, target: "all_enemies" }
        ],
        icon: "📦"
    } as CardData,
    cto_cherry_pick: { // Headbutt
        id: "cto_cherry_pick",
        name: "Cherry Pick",
        type: "attack",
        cost: 1,
        description: "Deal 9 Dmg. Place a card from discard on top of draw pile.",
        effects: [
            { type: "damage", value: 9, target: "enemy" },
            { type: "retrieve_discard", value: 1, target: "self" }
        ],
        icon: "🍒"
    } as CardData,
    cto_dual_track: { // Iron Wave
        id: "cto_dual_track",
        name: "Dual Track",
        type: "attack",
        cost: 1,
        description: "Deal 5 Dmg. Gain 5 Mitigation.",
        effects: [
            { type: "damage", value: 5, target: "enemy" },
            { type: "block", value: 5, target: "self" }
        ],
        icon: "🛤️"
    } as CardData,
    cto_compounding_commits: { // Perfected Strike
        id: "cto_compounding_commits",
        name: "Compounding",
        type: "attack",
        cost: 2,
        description: "Deal 6 Dmg. Deals +2 for every 'Commit' in your deck.",
        effects: [
             { type: "damage_scale_matches", value: 6, matchString: 'Commit', target: "enemy" }
        ],
        icon: "📚"
    } as CardData,
    cto_yolo_deploy: { // Reckless Charge
        id: "cto_yolo_deploy",
        name: "YOLO Deploy",
        type: "attack",
        cost: 1,
        description: "Deal 7 Dmg. Shuffle a 'Technical Debt' into your draw pile.",
        effects: [
            { type: "damage", value: 7, target: "enemy" },
            { type: "add_card", value: 1, cardId: "status_technical_debt", target: "self" } 
        ],
        icon: "🤠"
    } as CardData,
    cto_shotgun_debug: { // Sword Boomerang
        id: "cto_shotgun_debug",
        name: "Shotgun Debug",
        type: "attack",
        cost: 1,
        description: "Deal 3 Dmg to a random enemy 3 times.",
        effects: [
            { type: "damage", value: 3, target: "enemy" }, 
            { type: "damage", value: 3, target: "enemy" },
            { type: "damage", value: 3, target: "enemy" }
        ],
        icon: "🔫"
    } as CardData,
    cto_pair_programming: { // Twin Strike
        id: "cto_pair_programming",
        name: "Pair Prog",
        type: "attack",
        cost: 1,
        description: "Deal 5 Dmg twice.",
        effects: [
            { type: "damage", value: 5, target: "enemy" },
            { type: "damage", value: 5, target: "enemy" }
        ],
        icon: "👥"
    } as CardData,
    cto_tech_shortcut: { // Wild Strike
        id: "cto_tech_shortcut",
        name: "Tech Shortcut",
        type: "attack",
        cost: 1,
        description: "Deal 12 Dmg. Shuffle a 'Technical Debt' into your discard.",
        effects: [
            { type: "damage", value: 12, target: "enemy" },
            { type: "add_card", value: 1, cardId: "status_technical_debt", target: "self" }
        ],
        icon: "✂️"
    } as CardData,

    // --- UNCOMMON ---
    cto_root_cause: { // Uppercut
        id: "cto_root_cause",
        name: "Root Cause",
        type: "attack",
        cost: 2,
        description: "Deal 13 Dmg. Apply 1 Weak and 1 Vulnerable.",
        effects: [
            { type: "damage", value: 13, target: "enemy" },
            { type: "apply_status", value: 1, status: 'weak', target: "enemy" },
            { type: "apply_status", value: 1, status: 'vulnerable', target: "enemy" }
        ],
        icon: "🔍"
    } as CardData,
    cto_troubleshooting: { // Evolve
        id: "cto_troubleshooting",
        name: "Troubleshoot",
        type: "power",
        cost: 1,
        description: "Whenever you draw a Status card, draw 1 card.",
        effects: [
            { type: "apply_status", value: 1, status: "evolve", target: "self" }
        ],
        icon: "💡"
    } as CardData,
    cto_lean_ops: { // Feel No Pain
        id: "cto_lean_ops",
        name: "Lean Ops",
        type: "power",
        cost: 1,
        description: "Whenever a card is Exhausted, gain 3 Mitigation.",
        effects: [
            { type: "apply_status", value: 3, status: "feelNoPain", target: "self" }
        ],
        icon: "🧘"
    } as CardData,
    cto_caching: { // Metallicize
        id: "cto_caching",
        name: "Caching",
        type: "power",
        cost: 1,
        description: "At the end of your turn, gain 3 Mitigation.",
        effects: [
             { type: "apply_status", value: 3, status: "metallicize", target: "self" }
        ],
        icon: "💾"
    } as CardData,
    cto_code_review: { // Inflame
        id: "cto_code_review",
        name: "Code Review",
        type: "power",
        cost: 1,
        description: "Gain 2 Execution Power (Strength).",
        effects: [{ type: "apply_status", value: 2, status: 'strength', target: "self" }],
        icon: "👓"
    } as CardData,
    cto_resource_allocation: { // Spot Weakness
        id: "cto_resource_allocation",
        name: "Resource Alloc",
        type: "skill",
        cost: 1,
        description: "If the enemy intends to attack, gain 3 Strength.",
        effects: [
            { type: "conditional_strength", value: 3, target: "self" }
        ],
        icon: "🎯"
    } as CardData,
    cto_flow_state: { // Battle Trance
        id: "cto_flow_state",
        name: "Flow State",
        type: "skill",
        cost: 0,
        description: "Draw 3 cards. You cannot draw any more cards this turn.",
        effects: [
            { type: "draw", value: 3, target: "self" },
            { type: "apply_status", value: 1, status: "noDraw", target: "self" }
        ],
        icon: "🌊"
    } as CardData,
    cto_market_window: { // Carnage
        id: "cto_market_window",
        name: "Market Window",
        type: "attack",
        cost: 2,
        ethereal: true,
        description: "Ethereal. Deal 20 Dmg.",
        effects: [
            { type: "damage", value: 20, target: "enemy" }
        ],
        icon: "⏱️"
    } as CardData,
    cto_talent_poach: { // Disarm
        id: "cto_talent_poach",
        name: "Talent Poach",
        type: "skill",
        cost: 1,
        exhaust: true,
        description: "Enemy loses 2 Strength. Exhaust.",
        effects: [
            { type: "apply_status", value: -2, status: 'strength', target: "enemy" } // Negative strength implementation
        ],
        icon: "🎣"
    } as CardData,
    cto_viral_loop: { // Dropkick
        id: "cto_viral_loop",
        name: "Viral Loop",
        type: "attack",
        cost: 1,
        description: "Deal 5 Dmg. If enemy is Vulnerable, gain 1 Bandwidth and Draw 1 card.",
        effects: [
            { type: "damage", value: 5, target: "enemy" },
            { type: "conditional_refund", value: 1, target: "self" }
        ],
        icon: "➰"
    } as CardData,
    cto_firewall: { // Flame Barrier
        id: "cto_firewall",
        name: "Firewall",
        type: "skill",
        cost: 2,
        description: "Gain 12 Mitigation. Whenever you are attacked this turn, deal 4 Dmg to the attacker.",
        effects: [
            { type: "block", value: 12, target: "self" },
            { type: "apply_status", value: 4, status: "thorns", target: "self" }
        ],
        icon: "🔥🧱"
    } as CardData,
    cto_hackathon: { // Pummel
        id: "cto_hackathon",
        name: "Hackathon",
        type: "attack",
        cost: 1,
        exhaust: true,
        description: "Deal 2 Dmg 4 times. Exhaust.",
        effects: [
            { type: "damage", value: 2, target: "enemy" },
            { type: "damage", value: 2, target: "enemy" },
            { type: "damage", value: 2, target: "enemy" },
            { type: "damage", value: 2, target: "enemy" }
        ],
        icon: "🍕"
    } as CardData,
    cto_antifragile: { // Demon Form Logic for MVP
        id: "cto_antifragile",
        name: "Antifragile",
        type: "power",
        cost: 1,
        description: "At the start of your turn, gain 1 Strength.",
        effects: [
            { type: "apply_status", value: 1, status: "antifragile", target: "self" }
        ],
        icon: "💪"
    } as CardData,
    cto_bridge_round: { // Seeing Red
        id: "cto_bridge_round",
        name: "Bridge Round",
        type: "skill",
        cost: 1,
        exhaust: true,
        description: "Gain 2 Bandwidth. Exhaust.",
        effects: [
            { type: "gain_bandwidth", value: 2, target: "self" }
        ],
        icon: "🌉"
    } as CardData,
    cto_market_disruption: { // Shockwave
        id: "cto_market_disruption",
        name: "Disruption",
        type: "skill",
        cost: 2,
        exhaust: true,
        description: "Apply 3 Weak and 3 Vulnerable to ALL enemies. Exhaust.",
        effects: [
            { type: "apply_status", value: 3, status: "weak", target: "all_enemies" },
            { type: "apply_status", value: 3, status: "vulnerable", target: "all_enemies" }
        ],
        icon: "💥"
    } as CardData,
    cto_blitzscaling: { // Whirlwind
        id: "cto_blitzscaling",
        name: "Blitzscaling",
        type: "attack",
        cost: -1, // X Cost
        description: "Deal 5 Dmg to ALL enemies X times.",
        effects: [
            { type: "damage", value: 5, target: "all_enemies" } // App logic handles repetition
        ],
        icon: "🌪️"
    } as CardData,

    // --- STATUS ---
    technical_debt: {
        id: "status_technical_debt",
        name: "Technical Debt",
        type: "status",
        cost: -1,
        unplayable: true,
        retain: true,
        description: "Unplayable. Retain. When drawn, lose 1 Bandwidth.",
        effects: [{ type: "lose_bandwidth", value: 1 }],
        icon: "🏚️"
    } as CardData,
  },
  enemies: {
    simple_bug: {
      id: "enemy_simple_bug",
      name: "Legacy Bug",
      hp: 42,
      maxHp: 42,
      emoji: "🐛",
      description: "A small issue in production.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0 },
      currentIntent: {
        type: 'attack',
        value: 6,
        icon: 'attack',
        description: "6 Burn"
      }
    } as EnemyData,
    legacy_code: {
      id: "enemy_legacy_code",
      name: "Legacy Code",
      hp: 56,
      maxHp: 56,
      emoji: "🦕",
      description: "Ancient code that grows more complex over time.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0 },
      currentIntent: {
        type: 'buff',
        value: 3,
        icon: 'buff',
        description: "Spaghetti Code"
      }
    } as EnemyData,
    scope_creep: {
      id: "enemy_scope_creep",
      name: "Scope Creep",
      hp: 90,
      maxHp: 90,
      emoji: "🐙", 
      description: "Elite: Grows stronger when you use Skills.",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0 },
      currentIntent: {
        type: 'attack',
        value: 10,
        icon: 'attack',
        description: "Feature Bloat"
      }
    } as EnemyData,
    boss_the_pivot: {
      id: "boss_the_pivot",
      name: "The Pivot",
      hp: 120,
      maxHp: 120,
      emoji: "🌪️",
      description: "Existential crisis. Can you survive the change?",
      statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0 },
      currentIntent: {
        type: 'attack',
        value: 12,
        icon: 'attack',
        description: "Market Shift"
      }
    } as EnemyData
  }
};