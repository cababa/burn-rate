
import { CardData, EnemyData, CharacterStats, RelicData, EncounterTemplate, EventData } from './types.ts';

export const MAX_HAND_SIZE = 10;

// Keyword glossary for verbose tooltips - explains all gameplay terms
export const KEYWORD_GLOSSARY: Record<string, { icon: string; color: string; description: string }> = {
    // Core mechanics
    Execute: { icon: "⚔️", color: "text-danger", description: "Deal damage to enemy Complexity" },
    Buffer: { icon: "🛡️", color: "text-info", description: "Temporary protection that blocks incoming damage" },
    Velocity: { icon: "💪", color: "text-warning", description: "Increases all Execute damage dealt" },
    Bandwidth: { icon: "⚡", color: "text-primary", description: "Energy to play cards each turn" },
    Runway: { icon: "💰", color: "text-primary", description: "Your health - reach $0 and you fail" },
    Complexity: { icon: "🎯", color: "text-danger", description: "Enemy health - reduce to 0 to defeat" },

    // Status effects (debuffs)
    Exposed: { icon: "🎯", color: "text-danger", description: "Takes 50% more Execute damage" },
    Drained: { icon: "😓", color: "text-purple-400", description: "Deals 25% less Execute damage" },
    Fragile: { icon: "🩹", color: "text-orange-400", description: "Gains 25% less Buffer" },

    // Card mechanics
    Archive: { icon: "📁", color: "text-gray-400", description: "Remove from deck for this combat only" },
    Fleeting: { icon: "👻", color: "text-blue-300", description: "If not played, Archives at end of turn" },
    Retain: { icon: "📌", color: "text-yellow-200", description: "Keep in hand instead of discarding" },
    Unplayable: { icon: "🚫", color: "text-gray-500", description: "Cannot be played, clogs your hand" },

    // Deck zones
    Backlog: { icon: "📚", color: "text-gray-300", description: "Your draw pile of undrawn cards" },

    // Power effects
    Momentum: { icon: "📊", color: "text-info", description: "Gain Velocity at the start of each turn" },
};

export const CARD_TYPE_CONFIG = {
    attack: {
        label: "Execution",
        icon: "⚔️",
        textColor: "text-danger",
        borderColor: "border-danger/50 hover:border-danger"
    },
    skill: {
        label: "Tactic",
        icon: "🛡️",
        textColor: "text-info",
        borderColor: "border-info/50 hover:border-info"
    },
    power: {
        label: "Strategy",
        icon: "⚡",
        textColor: "text-warning",
        borderColor: "border-warning/50 hover:border-warning"
    },
    status: {
        label: "Setback",
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
            hp: 75,
            maxHp: 75,
            bandwidth: 3,
            capital: 99,
            mitigation: 0,
            statuses: { vulnerable: 0, weak: 0, strength: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, frail: 0, growth: 0, corruption: 0 }
        } as CharacterStats
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
            icon: "📦",
            tooltip: {
                term: "Version Control",
                definition: "A system that records changes to a file or set of files over time so that you can recall specific versions later."
            }
        } as RelicData,

        // --- COMMON RELICS (8) ---
        sticky_note: {
            id: "relic_sticky_note",
            character: "shared",
            name: "Sticky Note",
            rarity: "common",
            trigger: "combat_start",
            effect: { type: "apply_vulnerable_all", value: 1 },
            description: "At the start of combat, apply 1 Exposed to ALL enemies.",
            icon: "📝",
            tooltip: { term: "Focus", definition: "A simple tool for keeping priorities clear." }
        } as RelicData,
        opening_move: {
            id: "relic_opening_move",
            character: "shared",
            name: "Opening Move",
            rarity: "common",
            trigger: "first_attack",
            effect: { type: "bonus_damage", value: 8 },
            description: "Your first attack each combat deals +8 Execution.",
            icon: "🎯",
            tooltip: { term: "First Mover", definition: "The advantage of being first to act." }
        } as RelicData,
        safety_net: {
            id: "relic_safety_net",
            character: "shared",
            name: "Safety Net",
            rarity: "common",
            trigger: "combat_start",
            effect: { type: "block", value: 10 },
            description: "Start each combat with 10 Buffer.",
            icon: "🛡️",
            tooltip: { term: "Preparation", definition: "Having backup plans ready." }
        } as RelicData,
        fresh_eyes: {
            id: "relic_fresh_eyes",
            character: "shared",
            name: "Fresh Eyes",
            rarity: "common",
            trigger: "passive",
            effect: { type: "strength", value: 1 },
            description: "Gain +1 Velocity.",
            icon: "👀",
            tooltip: { term: "Perspective", definition: "New viewpoints reveal hidden solutions." }
        } as RelicData,
        fresh_start: {
            id: "relic_fresh_start",
            character: "shared",
            name: "Fresh Start",
            rarity: "common",
            trigger: "first_turn",
            effect: { type: "gain_bandwidth", value: 1 },
            description: "Gain +1 Bandwidth on the first turn of combat.",
            icon: "⚡",
            tooltip: { term: "New Beginnings", definition: "Extra energy when starting fresh." }
        } as RelicData,
        fallback_position: {
            id: "relic_fallback_position",
            character: "shared",
            name: "Fallback Position",
            rarity: "common",
            trigger: "turn_end_conditional",
            effect: { type: "block_if_zero", value: 6 },
            description: "If you end your turn with 0 Buffer, gain 6.",
            icon: "🏠",
            tooltip: { term: "Safety", definition: "Automatic protection when exposed." }
        } as RelicData,
        thick_skin: {
            id: "relic_thick_skin",
            character: "shared",
            name: "Thick Skin",
            rarity: "common",
            trigger: "on_damaged",
            effect: { type: "thorns", value: 3 },
            description: "When you take Runway damage, deal 3 back to the attacker.",
            icon: "🦔",
            tooltip: { term: "Resilience", definition: "Pushing back against setbacks." }
        } as RelicData,
        smart_money: {
            id: "relic_smart_money",
            character: "shared",
            name: "Smart Money",
            rarity: "common",
            trigger: "on_card_reward",
            effect: { type: "bonus_capital", value: 8 },
            description: "Gain +$8k whenever you receive a card reward.",
            icon: "💰",
            tooltip: { term: "Investment", definition: "Those who believe in you multiply your gains." }
        } as RelicData,

        // --- UNCOMMON RELICS (6) ---
        momentum: {
            id: "relic_momentum",
            character: "shared",
            name: "Momentum",
            rarity: "uncommon",
            trigger: "on_attack_count",
            effect: { type: "strength_per_attacks", value: 1, threshold: 3 },
            description: "Every 3 attacks you play, gain +1 Velocity.",
            icon: "🚀",
            tooltip: { term: "Acceleration", definition: "Building speed compounds over time." }
        } as RelicData,
        quick_learner: {
            id: "relic_quick_learner",
            character: "shared",
            name: "Quick Learner",
            rarity: "uncommon",
            trigger: "on_attack_count",
            effect: { type: "dexterity_per_attacks", value: 1, threshold: 3 },
            description: "Every 3 attacks you play, gain +1 Dexterity (Buffer bonus).",
            icon: "📚",
            tooltip: { term: "Adaptation", definition: "Learning fast improves your defenses." }
        } as RelicData,
        second_wind: {
            id: "relic_second_wind",
            character: "shared",
            name: "Second Wind",
            rarity: "uncommon",
            trigger: "combat_end_conditional",
            effect: { type: "heal_if_low", value: 12, threshold: 50 },
            description: "If your Runway is ≤50% after combat, heal 12.",
            icon: "💨",
            tooltip: { term: "Recovery", definition: "The ability to bounce back from near-failure." }
        } as RelicData,
        force_multiplier: {
            id: "relic_force_multiplier",
            character: "shared",
            name: "Force Multiplier",
            rarity: "uncommon",
            trigger: "on_enemy_death",
            effect: { type: "energy_and_draw", value: 1 },
            description: "When an enemy dies, gain 1 Bandwidth and draw 1 card.",
            icon: "🤝",
            tooltip: { term: "Leverage", definition: "Victories snowball with the right approach." }
        } as RelicData,
        focus_mode: {
            id: "relic_focus_mode",
            character: "shared",
            name: "Focus Mode",
            rarity: "uncommon",
            trigger: "on_attack_count",
            effect: { type: "block_per_attacks", value: 4, threshold: 3 },
            description: "Every 3 attacks you play, gain 4 Buffer.",
            icon: "🎯",
            tooltip: { term: "Concentration", definition: "Focus creates protection." }
        } as RelicData,
        secret_weapon: {
            id: "relic_secret_weapon",
            character: "shared",
            name: "Secret Weapon",
            rarity: "uncommon",
            trigger: "combat_start",
            effect: { type: "start_with_card", value: 1 },
            description: "Choose a skill card. Start each combat with it in hand.",
            icon: "🃏",
            tooltip: { term: "Reliability", definition: "Your go-to tool, always ready." }
        } as RelicData,

        // --- BOSS RELICS (6) ---
        pivoting_power: {
            id: "relic_pivoting_power",
            character: "shared",
            name: "Pivoting Power",
            rarity: "boss",
            trigger: "passive",
            effect: { type: "snecko", draw_bonus: 2 },
            description: "Draw 2 extra cards per turn. Card costs are randomized (0-3).",
            icon: "🔀",
            tooltip: { term: "Chaos", definition: "Changing direction opens options but adds uncertainty." }
        } as RelicData,
        memory_bank: {
            id: "relic_memory_bank",
            character: "shared",
            name: "Memory Bank",
            rarity: "boss",
            trigger: "passive",
            effect: { type: "retain_hand" },
            description: "Cards are not discarded at the end of your turn.",
            icon: "🧠",
            tooltip: { term: "Retention", definition: "Saving resources for the right moment." }
        } as RelicData,
        rate_limiter: {
            id: "relic_rate_limiter",
            character: "shared",
            name: "Rate Limiter",
            rarity: "boss",
            trigger: "turn_start",
            effect: { type: "gain_bandwidth", value: 1, card_limit: 6 },
            description: "+1 Bandwidth per turn. You can only play 6 cards per turn.",
            icon: "⏱️",
            tooltip: { term: "Focus", definition: "Focus over frenzy - quality over quantity." }
        } as RelicData,
        cutting_corners: {
            id: "relic_cutting_corners",
            character: "shared",
            name: "Cutting Corners",
            rarity: "boss",
            trigger: "combat_start",
            effect: { type: "gain_bandwidth", value: 1, add_wounds: 2 },
            description: "+1 Bandwidth per turn. Add 2 Bug cards to your deck.",
            icon: "✂️",
            tooltip: { term: "Tradeoff", definition: "Short-term gains with long-term costs." }
        } as RelicData,
        no_rest_for_the_bold: {
            id: "relic_no_rest_for_bold",
            character: "shared",
            name: "No Rest for the Bold",
            rarity: "boss",
            trigger: "turn_start",
            effect: { type: "gain_bandwidth", value: 1, disable_rest: true },
            description: "+1 Bandwidth per turn. You cannot rest at Retrospective nodes.",
            icon: "🌙",
            tooltip: { term: "Hustle", definition: "The grind never stops for those who want to win." }
        } as RelicData,
        aggressive_growth: {
            id: "relic_aggressive_growth",
            character: "shared",
            name: "Aggressive Growth",
            rarity: "boss",
            trigger: "turn_start",
            effect: { type: "gain_bandwidth", value: 1, enemy_strength: 1 },
            description: "+1 Bandwidth per turn. Enemies start combat with +1 Velocity.",
            icon: "📈",
            tooltip: { term: "Risk", definition: "Moving fast, but facing tougher opposition." }
        } as RelicData,

        // --- EXISTING RARE (keep for compatibility) ---
        coffee_drip: {
            id: "relic_coffee_drip",
            character: "shared",
            name: "Coffee Drip",
            rarity: "rare",
            trigger: "turn_start",
            effect: { type: "gain_bandwidth", value: 1 },
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
            character: "cto",
            name: "Commit",
            type: "attack",
            rarity: "starter",
            cost: 1,
            description: "Execute 6.",
            effects: [{ type: "damage", value: 6, target: "enemy" }],
            icon: "🚀",
            keywords: [],
            tooltip: { term: "Commit", definition: "Shipping small code chunks. Not pretty, but progress." }
        } as CardData,
        cto_rollback: {
            id: "cto_rollback",
            character: "cto",
            name: "Rollback",
            type: "skill",
            rarity: "starter",
            cost: 1,
            description: "Gain 5 Buffer.",
            effects: [{ type: "block", value: 5, target: "self" }],
            icon: "⏪",
            keywords: [],
            tooltip: { term: "Rollback", definition: "Reverting to a stable state. Prevents the crash." }
        } as CardData,
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
                { type: "apply_status", value: 2, status: 'vulnerable', target: "enemy" }
            ],
            icon: "🔥",
            keywords: [],
            tooltip: { term: "Hotfix", definition: "A messy fix that works. Leaves the system exposed." }
        } as CardData,

        // --- COMMON ---
        cto_quick_fix: { // Anger
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
            icon: "🩹",
            keywords: [],
            tooltip: { term: "Quick Fix", definition: "A temporary solution that gets the job done but might need revisiting." }
        } as CardData,
        cto_brute_force: { // Heavy Blade
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
            icon: "🔨",
            keywords: [],
            tooltip: { term: "Brute Force", definition: "Solving a problem through raw computational power or effort, ignoring elegance." }
        } as CardData,
        cto_sprint_planning: { // Pommel Strike
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
            icon: "📅",
            keywords: [],
            tooltip: { term: "Sprint Planning", definition: "Setting goals for the next iteration. Clears the path for execution." }
        } as CardData,
        cto_risk_mitigation: { // Clothesline
            id: "cto_risk_mitigation",
            character: "cto",
            name: "Risk Mitigation",
            type: "attack",
            rarity: "common",
            cost: 2,
            description: "Execute 12. Apply 2 Drained.",
            effects: [
                { type: "damage", value: 12, target: "enemy" },
                { type: "apply_status", value: 2, status: 'weak', target: "enemy" }
            ],
            icon: "👔",
            keywords: [],
            tooltip: { term: "Risk Mitigation", definition: "Strategies to reduce the impact of potential threats." }
        } as CardData,
        cto_refactor: { // True Grit
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
            icon: "♻️",
            keywords: [],
            tooltip: { term: "Refactor", definition: "Restructuring code without changing its external behavior. Improves maintainability." }
        } as CardData,
        cto_ship_it: { // Clash
            id: "cto_ship_it",
            character: "cto",
            name: "Ship It!",
            type: "attack",
            rarity: "common",
            cost: 0,
            description: "Can only be played if every card in your hand is an Attack. Execute 14.",
            playCondition: 'only_attacks_in_hand',
            effects: [
                { type: "damage", value: 14, target: "enemy" }
            ],
            icon: "🚢",
            keywords: [],
            tooltip: { term: "Ship It!", definition: "Deploying to production. The ultimate goal of the sprint." }
        } as CardData,
        cto_tooling: { // Armaments
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
            icon: "🛠️",
            keywords: [],
            tooltip: { term: "Tooling", definition: "Investing in developer experience and infrastructure. Makes everything better." }
        } as CardData,
        cto_leverage: { // Body Slam
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
            icon: "🏗️",
            keywords: [],
            tooltip: { term: "Leverage", definition: "Using existing assets to achieve outsized results." }
        } as CardData,
        cto_batch_deploy: { // Cleave
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
            icon: "📦",
            keywords: [],
            tooltip: { term: "Batch Deploy", definition: "Releasing multiple changes at once. Efficient but risky." }
        } as CardData,
        cto_cherry_pick: { // Headbutt
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
            icon: "🍒",
            keywords: [],
            tooltip: { term: "Cherry Pick", definition: "Selecting specific commits to apply to another branch." }
        } as CardData,
        cto_dual_track: { // Iron Wave
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
            icon: "🛤️",
            keywords: [],
            tooltip: { term: "Dual Track", definition: "Discovery and Delivery happening in parallel." }
        } as CardData,
        cto_compounding_commits: { // Perfected Strike
            id: "cto_compounding_commits",
            character: "cto",
            name: "Compounding",
            type: "attack",
            rarity: "common",
            cost: 2,
            description: "Execute 6. Deals +2 for every 'Commit' in your deck.",
            effects: [
                { type: "damage_scale_matches", value: 6, matchString: 'Commit', target: "enemy" }
            ],
            icon: "📚",
            keywords: [],
            tooltip: { term: "Compounding", definition: "Small improvements adding up to massive value over time." }
        } as CardData,
        cto_yolo_deploy: { // Reckless Charge
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
            icon: "🤠",
            keywords: [],
            tooltip: { term: "YOLO Deploy", definition: "Deploying on Friday at 5pm without tests. What could go wrong?" }
        } as CardData,
        cto_shotgun_debug: { // Sword Boomerang
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
            icon: "🔫",
            keywords: [],
            tooltip: { term: "Shotgun Debugging", definition: "Changing random things until it works. Not recommended." }
        } as CardData,
        cto_pair_programming: { // Twin Strike
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
            icon: "👥",
            keywords: [],
            tooltip: { term: "Pair Programming", definition: "Two developers, one keyboard. Higher quality, shared context." }
        } as CardData,
        cto_tech_shortcut: { // Wild Strike
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
            icon: "✂️",
            keywords: [],
            tooltip: { term: "Technical Shortcut", definition: "Quick solution that creates debt. Fast now, painful later." }
        } as CardData,

        // --- UNCOMMON ---
        cto_root_cause: { // Uppercut
            id: "cto_root_cause",
            character: "cto",
            name: "Root Cause",
            type: "attack",
            rarity: "uncommon",
            cost: 2,
            description: "Execute 13. Apply 1 Drained and 1 Exposed.",
            effects: [
                { type: "damage", value: 13, target: "enemy" },
                { type: "apply_status", value: 1, status: 'weak', target: "enemy" },
                { type: "apply_status", value: 1, status: 'vulnerable', target: "enemy" }
            ],
            icon: "🔍",
            keywords: [],
            tooltip: { term: "Root Cause Analysis", definition: "Finding the fundamental reason for a problem to prevent recurrence." }
        } as CardData,
        cto_troubleshooting: { // Evolve
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
            icon: "💡",
            keywords: [],
            tooltip: { term: "Troubleshooting", definition: "Systematic search for the source of a problem." }
        } as CardData,
        cto_lean_ops: { // Feel No Pain
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
            icon: "🧘",
            keywords: [],
            tooltip: { term: "Lean Operations", definition: "Maximizing value while minimizing waste." }
        } as CardData,
        cto_caching: { // Metallicize
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
            icon: "💾",
            keywords: [],
            tooltip: { term: "Caching", definition: "Storing data in a temporary storage area for faster access." }
        } as CardData,
        cto_code_review: { // Inflame
            id: "cto_code_review",
            character: "cto",
            name: "Code Review",
            type: "power",
            rarity: "uncommon",
            cost: 1,
            description: "Gain 2 Velocity.",
            effects: [{ type: "apply_status", value: 2, status: 'strength', target: "self" }],
            icon: "👓",
            keywords: [],
            tooltip: { term: "Code Review", definition: "Systematic examination of computer source code." }
        } as CardData,
        cto_resource_allocation: { // Spot Weakness
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
            icon: "🎯",
            keywords: [],
            tooltip: { term: "Resource Allocation", definition: "Assigning available resources to the most critical tasks." }
        } as CardData,
        cto_flow_state: { // Battle Trance
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
            icon: "🌊",
            keywords: [],
            tooltip: { term: "Flow State", definition: "A mental state of complete immersion and focus." }
        } as CardData,
        cto_market_window: { // Carnage
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
            icon: "⏱️",
            keywords: ["fleeting"],
            tooltip: { term: "Market Window", definition: "A limited time opportunity to launch a product." }
        } as CardData,
        cto_talent_poach: { // Disarm
            id: "cto_talent_poach",
            character: "cto",
            name: "Talent Poach",
            type: "skill",
            rarity: "uncommon",
            cost: 1,
            exhaust: true,
            description: "Enemy loses 2 Velocity. Archive.",
            effects: [
                { type: "apply_status", value: -2, status: 'strength', target: "enemy" }
            ],
            icon: "🎣",
            keywords: ["exhaust"],
            tooltip: { term: "Talent Poaching", definition: "Hiring key employees from competitors to weaken them." }
        } as CardData,
        cto_viral_loop: { // Dropkick
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
            icon: "➰",
            keywords: [],
            tooltip: { term: "Viral Loop", definition: "A mechanism that encourages users to invite others, creating exponential growth." }
        } as CardData,
        cto_firewall: { // Flame Barrier
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
            icon: "🔥🧱",
            keywords: [],
            tooltip: { term: "Firewall", definition: "A network security system that monitors and controls incoming and outgoing traffic." }
        } as CardData,
        cto_hackathon: { // Pummel
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
            icon: "🍕",
            keywords: ["exhaust"],
            tooltip: { term: "Hackathon", definition: "An event where people engage in rapid collaborative engineering." }
        } as CardData,
        cto_antifragile: { // Rupture
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
            icon: "💪",
            keywords: [],
            tooltip: { term: "Antifragile", definition: "Systems that benefit from shocks, volatility, and stress." }
        } as CardData,
        cto_network_effects: { // Demon Form
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
            icon: "🕸️",
            keywords: [],
            tooltip: { term: "Network Effects", definition: "Expensive to build, but once running, your execution compounds infinitely." }
        } as CardData,
        cto_tech_debt: { // Corruption
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
            icon: "💳",
            keywords: [],
            tooltip: { term: "Tech Debt", definition: "Move incredibly fast now, but you're burning infrastructure. Win before you run out." }
        } as CardData,
        cto_bridge_round: { // Seeing Red
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
            icon: "🌉",
            keywords: ["exhaust"],
            tooltip: { term: "Bridge Round", definition: "Short-term funding to keep the company afloat until the next major round." }
        } as CardData,
        cto_market_disruption: { // Shockwave
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
            icon: "💥",
            keywords: ["exhaust"],
            tooltip: { term: "Market Disruption", definition: "A new market innovation that displaces established market-leading firms." }
        } as CardData,
        cto_blitzscaling: { // Whirlwind
            id: "cto_blitzscaling",
            character: "cto",
            name: "Blitzscaling",
            type: "attack",
            rarity: "uncommon",
            cost: -1, // X Cost
            description: "Execute 5 to ALL enemies X times.",
            effects: [
                { type: "damage", value: 5, target: "all_enemies" }
            ],
            icon: "🌪️",
            keywords: [],
            tooltip: { term: "Blitzscaling", definition: "Prioritizing speed over efficiency in an environment of uncertainty." }
        } as CardData,

        // --- STATUS ---
        status_legacy_code: { // Wound
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
            icon: "🏚️",
            keywords: ["retain", "unplayable"],
            tooltip: { term: "Legacy Code", definition: "Code inherited from someone else or an older version of the software." }
        } as CardData,
        status_bug: { // Dazed
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
            icon: "🐛",
            keywords: ["fleeting", "unplayable"],
            tooltip: { term: "Software Bug", definition: "An error, flaw or fault in a computer program or system." }
        } as CardData,
        status_burnout: { // Burn
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
            icon: "🔥",
            keywords: ["unplayable"],
            tooltip: { term: "Burnout", definition: "State of emotional, physical, and mental exhaustion caused by excessive and prolonged stress." }
        } as CardData,
        status_scope_creep: { // Slimed
            id: "status_scope_creep",
            character: "status",
            name: "Scope Creep",
            type: "status",
            rarity: "special",
            cost: 1,
            exhaust: true,
            description: "Archive.",
            effects: [],
            icon: "🐙",
            keywords: ["exhaust"],
            tooltip: { term: "Scope Creep", definition: "Uncontrolled changes or continuous growth in a project's scope." }
        } as CardData,
        status_context_switch: { // Void
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
            icon: "🔀",
            keywords: ["fleeting", "unplayable", "exhaust"],
            tooltip: { term: "Context Switching", definition: "Storing and restoring the state of a process so that execution can be resumed from the same point later." }
        } as CardData,
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
            icon: "🐛",
            keywords: ["fleeting"],
            tooltip: { term: "Bug", definition: "A minor issue. Unplayable. Fades away at end of turn." }
        } as CardData
    },
    enemies: {
        // --- COMMON ---
        fanboy: { // Cultist
            id: "fanboy",
            name: "Feature Creep",
            act: 1,
            type: "normal",
            hp: 50, // 48-54
            maxHp: 50,
            mitigation: 0,
            emoji: "📦",
            description: "Starts small. Grows uncontrollably if you don't execute fast.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'buff',
                value: 3,
                icon: 'buff',
                description: "Add Feature"
            },
            rewards: {
                capital: { min: 10, max: 15 },
                card_reward: true
            }
        } as EnemyData,
        spaghetti_code: { // Jaw Worm
            id: "spaghetti_code",
            name: "The Copycat",
            act: 1,
            type: "normal",
            hp: 42, // 40-44
            maxHp: 42,
            mitigation: 0,
            emoji: "🦜",
            description: "Imitates your moves. Bites back.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'attack',
                value: 11,
                icon: 'attack',
                description: "Mimic"
            },
            rewards: {
                capital: { min: 12, max: 18 },
                card_reward: true
            }
        } as EnemyData,
        critical_bug: { // Louse Red
            id: "critical_bug",
            name: "The Doubter",
            act: 1,
            type: "normal",
            hp: 13, // 10-15
            maxHp: 13,
            mitigation: 0,
            emoji: "🤨",
            description: "Questions everything. Doubt compounds.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 5, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'buff',
                value: 3,
                icon: 'buff',
                description: "Raise Doubt"
            },
            rewards: {
                capital: { min: 5, max: 10 },
                card_reward: true
            }
        } as EnemyData,
        minor_bug: { // Louse Green
            id: "minor_bug",
            name: "The Naysayer",
            act: 1,
            type: "normal",
            hp: 13, // 10-15
            maxHp: 13,
            mitigation: 0,
            emoji: "👎",
            description: "Says 'it won't work.' Slows you down.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 5, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 2,
                icon: 'debuff',
                description: "Discourage"
            },
            rewards: {
                capital: { min: 5, max: 10 },
                card_reward: true
            }
        } as EnemyData,
        quick_hack: { // Acid Slime S
            id: "quick_hack",
            name: "The Shortcut Taker",
            act: 1,
            type: "normal",
            hp: 10, // 8-12
            maxHp: 10,
            mitigation: 0,
            emoji: "✂️",
            description: "Cuts corners. Weakens foundations.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 1,
                icon: 'debuff',
                description: "Cut Corners"
            },
            rewards: {
                capital: { min: 3, max: 7 },
                card_reward: false
            }
        } as EnemyData,
        tech_debt: { // Acid Slime M
            id: "tech_debt",
            name: "The Procrastinator",
            act: 1,
            type: "normal",
            hp: 30, // 28-32
            maxHp: 30,
            mitigation: 0,
            emoji: "😴",
            description: "Avoids responsibility. Creates baggage.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 1,
                icon: 'debuff',
                description: "Delay"
            },
            rewards: {
                capital: { min: 8, max: 12 },
                card_reward: true
            }
        } as EnemyData,
        legacy_module: { // Acid Slime L
            id: "legacy_module",
            name: "The Old Guard",
            act: 1,
            type: "normal",
            hp: 67, // 65-69
            maxHp: 67,
            mitigation: 0,
            emoji: "👴",
            description: "Stuck in old ways. Splits into cronies.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 2,
                icon: 'debuff',
                description: "Resist Change"
            },
            rewards: {
                capital: { min: 15, max: 20 },
                card_reward: true
            }
        } as EnemyData,
        hotfix: { // Spike Slime S
            id: "hotfix",
            name: "The Gambler",
            act: 1,
            type: "normal",
            hp: 12, // 10-14
            maxHp: 12,
            mitigation: 0,
            emoji: "🎲",
            description: "Takes risky bets. Might hurt you.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'attack',
                value: 5,
                icon: 'attack',
                description: "Roll Dice"
            },
            rewards: {
                capital: { min: 3, max: 7 },
                card_reward: false
            }
        } as EnemyData,
        bad_merge: { // Spike Slime M
            id: "bad_merge",
            name: "The Gossip",
            act: 1,
            type: "normal",
            hp: 30, // 28-32
            maxHp: 30,
            mitigation: 0,
            emoji: "🗣️",
            description: "Spreads rumors. Hurts morale.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 1,
                icon: 'debuff',
                description: "Spread Rumors"
            },
            rewards: {
                capital: { min: 8, max: 12 },
                card_reward: true
            }
        } as EnemyData,
        merge_conflict: { // Spike Slime L
            id: "merge_conflict",
            name: "The Politician",
            act: 1,
            type: "normal",
            hp: 67, // 64-70
            maxHp: 67,
            mitigation: 0,
            emoji: "🎭",
            description: "Plays both sides. Causes division.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 2,
                icon: 'debuff',
                description: "Play Politics"
            },
            rewards: {
                capital: { min: 15, max: 20 },
                card_reward: true
            }
        } as EnemyData,
        micromanager: { // Blue Slaver
            id: "micromanager",
            name: "The Micromanager",
            act: 1,
            type: "normal",
            hp: 48, // 46-50
            maxHp: 48,
            mitigation: 0,
            emoji: "👔",
            description: "Nitpicks every detail. Stabs you with tasks.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'attack',
                value: 12,
                icon: 'attack',
                description: "Nitpick"
            },
            rewards: {
                capital: { min: 12, max: 18 },
                card_reward: true
            }
        } as EnemyData,
        feature_pusher: { // Red Slaver
            id: "feature_pusher",
            name: "The Dreamer",
            act: 1,
            type: "normal",
            hp: 48, // 46-50
            maxHp: 48,
            mitigation: 0,
            emoji: "💭",
            description: "Always wants more. Never satisfied.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'attack',
                value: 13,
                icon: 'attack',
                description: "Demand More"
            },
            rewards: {
                capital: { min: 12, max: 18 },
                card_reward: true
            }
        } as EnemyData,
        headhunter: { // Looter
            id: "headhunter",
            name: "The Poacher",
            act: 1,
            type: "normal",
            hp: 46, // 44-48
            maxHp: 46,
            mitigation: 0,
            emoji: "🦊",
            description: "Tries to steal your best people.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'attack',
                value: 10,
                icon: 'attack',
                description: "Steal Talent"
            },
            rewards: {
                capital: { min: 15, max: 25 },
                card_reward: true
            }
        } as EnemyData,
        memory_leak: { // Fungi Beast
            id: "memory_leak",
            name: "The Energy Vampire",
            act: 1,
            type: "normal",
            hp: 25, // 22-28
            maxHp: 25,
            mitigation: 0,
            emoji: "🧛",
            description: "Drains your resources over time.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'buff',
                value: 3,
                icon: 'buff',
                description: "Drain"
            },
            rewards: {
                capital: { min: 8, max: 12 },
                card_reward: true
            }
        } as EnemyData,

        // --- ELITES ---
        scope_creep: { // Gremlin Nob
            id: "scope_creep",
            name: "The Scope Creep",
            act: 1,
            type: "elite",
            hp: 76,
            maxHp: 76,
            mitigation: 0,
            emoji: "🐙",
            description: "Elite: Arms reach for more. Grows stronger when you defend.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'buff',
                value: 1,
                icon: 'buff',
                description: "Expand Scope"
            },
            rewards: {
                capital: { min: 25, max: 35 },
                card_reward: true
            }
        } as EnemyData,
        over_engineer: { // Lagavulin
            id: "over_engineer",
            name: "The Deadline",
            act: 1,
            type: "elite",
            hp: 110, // 109-111
            maxHp: 110,
            mitigation: 0,
            emoji: "⏰",
            description: "Sits dormant. When it wakes, it hits your Runway hard.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 8, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 1, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 1,
                icon: 'debuff',
                description: "Approach"
            },
            rewards: {
                capital: { min: 25, max: 35 },
                card_reward: true
            }
        } as EnemyData,
        legacy_monolith: { // Sentry 1
            id: "legacy_monolith",
            name: "The Gatekeeper",
            act: 1,
            type: "elite",
            hp: 42, // 38-42
            maxHp: 42,
            mitigation: 0,
            emoji: "🚪",
            description: "Blocks progress. Protected by red tape.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 2,
                icon: 'debuff',
                description: "Reject"
            },
            rewards: {
                capital: { min: 10, max: 15 },
                card_reward: true
            }
        } as EnemyData,
        legacy_hack: { // Sentry 2
            id: "legacy_hack",
            name: "The Critic",
            act: 1,
            type: "elite",
            hp: 42,
            maxHp: 42,
            mitigation: 0,
            emoji: "📝",
            description: "Attacks every idea.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'attack',
                value: 9,
                icon: 'attack',
                description: "Criticize"
            },
            rewards: {
                capital: { min: 10, max: 15 },
                card_reward: false
            }
        } as EnemyData,
        legacy_patch: { // Sentry 3
            id: "legacy_patch",
            name: "The Bureaucrat",
            act: 1,
            type: "elite",
            hp: 42,
            maxHp: 42,
            mitigation: 0,
            emoji: "📋",
            description: "Creates paperwork. Adds obstacles.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 2,
                icon: 'debuff',
                description: "File Report"
            },
            rewards: {
                capital: { min: 10, max: 15 },
                card_reward: false
            }
        } as EnemyData,

        // --- BOSSES ---
        boss_the_pivot: { // The Guardian
            id: "boss_the_pivot",
            name: "The Pivot",
            act: 1,
            type: "boss",
            hp: 240,
            maxHp: 240,
            mitigation: 0,
            emoji: "🔄",
            description: "Existential crisis. Can you survive the change?",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'buff',
                value: 9,
                icon: 'buff',
                description: "Charging Up"
            },
            rewards: {
                capital: { min: 100, max: 100 },
                card_reward: true
            }
        } as EnemyData,
        boss_burn_rate: { // Hexaghost
            id: "boss_burn_rate",
            name: "The Burn Rate",
            act: 1,
            type: "boss",
            hp: 250,
            maxHp: 250,
            mitigation: 0,
            emoji: "🔥",
            description: "Dwindling cash. Damage scales with your Runway.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'attack',
                value: 0, // Scales with HP
                icon: 'attack',
                description: "Divider"
            },
            rewards: {
                capital: { min: 100, max: 100 },
                card_reward: true
            }
        } as EnemyData,
        boss_the_monolith: { // Slime Boss
            id: "boss_the_monolith",
            name: "The Goliath",
            act: 1,
            type: "boss",
            hp: 140, // Splits at 50% (70)
            maxHp: 140,
            mitigation: 0,
            emoji: "🏆",
            description: "The big competitor. Splits into smaller rivals.",
            statuses: { vulnerable: 0, strength: 0, growth: 0, weak: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0, artifact: 0, curlUp: 0, malleable: 0, asleep: 0, frail: 0 },
            currentIntent: {
                type: 'debuff',
                value: 3,
                icon: 'debuff',
                description: "Crush"
            },
            rewards: {
                capital: { min: 100, max: 100 },
                card_reward: true
            }
        } as EnemyData
    }
};

// Status effect icons and labels for startup theme
export const STATUS_CONFIG = {
    vulnerable: { icon: "🎯", label: "Exposed", description: "Takes 50% more Execution" },
    weak: { icon: "😓", label: "Drained", description: "Deals 25% less Execution" },
    strength: { icon: "💪", label: "Velocity", descPositive: "+{0} to all Execution", descNegative: "{0} to all Execution" },
    frail: { icon: "🩹", label: "Fragile", description: "Buffer reduced by 25%" },
    metallicize: { icon: "🛡️", label: "Auto-Buffer", description: "Gain {0} Buffer at end of turn" },
    thorns: { icon: "⚡", label: "Counterattack", description: "Execute {0} when hit" },
    artifact: { icon: "💎", label: "Buffer", description: "Negates next {0} debuff(s)" },
    evolve: { icon: "📖", label: "Troubleshoot", description: "Draw {0} card(s) when drawing Status cards" },
    feelNoPain: { icon: "🧘", label: "Lean Ops", description: "Gain {0} Buffer when a card is Archived" },
    noDraw: { icon: "🚫", label: "Flow State Lock", description: "Cannot draw cards this turn" },
    antifragile: { icon: "📈", label: "Antifragile", description: "Gain +{0} Velocity when losing Runway from cards" },
    growth: { icon: "📊", label: "Momentum", description: "Gains +{0} Velocity each turn" },
    curlUp: { icon: "🥚", label: "Defensive", description: "Gains {0} Buffer when first attacked" },
    malleable: { icon: "🍃", label: "Adaptive", description: "Gains {0}+ Buffer when attacked" },
    asleep: { icon: "😴", label: "Dormant", description: "Inactive until damaged" },
};

// Intent icons for enemy actions
export const INTENT_ICONS = {
    attack: { icon: "⚔️", label: "Execution", color: "danger" },
    buff: { icon: "⬆️", label: "Empower", color: "warning" },
    debuff: { icon: "⬇️", label: "Sabotage", color: "purple-400" },
    defend: { icon: "🛡️", label: "Fortify", color: "info" },
    unknown: { icon: "❓", label: "Planning", color: "gray-400" },
};

// Status card icons  
export const STATUS_CARD_ICONS = {
    bug: "🐛",
    burnout: "🔥",
    legacy_code: "🏚️",
    scope_creep: "🐙",
    context_switch: "🔀",
};

// Act 1 Encounter Templates
export const ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
    // Easy Pool (Floors 1-2) - "Day 1 Problems"
    { id: 'solo_fanboy', name: 'The Hype Man', enemies: [{ enemyId: 'fanboy', count: [1, 1] }], weight: 10, pool: 'easy' },
    { id: 'solo_spaghetti', name: 'The Copycat', enemies: [{ enemyId: 'spaghetti_code', count: [1, 1] }], weight: 10, pool: 'easy' },
    { id: 'bug_duo', name: 'The Naysayers', enemies: [{ enemyId: 'minor_bug', count: [2, 2] }], weight: 8, pool: 'easy' },
    { id: 'bug_trio', name: 'Crisis of Confidence', enemies: [{ enemyId: 'critical_bug', count: [1, 1] }, { enemyId: 'minor_bug', count: [1, 2] }], weight: 8, pool: 'easy' },
    { id: 'quick_patches', name: 'Corner Cutters', enemies: [{ enemyId: 'quick_hack', count: [2, 2] }], weight: 6, pool: 'easy' },

    // Hard Pool (Floors 3-13) - "Growth Pains"
    { id: 'tech_debt_solo', name: 'The Procrastinator', enemies: [{ enemyId: 'tech_debt', count: [1, 1] }], weight: 8, pool: 'hard' },
    { id: 'merge_hell', name: 'Office Politics', enemies: [{ enemyId: 'bad_merge', count: [1, 1] }, { enemyId: 'tech_debt', count: [1, 1] }], weight: 6, pool: 'hard' },
    { id: 'stakeholder_sync', name: 'Management Meeting', enemies: [{ enemyId: 'micromanager', count: [1, 1] }, { enemyId: 'feature_pusher', count: [1, 1] }], weight: 6, pool: 'hard' },
    { id: 'dependency', name: 'The Old Guard', enemies: [{ enemyId: 'legacy_module', count: [1, 1] }], weight: 5, pool: 'hard' },
    { id: 'talent_war', name: 'Poacher Attack', enemies: [{ enemyId: 'headhunter', count: [1, 1] }], weight: 7, pool: 'hard' },
    { id: 'memory_leak', name: 'Energy Vampires', enemies: [{ enemyId: 'memory_leak', count: [1, 1] }, { enemyId: 'quick_hack', count: [1, 2] }], weight: 5, pool: 'hard' },
    { id: 'infestation', name: 'Mob of Doubters', enemies: [{ enemyId: 'minor_bug', count: [3, 4] }], weight: 4, pool: 'hard' },
];

// Act 1 Events - "The Incubator"
export const ACT1_EVENTS: EventData[] = [
    {
        id: 'angel_investor',
        name: 'The Angel Investor',
        description: 'A wealthy individual offers to fund your MVP. They seem eager, but the terms might not be ideal...',
        choices: [
            {
                id: 'accept',
                label: 'Accept Terms',
                description: 'Gain $150 Capital, add 1 "Burnout" curse to deck',
                effects: [
                    { type: 'gain_gold', value: 150 },
                    { type: 'add_status_card', statusId: 'status_burnout' }
                ]
            },
            {
                id: 'negotiate',
                label: 'Negotiate',
                description: '50% chance: Gain $200 OR they walk away',
                effects: [
                    {
                        type: 'random_chance',
                        chance: 50,
                        successEffects: [{ type: 'gain_gold', value: 200 }],
                        failureEffects: [{ type: 'nothing' }]
                    }
                ]
            },
            {
                id: 'decline',
                label: 'Decline',
                description: 'Walk away with nothing',
                effects: [{ type: 'nothing' }]
            }
        ]
    },
    {
        id: 'demo_day',
        name: 'The Demo Day',
        description: 'Present your pitch to a room full of investors. How will you approach this?',
        choices: [
            {
                id: 'wing_it',
                label: 'Wing It',
                description: '50% chance: Gain rare card OR lose $50 Capital',
                effects: [
                    {
                        type: 'random_chance',
                        chance: 50,
                        successEffects: [{ type: 'gain_card', cardRarity: 'rare' }],
                        failureEffects: [{ type: 'lose_gold', value: 50 }]
                    }
                ]
            },
            {
                id: 'prepare',
                label: 'Prepare',
                description: 'Archive 1 card, gain 1 uncommon card',
                effects: [
                    { type: 'exhaust_card', value: 1 },
                    { type: 'gain_card', cardRarity: 'uncommon' }
                ]
            },
            {
                id: 'skip',
                label: 'Skip',
                description: 'Not worth the stress',
                effects: [{ type: 'nothing' }]
            }
        ]
    },
    {
        id: 'hackathon',
        name: 'The Hackathon',
        description: 'A 48-hour coding marathon at your coworking space. Pizza and Red Bull everywhere...',
        choices: [
            {
                id: 'participate',
                label: 'Go All In',
                description: 'Lose 15% max Runway, upgrade 2 cards',
                effects: [
                    { type: 'lose_max_hp', value: 15 },
                    { type: 'upgrade_card', value: 2 }
                ]
            },
            {
                id: 'network',
                label: 'Network Only',
                description: 'Gain $50 Capital',
                effects: [{ type: 'gain_gold', value: 50 }]
            },
            {
                id: 'rest',
                label: 'Rest Instead',
                description: 'Heal 10 Runway',
                effects: [{ type: 'gain_hp', value: 10 }]
            }
        ]
    },
    {
        id: 'yc_interview',
        name: 'The Y Combinator Interview',
        description: 'You got an interview slot with the top accelerator. This could change everything...',
        choices: [
            {
                id: 'nail_it',
                label: 'Nail It',
                description: 'Requires 3+ upgraded cards: Gain rare relic',
                condition: { type: 'upgraded_cards', operator: '>=', value: 3 },
                effects: [{ type: 'gain_relic' }]
            },
            {
                id: 'bomb_it',
                label: 'Bomb It',
                description: 'Gain "Imposter Syndrome" status card',
                effects: [{ type: 'add_status_card', statusId: 'status_context_switch' }]
            },
            {
                id: 'skip',
                label: 'Not Ready Yet',
                description: 'Walk away',
                effects: [{ type: 'nothing' }]
            }
        ]
    },
    {
        id: 'cofounder_dispute',
        name: 'The Cofounder Dispute',
        description: 'Your cofounder wants to take the product in a different direction. Tensions are high...',
        choices: [
            {
                id: 'agree',
                label: 'Agree With Them',
                description: 'Remove 2 cards from deck',
                effects: [{ type: 'remove_card', value: 2 }]
            },
            {
                id: 'assert',
                label: 'Assert Dominance',
                description: 'Gain 2 Velocity, lose $100',
                effects: [
                    { type: 'gain_strength', value: 2 },
                    { type: 'lose_gold', value: 100 }
                ]
            },
            {
                id: 'compromise',
                label: 'Compromise',
                description: 'Gain 1 random card',
                effects: [{ type: 'gain_card', cardRarity: 'random' }]
            }
        ]
    },
    {
        id: 'pivot_moment',
        name: 'The Pivot Moment',
        description: 'User feedback suggests you might be building the wrong thing. Time to decide...',
        choices: [
            {
                id: 'full_pivot',
                label: 'Full Pivot',
                description: 'Transform 3 random cards into different cards',
                effects: [{ type: 'transform_card', value: 3 }]
            },
            {
                id: 'iterate',
                label: 'Minor Iteration',
                description: 'Upgrade 1 card',
                effects: [{ type: 'upgrade_card', value: 1 }]
            },
            {
                id: 'stay_course',
                label: 'Stay The Course',
                description: 'Gain "Technical Debt" status card',
                effects: [{ type: 'add_status_card', statusId: 'status_legacy_code' }]
            }
        ]
    },
    {
        id: 'talent_poach',
        name: 'The Talent Poach',
        description: 'A FAANG recruiter is calling your best engineer. Their offer is tempting...',
        choices: [
            {
                id: 'match',
                label: 'Match Offer',
                description: 'Pay $100, nothing else happens',
                condition: { type: 'gold', operator: '>=', value: 100 },
                effects: [{ type: 'lose_gold', value: 100 }]
            },
            {
                id: 'let_go',
                label: 'Let Them Go',
                description: 'Lose 1 random card from deck',
                effects: [{ type: 'remove_card', value: 1 }]
            },
            {
                id: 'counter_poach',
                label: 'Counter-Poach',
                description: 'Pay $150, gain rare card',
                condition: { type: 'gold', operator: '>=', value: 150 },
                effects: [
                    { type: 'lose_gold', value: 150 },
                    { type: 'gain_card', cardRarity: 'rare' }
                ]
            }
        ]
    },
    {
        id: 'viral_tweet',
        name: 'The Viral Tweet',
        description: 'Your product demo just went viral on Twitter. Your mentions are exploding...',
        choices: [
            {
                id: 'ride_wave',
                label: 'Ride The Wave',
                description: 'Fight elite encounter, guaranteed relic',
                effects: [{ type: 'fight_elite' }]
            },
            {
                id: 'manage',
                label: 'Manage Expectations',
                description: 'Gain $75 Capital',
                effects: [{ type: 'gain_gold', value: 75 }]
            },
            {
                id: 'ignore',
                label: 'Ignore It',
                description: 'Heal 15 Runway',
                effects: [{ type: 'gain_hp', value: 15 }]
            }
        ]
    },
    {
        id: 'office_space',
        name: 'The Office Space',
        description: 'You found a cheap office but it\'s in a sketchy area. The commute would be brutal...',
        choices: [
            {
                id: 'move_in',
                label: 'Move In',
                description: 'Lose 10 Runway, gain $100 Capital',
                effects: [
                    { type: 'lose_hp', value: 10 },
                    { type: 'gain_gold', value: 100 }
                ]
            },
            {
                id: 'wework',
                label: 'WeWork It',
                description: 'Pay $75, nothing special',
                condition: { type: 'gold', operator: '>=', value: 75 },
                effects: [{ type: 'lose_gold', value: 75 }]
            },
            {
                id: 'remote',
                label: 'Stay Remote',
                description: 'Gain "Context Switch" status card',
                effects: [{ type: 'add_status_card', statusId: 'status_context_switch' }]
            }
        ]
    },
    {
        id: 'product_hunt',
        name: 'The Product Hunt Launch',
        description: 'Today\'s the day you launch on Product Hunt. The whole team is watching the rankings...',
        choices: [
            {
                id: 'all_hands',
                label: 'All Hands On Deck',
                description: 'Archive 2 cards, gain 2 rare cards',
                effects: [
                    { type: 'exhaust_card', value: 2 },
                    { type: 'gain_card', cardRarity: 'rare' },
                    { type: 'gain_card', cardRarity: 'rare' }
                ]
            },
            {
                id: 'soft_launch',
                label: 'Soft Launch',
                description: 'Gain 1 uncommon card',
                effects: [{ type: 'gain_card', cardRarity: 'uncommon' }]
            },
            {
                id: 'delay',
                label: 'Delay Launch',
                description: 'We\'re not ready yet',
                effects: [{ type: 'nothing' }]
            }
        ]
    }
];

// Map Generation Constants
export const MAP_CONFIG = {
    FLOORS: 15,
    COLUMNS: 7,
    NUM_PATHS: 6,

    // Node type probabilities (floor 3-13)
    NODE_PROBABILITIES: {
        problem: 45,      // Monster
        elite: 8,         // Elite (floor 6+ only)
        retrospective: 12, // Rest site
        vendor: 5,        // Shop
        opportunity: 22,  // Unknown (?)
        treasure: 8       // Only at floor 8
    },

    // Opportunity node distribution
    OPPORTUNITY_DISTRIBUTION: {
        vendor: 25,   // Becomes shop
        problem: 25,  // Becomes monster
        event: 50     // Actual event
    },

    // Floor constraints
    CONSTRAINTS: {
        EASY_POOL_FLOORS: [1, 2],
        NO_ELITE_BEFORE_FLOOR: 6,
        GUARANTEED_TREASURE_FLOOR: 8,
        GUARANTEED_REST_FLOOR: 14,
        BOSS_FLOOR: 15
    }
};