import { CardData, GameState, EnemyIntent, MapLayer, MapNode, MapNodeType, CharacterStats, RelicData, EntityStatus, EnemyData, CardEffect, PlayerStatuses, EnemyStatuses, EncounterTemplate } from './types.ts';
import { GAME_DATA, MAX_HAND_SIZE, MAP_CONFIG, ENCOUNTER_TEMPLATES } from './constants.ts';

// --- Math Helpers ---

export const calculateDamage = (baseDamage: number, attackerStatus: EntityStatus, defenderStatus: EntityStatus, strengthMultiplier: number = 1): number => {
    let damage = baseDamage + (attackerStatus.strength * strengthMultiplier);
    if (attackerStatus.weak > 0) damage = damage * 0.75;
    if (defenderStatus.vulnerable > 0) damage = damage * 1.5;
    return Math.floor(damage);
};

export const countCardsMatches = (cards: CardData[], matchString: string): number => {
    return cards.filter(c => c.name.includes(matchString)).length;
};

// --- Deck Helpers ---

export const generateStarterDeck = (): CardData[] => {
    const deck: CardData[] = [];
    for (let i = 0; i < 5; i++) deck.push({ ...GAME_DATA.cards.cto_commit, id: `commit_${i}_${Math.random().toString(36).substr(2, 9)}` });
    for (let i = 0; i < 4; i++) deck.push({ ...GAME_DATA.cards.cto_rollback, id: `rollback_${i}_${Math.random().toString(36).substr(2, 9)}` });
    deck.push({ ...GAME_DATA.cards.cto_hotfix, id: `hotfix_${Math.random().toString(36).substr(2, 9)}` });
    return deck;
};

export const getRandomRewardCards = (count: number): CardData[] => {
    const getRarity = (): 'common' | 'uncommon' | 'rare' => {
        const roll = Math.random() * 100;
        if (roll < 60) return 'common';
        if (roll < 97) return 'uncommon';
        return 'rare';
    };
    const pool = Object.values(GAME_DATA.cards).filter(c => c.type !== 'status' && c.rarity !== 'starter' && c.rarity !== 'special');
    const rewards: CardData[] = [];
    for (let i = 0; i < count; i++) {
        const targetRarity = getRarity();
        const rarityPool = pool.filter(c => c.rarity === targetRarity);
        const finalPool = rarityPool.length > 0 ? rarityPool : pool;
        const randomCard = finalPool[Math.floor(Math.random() * finalPool.length)];
        rewards.push({ ...randomCard, id: `reward_${Date.now()}_${i}` });
    }
    return rewards;
};

export const shuffle = (cards: CardData[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
};

export const drawCards = (currentDraw: CardData[], currentDiscard: CardData[], count: number): { drawn: CardData[], newDraw: CardData[], newDiscard: CardData[] } => {
    let drawn: CardData[] = [];
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

export const processDrawnCards = (
    drawn: CardData[],
    hand: CardData[],
    discard: CardData[],
    drawPile: CardData[],
    stats: CharacterStats,
    message: string
): { hand: CardData[], discard: CardData[], drawPile: CardData[], stats: CharacterStats, message: string, drawnCards: CardData[] } => {
    let nextHand = [...hand];
    let nextDiscard = [...discard];
    let currentDrawPile = [...drawPile];
    let nextStats = { ...stats };
    let newMessage = message;
    let actualDrawn: CardData[] = [];

    let cardsToProcess = [...drawn];
    let safety = 0;

    while (cardsToProcess.length > 0 && safety < 20) {
        const card = cardsToProcess.shift();
        if (!card) continue;

        // Hand Limit
        if (nextHand.length < MAX_HAND_SIZE) {
            nextHand.push(card);
            actualDrawn.push(card);
        } else {
            nextDiscard.push(card);
            newMessage += ` (Hand full! Burned ${card.name})`;
            continue;
        }

        // Legacy Code (Void)
        if (card.effects?.some(e => e.type === 'lose_bandwidth') && card.unplayable) {
             nextStats.bandwidth = Math.max(0, nextStats.bandwidth - 1);
             newMessage += ` (Legacy Code drained 1 Bandwidth!)`;
        }

        // Evolve
        if (card.type === 'status' && nextStats.statuses.evolve > 0 && nextStats.statuses.noDraw === 0) {
            safety++;
            const evolveResult = drawCards(currentDrawPile, nextDiscard, nextStats.statuses.evolve);
            currentDrawPile = evolveResult.newDraw;
            nextDiscard = evolveResult.newDiscard;
            evolveResult.drawn.forEach(c => cardsToProcess.push(c));
        }
    }
    
    return { hand: nextHand, discard: nextDiscard, drawPile: currentDrawPile, stats: nextStats, message: newMessage, drawnCards: actualDrawn };
};

export const upgradeCard = (card: CardData): CardData => {
    if (card.upgraded) return card;
    if (card.id === 'cto_refactor') {
        const upgradedEffects = [{ type: 'block', value: 9, target: 'self' }, { type: 'exhaust_targeted', value: 1, target: 'self' }] as CardEffect[];
        return { ...card, name: card.name + "+", upgraded: { name: card.name + "+", effects: upgradedEffects }, effects: upgradedEffects, description: "Gain 9 Mitigation. Exhaust a card." };
    }
    const newEffects = card.effects.map(effect => {
        if (effect.type === 'damage' || effect.type === 'block') return { ...effect, value: effect.value + 3 };
        if (effect.type === 'apply_status' && (effect.status === 'vulnerable' || effect.status === 'weak' || effect.status === 'strength')) return { ...effect, value: effect.value + 1 };
        if (effect.strengthMultiplier && effect.strengthMultiplier === 3) return { ...effect, strengthMultiplier: 5 };
        if (effect.type === 'upgrade_hand' && effect.value === 1) return { ...effect, value: 99 };
        return effect;
    });
    let newDesc = card.description.replace(/\d+/, (match) => (parseInt(match) + 3).toString());
    if (card.id === 'cto_brute_force') newDesc = newDesc.replace('3 times', '5 times');
    if (card.id === 'cto_tooling') newDesc = newDesc.replace('a card', 'ALL cards');
    return { ...card, name: card.name + "+", upgraded: { name: card.name + "+", effects: newEffects }, effects: newEffects, description: newDesc };
};

// --- Relic Helpers ---

export const applyCombatStartRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let message = '';
    relics.forEach(relic => {
        if (relic.trigger === 'combat_start' && relic.effect.type === 'block') {
            newStats.mitigation += relic.effect.value;
            message = `Relic Active: ${relic.name} (+${relic.effect.value} Mitigation)`;
        }
    });
    return { stats: newStats, message };
};

export const applyCombatEndRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let message = '';
    relics.forEach(relic => {
        if (relic.trigger === 'combat_end' && relic.effect.type === 'heal') {
            const healAmount = relic.effect.value;
            const oldHp = newStats.hp;
            newStats.hp = Math.min(newStats.maxHp, newStats.hp + healAmount);
            const actualHeal = newStats.hp - oldHp;
            if (actualHeal > 0) message = `${relic.name}: Recovered ${actualHeal} Runway.`;
        }
    });
    return { stats: newStats, message };
};

export const getTurnStartBandwidth = (relics: RelicData[]): number => {
    let bandwidth = 3;
    relics.forEach(relic => {
        if (relic.trigger === 'turn_start' && relic.effect.type === 'gain_bandwidth') bandwidth += relic.effect.value;
    });
    return bandwidth;
}

// --- Map Generation (Exact Slay the Spire Algorithm) ---

// STS Map Constants
const STS_MAP = {
    LANES: 7,           // 7 possible columns (0-6)
    FLOORS: 15,         // 15 floors of nodes
    NUM_PATHS: 6,       // Exactly 6 spines from bottom to top

    // Fixed floors
    FLOOR_1_TYPE: 'problem' as MapNodeType,      // All floor 1 = normal fights
    FLOOR_9_TYPE: 'treasure' as MapNodeType,     // All floor 9 = chest
    FLOOR_15_TYPE: 'retrospective' as MapNodeType, // All floor 15 = rest

    // Room type ratios (percentage of total nodes)
    RATIOS: {
        vendor: 5,          // Shop 5%
        retrospective: 12,  // Rest 12%
        opportunity: 22,    // Event 22%
        elite: 8,           // Elite 8%
        // Normal fills the rest
    },

    // Constraints
    NO_ELITE_REST_BEFORE_FLOOR: 6,
    NO_REST_ON_FLOOR: 14,  // Floor 14 cannot be rest (floor 15 is rest)
};

// Step 1: Build 6 path spines from floor 1 to floor 15
const buildPathSpines = (): number[][] => {
    const paths: number[][] = [];
    const usedStartPositions: Set<number> = new Set();

    for (let pathIdx = 0; pathIdx < STS_MAP.NUM_PATHS; pathIdx++) {
        const path: number[] = [];

        // Choose starting position on floor 1
        let startCol: number;
        if (pathIdx < 2) {
            // First two paths MUST start in different bottom rooms
            do {
                startCol = Math.floor(Math.random() * STS_MAP.LANES);
            } while (usedStartPositions.has(startCol));
            usedStartPositions.add(startCol);
        } else {
            // Paths 3-6 can start anywhere
            startCol = Math.floor(Math.random() * STS_MAP.LANES);
        }
        path.push(startCol);

        // Walk upward floor by floor
        for (let floor = 2; floor <= STS_MAP.FLOORS; floor++) {
            const currentCol = path[path.length - 1];

            // Possible moves: up-left, straight up, up-right
            const possibleMoves: number[] = [];
            if (currentCol > 0) possibleMoves.push(currentCol - 1);
            possibleMoves.push(currentCol);
            if (currentCol < STS_MAP.LANES - 1) possibleMoves.push(currentCol + 1);

            // Filter out moves that would cause crossing with existing paths
            const validMoves = possibleMoves.filter(nextCol => {
                return !wouldCrossPath(paths, floor - 1, currentCol, nextCol);
            });

            // Pick a random valid move (fallback to any move if all would cross)
            const moves = validMoves.length > 0 ? validMoves : possibleMoves;
            const nextCol = moves[Math.floor(Math.random() * moves.length)];
            path.push(nextCol);
        }

        paths.push(path);
    }

    return paths;
};

// Check if moving from (floor, fromCol) to (floor+1, toCol) would cross an existing path
const wouldCrossPath = (existingPaths: number[][], floor: number, fromCol: number, toCol: number): boolean => {
    for (const path of existingPaths) {
        if (path.length <= floor) continue;

        const otherFromCol = path[floor - 1];
        const otherToCol = path[floor];

        // Crossing occurs if paths swap relative positions
        if (fromCol < otherFromCol && toCol > otherToCol) return true;
        if (fromCol > otherFromCol && toCol < otherToCol) return true;
    }
    return false;
};

// Step 2: Create nodes and connections from paths
interface NodeData {
    floor: number;
    column: number;
    connections: Set<string>;
    parentConnections: Set<string>;
}

const buildNodesFromPaths = (paths: number[][]): Map<string, NodeData> => {
    const nodes: Map<string, NodeData> = new Map();

    // Create nodes for each unique position visited by paths
    paths.forEach(path => {
        path.forEach((col, floorIdx) => {
            const floor = floorIdx + 1;
            const key = `${floor}_${col}`;

            if (!nodes.has(key)) {
                nodes.set(key, {
                    floor,
                    column: col,
                    connections: new Set(),
                    parentConnections: new Set()
                });
            }
        });
    });

    // Build connections
    paths.forEach(path => {
        for (let floorIdx = 0; floorIdx < path.length - 1; floorIdx++) {
            const floor = floorIdx + 1;
            const fromCol = path[floorIdx];
            const toCol = path[floorIdx + 1];

            const fromKey = `${floor}_${fromCol}`;
            const toKey = `${floor + 1}_${toCol}`;

            const fromNode = nodes.get(fromKey);
            const toNode = nodes.get(toKey);

            if (fromNode && toNode) {
                fromNode.connections.add(toKey);
                toNode.parentConnections.add(fromKey);
            }
        }
    });

    // Remove starting nodes that merge immediately (two floor-1 nodes going to same floor-2 node)
    const floor1Nodes = Array.from(nodes.entries()).filter(([k, n]) => n.floor === 1);
    const floor2Targets = new Map<string, string[]>();

    floor1Nodes.forEach(([key, node]) => {
        node.connections.forEach(targetKey => {
            if (!floor2Targets.has(targetKey)) {
                floor2Targets.set(targetKey, []);
            }
            floor2Targets.get(targetKey)!.push(key);
        });
    });

    // If multiple floor-1 nodes go to same floor-2 node, remove all but one
    floor2Targets.forEach((sources, target) => {
        if (sources.length > 1) {
            // Keep first, remove rest
            for (let i = 1; i < sources.length; i++) {
                nodes.delete(sources[i]);
            }
        }
    });

    return nodes;
};

// Step 3: Assign room types using bucket system
const assignRoomTypes = (nodes: Map<string, NodeData>): Map<string, MapNodeType> => {
    const types: Map<string, MapNodeType> = new Map();

    // Pre-assign fixed floors
    nodes.forEach((node, key) => {
        if (node.floor === 1) {
            types.set(key, STS_MAP.FLOOR_1_TYPE); // All normal fights
        } else if (node.floor === 9) {
            types.set(key, STS_MAP.FLOOR_9_TYPE); // All treasure
        } else if (node.floor === 15) {
            types.set(key, STS_MAP.FLOOR_15_TYPE); // All rest
        }
    });

    // Count untyped nodes
    const untypedKeys = Array.from(nodes.keys()).filter(k => !types.has(k));
    const totalUntyped = untypedKeys.length;

    // Build bucket of room types based on ratios
    const bucket: MapNodeType[] = [];
    const targetCounts = {
        vendor: Math.round(totalUntyped * STS_MAP.RATIOS.vendor / 100),
        retrospective: Math.round(totalUntyped * STS_MAP.RATIOS.retrospective / 100),
        opportunity: Math.round(totalUntyped * STS_MAP.RATIOS.opportunity / 100),
        elite: Math.round(totalUntyped * STS_MAP.RATIOS.elite / 100),
    };

    // Add tokens to bucket
    for (let i = 0; i < targetCounts.vendor; i++) bucket.push('vendor');
    for (let i = 0; i < targetCounts.retrospective; i++) bucket.push('retrospective');
    for (let i = 0; i < targetCounts.opportunity; i++) bucket.push('opportunity');
    for (let i = 0; i < targetCounts.elite; i++) bucket.push('elite');

    // Fill rest with normal fights
    while (bucket.length < totalUntyped) {
        bucket.push('problem');
    }

    // Shuffle bucket
    for (let i = bucket.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }

    // Assign types to untyped nodes with constraints
    const usedFromBucket: boolean[] = new Array(bucket.length).fill(false);

    // Sort untyped keys by floor for deterministic assignment
    untypedKeys.sort((a, b) => {
        const nodeA = nodes.get(a)!;
        const nodeB = nodes.get(b)!;
        if (nodeA.floor !== nodeB.floor) return nodeA.floor - nodeB.floor;
        return nodeA.column - nodeB.column;
    });

    untypedKeys.forEach(key => {
        const node = nodes.get(key)!;

        // Try each bucket item until one passes constraints
        for (let i = 0; i < bucket.length; i++) {
            if (usedFromBucket[i]) continue;

            const candidateType = bucket[i];
            if (isValidAssignment(candidateType, node, nodes, types)) {
                types.set(key, candidateType);
                usedFromBucket[i] = true;
                break;
            }
        }

        // Fallback: if no valid type found, use normal fight
        if (!types.has(key)) {
            types.set(key, 'problem');
        }
    });

    return types;
};

// Check if assigning a type to a node violates constraints
const isValidAssignment = (
    type: MapNodeType,
    node: NodeData,
    nodes: Map<string, NodeData>,
    assignedTypes: Map<string, MapNodeType>
): boolean => {
    // Rule 1: No elites or rests before floor 6
    if (node.floor < STS_MAP.NO_ELITE_REST_BEFORE_FLOOR) {
        if (type === 'elite' || type === 'retrospective') return false;
    }

    // Rule 2: No rest on floor 14
    if (node.floor === STS_MAP.NO_REST_ON_FLOOR && type === 'retrospective') {
        return false;
    }

    // Rule 3: No consecutive high-impact types (rest/elite/shop) on a path
    if (type === 'elite' || type === 'retrospective' || type === 'vendor') {
        // Check parent nodes
        for (const parentKey of node.parentConnections) {
            const parentType = assignedTypes.get(parentKey);
            if (parentType === type) return false;
        }
    }

    // Rule 4: Children of same parent must differ (for non-basic types)
    if (type === 'elite' || type === 'retrospective' || type === 'vendor' || type === 'opportunity') {
        // Find siblings (other nodes with same parent)
        for (const parentKey of node.parentConnections) {
            const parentNode = nodes.get(parentKey);
            if (!parentNode) continue;

            for (const siblingKey of parentNode.connections) {
                if (siblingKey === `${node.floor}_${node.column}`) continue;
                const siblingType = assignedTypes.get(siblingKey);
                if (siblingType === type) return false;
            }
        }
    }

    return true;
};

// Main map generation function
export const generateMap = (): MapLayer[] => {
    // Step 1: Build path spines
    const paths = buildPathSpines();

    // Step 2: Create nodes from paths
    const nodeData = buildNodesFromPaths(paths);

    // Step 3: Assign room types
    const nodeTypes = assignRoomTypes(nodeData);

    // Step 4: Convert to MapLayer format
    const layers: MapLayer[] = [];

    for (let floor = 1; floor <= STS_MAP.FLOORS; floor++) {
        const floorNodes: MapNode[] = [];

        nodeData.forEach((data, key) => {
            if (data.floor !== floor) return;

            const node: MapNode = {
                id: `f${floor}_c${data.column}`,
                type: nodeTypes.get(key) || 'problem',
                floor,
                column: data.column,
                connections: Array.from(data.connections).map(k => {
                    const [f, c] = k.split('_').map(Number);
                    return `f${f}_c${c}`;
                }),
                parentConnections: Array.from(data.parentConnections).map(k => {
                    const [f, c] = k.split('_').map(Number);
                    return `f${f}_c${c}`;
                }),
                completed: false,
                accessible: floor === 1
            };

            floorNodes.push(node);
        });

        // Sort by column
        floorNodes.sort((a, b) => a.column - b.column);
        layers.push(floorNodes);
    }

    // Step 5: Add boss floor (floor 16)
    const bossNode: MapNode = {
        id: 'boss',
        type: 'boss',
        floor: STS_MAP.FLOORS + 1,
        column: 3,
        connections: [],
        parentConnections: [],
        completed: false,
        accessible: false
    };

    // Connect all floor 15 nodes to boss
    if (layers[STS_MAP.FLOORS - 1]) {
        layers[STS_MAP.FLOORS - 1].forEach(node => {
            node.connections.push(bossNode.id);
            bossNode.parentConnections.push(node.id);
        });
    }

    layers.push([bossNode]);

    return layers;
};

// Encounter Spawning with Variance
export const getEncounterForFloor = (floor: number): EnemyData[] => {
    // Floor 1 uses easy pool, floors 2+ use hard pool
    const pool = floor === 1 ? 'easy' : 'hard';
    const templates = ENCOUNTER_TEMPLATES.filter(t => t.pool === pool);

    // Weighted random selection
    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
    let roll = Math.random() * totalWeight;

    let selectedTemplate: EncounterTemplate | null = null;
    for (const template of templates) {
        roll -= template.weight;
        if (roll <= 0) {
            selectedTemplate = template;
            break;
        }
    }

    if (!selectedTemplate) selectedTemplate = templates[0];

    // Spawn enemies with variance
    const enemies: EnemyData[] = [];
    selectedTemplate.enemies.forEach(enemyConfig => {
        const count = Math.floor(Math.random() * (enemyConfig.count[1] - enemyConfig.count[0] + 1)) + enemyConfig.count[0];
        const baseEnemy = GAME_DATA.enemies[enemyConfig.enemyId as keyof typeof GAME_DATA.enemies];

        if (baseEnemy) {
            for (let i = 0; i < count; i++) {
                const hpVariance = Math.floor(Math.random() * 5) - 2; // +/- 2 HP variance
                enemies.push({
                    ...baseEnemy,
                    id: `${baseEnemy.id}_${Date.now()}_${i}`,
                    hp: Math.max(1, baseEnemy.hp + hpVariance),
                    maxHp: Math.max(1, baseEnemy.maxHp + hpVariance),
                    statuses: { ...baseEnemy.statuses }
                });
            }
        }
    });

    return enemies;
};

// Get Elite Encounter
export const getEliteEncounter = (): EnemyData[] => {
    const eliteIds = ['scope_creep', 'over_engineer'];
    const eliteId = eliteIds[Math.floor(Math.random() * eliteIds.length)];

    if (eliteId === 'over_engineer') {
        const elite = GAME_DATA.enemies.over_engineer;
        return [{
            ...elite,
            id: `${elite.id}_${Date.now()}`,
            statuses: { ...elite.statuses }
        }];
    }

    // Scope Creep or Legacy Systems (3 sentries)
    if (eliteId === 'scope_creep') {
        const elite = GAME_DATA.enemies.scope_creep;
        return [{
            ...elite,
            id: `${elite.id}_${Date.now()}`,
            statuses: { ...elite.statuses }
        }];
    }

    // Legacy Systems (3 sentries)
    return [
        { ...GAME_DATA.enemies.legacy_monolith, id: `legacy_monolith_${Date.now()}_1`, statuses: { ...GAME_DATA.enemies.legacy_monolith.statuses } },
        { ...GAME_DATA.enemies.legacy_hack, id: `legacy_hack_${Date.now()}_2`, statuses: { ...GAME_DATA.enemies.legacy_hack.statuses } },
        { ...GAME_DATA.enemies.legacy_patch, id: `legacy_patch_${Date.now()}_3`, statuses: { ...GAME_DATA.enemies.legacy_patch.statuses } }
    ];
};

// Get Boss Encounter (random from pool)
export const getBossEncounter = (): EnemyData[] => {
    const bossIds = ['boss_the_pivot', 'boss_burn_rate', 'boss_the_monolith'];
    const bossId = bossIds[Math.floor(Math.random() * bossIds.length)];
    const boss = GAME_DATA.enemies[bossId as keyof typeof GAME_DATA.enemies];

    return [{
        ...boss,
        id: `${boss.id}_${Date.now()}`,
        statuses: { ...boss.statuses }
    }];
};

// --- Game Logic ---

// --- AI Logic ---

const getNextIntent = (enemy: EnemyData, turn: number, playerHp: number): EnemyIntent => {
    const roll = Math.random() * 100;
    
    // --- COMMON ---
    if (enemy.id === 'fanboy') {
        if (turn === 1) return { type: 'buff', value: 3, icon: 'buff', description: "Ritual (Hype)" };
        const dmg = 6 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: `${dmg} Dark Strike` };
    }
    
    if (enemy.id === 'spaghetti_code') {
        if (roll < 25) return { type: 'buff', value: 3, icon: 'buff', description: "Bellow (Block+Str)" };
        if (roll < 55) return { type: 'attack', value: 7, icon: 'attack', description: "Thrash (7 Dmg + 5 Blk)" };
        return { type: 'attack', value: 11, icon: 'attack', description: "Chomp (11 Dmg)" };
    }

    if (enemy.id === 'critical_bug') {
        if (roll < 25) return { type: 'buff', value: 3, icon: 'buff', description: "Grow (Severity)" };
        const dmg = 6 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Bite" };
    }

    if (enemy.id === 'minor_bug') {
        if (roll < 25) return { type: 'debuff', value: 2, icon: 'debuff', description: "Spit Web (Weak)" };
        const dmg = 5 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Bite" };
    }
    
    if (enemy.id === 'quick_hack' || enemy.id === 'hotfix') {
        if (roll < 50) return { type: 'attack', value: 3, icon: 'attack', description: "Tackle" };
        return { type: 'debuff', value: 1, icon: 'debuff', description: "Lick (Weak)" };
    }

    if (enemy.id === 'tech_debt' || enemy.id === 'bad_merge') {
        if (roll < 30) return { type: 'debuff', value: 1, icon: 'debuff', description: "Corrosive Spit (Slimed)" };
        return { type: 'attack', value: 7, icon: 'attack', description: "Tackle" };
    }

    if (enemy.id === 'legacy_module' || enemy.id === 'merge_conflict') {
        if (roll < 30) return { type: 'debuff', value: 2, icon: 'debuff', description: "Corrosive Spit (Slimed)" };
        return { type: 'attack', value: 16, icon: 'attack', description: "Tackle" };
    }

    // --- ELITES ---
    if (enemy.id === 'scope_creep') {
        if (turn === 1) return { type: 'buff', value: 0, icon: 'buff', description: "Bellow (Enrage)" };
        if (turn === 2) return { type: 'debuff', value: 2, icon: 'debuff', description: "Skull Bash (Vuln)" };
        return { type: 'attack', value: 14, icon: 'attack', description: "Rush" };
    }

    if (enemy.id === 'the_over_engineer') {
        if (enemy.statuses.asleep > 0) {
            return { type: 'debuff', value: 1, icon: 'debuff', description: "Siphon (-1 Str/Dex)" };
        }
        if (turn % 3 === 0) return { type: 'debuff', value: 1, icon: 'debuff', description: "Siphon (-1 Str/Dex)" };
        return { type: 'attack', value: 18, icon: 'attack', description: "Attack" };
    }

    if (enemy.id.startsWith('legacy_system')) {
        if (turn % 2 === 0) return { type: 'attack', value: 9, icon: 'attack', description: "Beam" };
        return { type: 'debuff', value: 2, icon: 'debuff', description: "Shuffle Bugs" };
    }

    // --- BOSSES ---
    if (enemy.id === 'boss_the_pivot') {
        const cycle = turn % 4;
        if (cycle === 1) return { type: 'buff', value: 9, icon: 'buff', description: "Charging Up (Block)" };
        if (cycle === 2) return { type: 'attack', value: 32, icon: 'attack', description: "Fierce Bash" };
        if (cycle === 3) return { type: 'debuff', value: 2, icon: 'debuff', description: "Vent Steam (Vuln)" };
        return { type: 'attack', value: 5, icon: 'attack', description: "Whirlwind (x4)" };
    }

    if (enemy.id === 'boss_burn_rate') {
        if (turn === 1) return { type: 'attack', value: 0, icon: 'attack', description: "Divider (x6)" };
        const cycle = (turn - 1) % 5;
        if (cycle === 0) return { type: 'attack', value: 6, icon: 'attack', description: "Sear" };
        if (cycle === 1) return { type: 'debuff', value: 1, icon: 'debuff', description: "Burn" };
        if (cycle === 2) return { type: 'attack', value: 6, icon: 'attack', description: "Sear" };
        if (cycle === 3) return { type: 'debuff', value: 2, icon: 'debuff', description: "Burn" };
        return { type: 'attack', value: 2, icon: 'attack', description: "Inferno (x6)" };
    }

    if (enemy.id === 'boss_the_monolith') {
        const cycle = turn % 3;
        if (cycle === 1) return { type: 'debuff', value: 3, icon: 'debuff', description: "Goop Spray (Slimed)" };
        if (cycle === 2) return { type: 'buff', value: 0, icon: 'buff', description: "Prepare" };
        return { type: 'attack', value: 35, icon: 'attack', description: "Slam" };
    }

    return { type: 'attack', value: 5, icon: 'attack', description: "Attack" };
};

export const resolveEndTurn = (prev: GameState): GameState => {
    let nextPlayerStatuses = { ...prev.playerStats.statuses };
    let nextMitigation = prev.playerStats.mitigation;
    let endTurnMessage = 'Enemy is executing intent...';

    if (nextPlayerStatuses.vulnerable > 0) nextPlayerStatuses.vulnerable--;
    if (nextPlayerStatuses.weak > 0) nextPlayerStatuses.weak--;
    if (nextPlayerStatuses.noDraw > 0) nextPlayerStatuses.noDraw = 0;

    if (nextPlayerStatuses.metallicize > 0) nextMitigation += nextPlayerStatuses.metallicize;

    const cardsToDiscard: CardData[] = [];
    const cardsToExhaust: CardData[] = [];
    const cardsToRetain: CardData[] = [];
    let currentHp = prev.playerStats.hp;

    prev.hand.forEach(card => {
        // Burnout Logic
        if (card.effects?.some(e => e.type === 'lose_hp_turn_end')) {
            const burnDamage = card.effects.find(e => e.type === 'lose_hp_turn_end')?.value || 0;
            currentHp = Math.max(0, currentHp - burnDamage);
            endTurnMessage += ` Burnout: -${burnDamage} Runway.`;

            // Antifragile Trigger
            if (nextPlayerStatuses.antifragile > 0) {
                nextPlayerStatuses.strength += nextPlayerStatuses.antifragile;
                endTurnMessage += ` (Antifragile: +${nextPlayerStatuses.antifragile} STR)`;
            }
        }

        if (card.ethereal) cardsToExhaust.push(card);
        else if (card.retain) cardsToRetain.push(card);
        else cardsToDiscard.push(card);
    });

    if (cardsToExhaust.length > 0) {
        endTurnMessage += ` ${cardsToExhaust.length} card(s) faded away.`;
        if (nextPlayerStatuses.feelNoPain > 0) nextMitigation += (nextPlayerStatuses.feelNoPain * cardsToExhaust.length);
    }
    if (cardsToRetain.length > 0) endTurnMessage += ` Retained ${cardsToRetain.length} card(s).`;

    return {
        ...prev,
        playerStats: { ...prev.playerStats, hp: currentHp, statuses: nextPlayerStatuses, mitigation: nextMitigation },
        discardPile: [...prev.discardPile, ...cardsToDiscard],
        exhaustPile: [...prev.exhaustPile, ...cardsToExhaust],
        hand: cardsToRetain,
        status: 'ENEMY_TURN',
        message: endTurnMessage
    };
};

export const resolveEnemyTurn = (prev: GameState): GameState => {
    let newPlayerHp = prev.playerStats.hp;
    let newMitigation = prev.playerStats.mitigation;
    let newPlayerStatuses = { ...prev.playerStats.statuses };
    let newMessage = '';
    let newEnemies = prev.enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    let enemiesToSpawn: EnemyData[] = [];
    let nextDrawPile = [...prev.drawPile];

    newEnemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const intent = enemy.currentIntent;

        if (intent.type === 'attack') {
            let attackValue = intent.value;
            if (enemy.id === 'boss_burn_rate' && intent.description.includes('Divider')) {
                const hits = 6;
                const dmgPerHit = Math.floor(newPlayerHp / 12) + 1;
                attackValue = dmgPerHit * hits;
                newMessage += ` Divider dealt ${hits}x${dmgPerHit} damage!`;
            }

            const damage = calculateDamage(attackValue, enemy.statuses, newPlayerStatuses);
            let unblockedDamage = damage;

            if (newPlayerStatuses.thorns > 0) {
                enemy.hp -= newPlayerStatuses.thorns;
                newMessage += ` Thorns dealt ${newPlayerStatuses.thorns} to ${enemy.name}.`;
            }

            if (newMitigation > 0) {
                const blocked = Math.min(newMitigation, unblockedDamage);
                newMitigation -= blocked;
                unblockedDamage -= blocked;
            }
            newPlayerHp -= unblockedDamage;
            if (unblockedDamage > 0) newMessage += ` ${enemy.name} caused ${unblockedDamage} Burn.`;
            else newMessage += ` Blocked ${enemy.name}.`;
        } else if (intent.type === 'buff') {
            if (intent.description.includes('Growth') || intent.description.includes('Ritual')) {
                enemy.statuses.strength += intent.value;
                newMessage += ` ${enemy.name} gained ${intent.value} Strength.`;
            } else if (intent.description.includes('Block') || intent.description.includes('Barricade')) {
                enemy.mitigation += intent.value;
                newMessage += ` ${enemy.name} gained ${intent.value} Block.`;
            } else if (intent.description.includes('Escape')) {
                enemy.hp = 0;
                enemy.maxHp = 0;
                newMessage += ` ${enemy.name} Escaped with your capital!`;
            } else if (intent.description.includes('Split') && enemy.id === 'boss_the_monolith') {
                const acidL = { ...GAME_DATA.enemies.legacy_module, id: `legacy_module_split_${Date.now()}_acid`, hp: 70, maxHp: 70 };
                const spikeL = { ...GAME_DATA.enemies.merge_conflict, id: `merge_conflict_split_${Date.now()}_spike`, hp: 70, maxHp: 70 };
                enemiesToSpawn.push(acidL, spikeL);
                enemy.hp = 0;
                newMessage += ` ${enemy.name} Split into two!`;
            }
        } else if (intent.type === 'debuff') {
            if (enemy.id.startsWith('legacy_') && intent.description.includes('Shuffle Bugs')) {
                const bugCard = GAME_DATA.cards.card_bug;
                nextDrawPile.push({ ...bugCard, id: `card_bug_${Date.now()}_1` }, { ...bugCard, id: `card_bug_${Date.now()}_2` });
                nextDrawPile = shuffle(nextDrawPile);
                newMessage += ` ${enemy.name} shuffled 2 Bugs into your roadmap!`;
            } else if (intent.description.includes('Slimed')) {
                const slime = { ...GAME_DATA.cards.status_scope_creep, id: `status_scope_creep_${Date.now()}` };
                nextDrawPile.push(slime);
                nextDrawPile = shuffle(nextDrawPile);
                newMessage += ` ${enemy.name} Slimed you!`;
            } else if (intent.description.includes('Weak')) {
                newPlayerStatuses.weak += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Weak.`;
            } else if (intent.description.includes('Vulnerable')) {
                newPlayerStatuses.vulnerable += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Vulnerable.`;
            } else if (intent.description.includes('Frail')) {
                newPlayerStatuses.frail += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Frail.`;
            }
        }

        if (enemy.statuses.vulnerable > 0) enemy.statuses.vulnerable--;
        if (enemy.statuses.weak > 0) enemy.statuses.weak--;
        if (enemy.statuses.growth > 0) enemy.statuses.strength += enemy.statuses.growth;
        if (enemy.statuses.metallicize > 0) {
            enemy.mitigation += enemy.statuses.metallicize;
            newMessage += ` ${enemy.name} hardened (+${enemy.statuses.metallicize} Blk).`;
        }
        enemy.mitigation = 0; // Clear block at start of enemy turn action
        if (enemy.statuses.metallicize > 0) enemy.mitigation += enemy.statuses.metallicize;
    });

    if (enemiesToSpawn.length > 0) newEnemies = [...newEnemies, ...enemiesToSpawn];

    let newStatus: GameState['status'] = 'PLAYING';
    if (newPlayerHp <= 0) {
        newStatus = 'GAME_OVER';
        newMessage = "RUNWAY DEPLETED. STARTUP FAILED.";
    }

    let earnedCapital = 0;
    let earnedRelic: RelicData | undefined;
    let newRelics = [...prev.relics];

    if (newEnemies.every(e => e.hp <= 0) && newStatus !== 'GAME_OVER') {
        newStatus = 'VICTORY';
        newMessage = "PROBLEM SOLVED.";
        newEnemies.forEach(enemyData => {
            if (enemyData.maxHp === 0) return;
            if (enemyData.rewards) {
                const { min, max } = enemyData.rewards.capital;
                earnedCapital += Math.floor(Math.random() * (max - min + 1)) + min;
                if (enemyData.type === 'elite') {
                    const hasCoffee = prev.relics.some(r => r.id === 'relic_coffee_drip');
                    if (!hasCoffee && !earnedRelic) {
                        earnedRelic = GAME_DATA.relics.coffee_drip;
                        newRelics.push(earnedRelic);
                        newMessage += ` Found Relic: ${earnedRelic.name}.`;
                    }
                }
            } else {
                earnedCapital += 15;
            }
        });
        newMessage += ` Earned $${earnedCapital}k Capital.`;
    }

    const nextTurn = prev.turn + 1;
    newEnemies.forEach(enemy => {
        if (enemy.hp > 0) {
             enemy.currentIntent = getNextIntent(enemy, nextTurn, newPlayerHp);
        }
    });

    const nextBandwidth = getTurnStartBandwidth(prev.relics);
    let nextPlayerStats = {
        ...prev.playerStats,
        hp: Math.max(0, newPlayerHp),
        mitigation: 0,
        bandwidth: nextBandwidth,
        statuses: { ...newPlayerStatuses, thorns: 0 }
    };

    if (newStatus === 'VICTORY') {
        nextPlayerStats.capital += earnedCapital;
        const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(nextPlayerStats, newRelics);
        nextPlayerStats = afterRelicStats;
        if (relicMsg) newMessage += ` ${relicMsg}`;
    }

    let nextState = {
        ...prev,
        playerStats: nextPlayerStats,
        relics: newRelics,
        enemies: newEnemies,
        turn: nextTurn,
        status: newStatus,
        message: newMessage,
        lastVictoryReward: newStatus === 'VICTORY' ? { capital: earnedCapital, relic: earnedRelic } : undefined
    };

    if (newStatus === 'PLAYING') {
        const { drawn, newDraw, newDiscard } = drawCards(nextDrawPile, prev.discardPile, 5);
        
        const processed = processDrawnCards(drawn, prev.hand, newDiscard, newDraw, nextPlayerStats, newMessage);
        
        nextState.hand = processed.hand;
        nextState.drawPile = processed.drawPile;
        nextState.discardPile = processed.discard;
        nextState.message = processed.message;
        nextState.playerStats = processed.stats;
    }

    return nextState;
};

export const resolveCardEffect = (prev: GameState, card: CardData, target: 'enemy' | 'self', targetEnemyId?: string): GameState => {
    const costPaid = card.cost === -1 ? prev.playerStats.bandwidth : card.cost;

    if (prev.playerStats.bandwidth < costPaid) {
        return { ...prev, message: "Not enough Bandwidth to deploy component." };
    }

    let newEnemies = prev.enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    const targetId = targetEnemyId || prev.selectedEnemyId || (newEnemies.length > 0 ? newEnemies[0].id : undefined);
    const targetEnemyIndex = newEnemies.findIndex(e => e.id === targetId);
    let targetEnemy = targetEnemyIndex !== -1 ? newEnemies[targetEnemyIndex] : null;

    let newMessage = `Deployed ${card.name}.`;
    let newStatus = prev.status;
    let newMitigation = prev.playerStats.mitigation;
    let newPlayerStatuses = { ...prev.playerStats.statuses };
    let newBandwidth = prev.playerStats.bandwidth - costPaid;
    let newPendingDiscard = 0;
    let newPendingSelection = prev.pendingSelection;
    let newRelics = [...prev.relics];

    let drawnCards: CardData[] = [];
    let newDrawPile = [...prev.drawPile];
    let newDiscardPile = [...prev.discardPile];
    let newExhaustPile = [...prev.exhaustPile];
    let currentHand = [...prev.hand.filter(c => c.id !== card.id)];

    const executeEffect = (effect: CardEffect, loops: number = 1) => {
        for (let i = 0; i < loops; i++) {
            if (effect.type === 'damage') {
                let targets: EnemyData[] = [];
                if (effect.target === 'all_enemies') targets = newEnemies;
                else if (target === 'enemy' && targetEnemy) targets = [targetEnemy];

                targets.forEach(t => {
                    let finalDamage = calculateDamage(effect.value, prev.playerStats.statuses, t.statuses, effect.strengthMultiplier || 1);
                    if (t.statuses.vulnerable > 0) newMessage += " (Vuln!)";
                    if (prev.playerStats.statuses.weak > 0) newMessage += " (Weak...)";

                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                        newMessage += ` (${blocked} Blocked)`;
                    }

                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} execution.`;

                    if (t.statuses.curlUp > 0 && finalDamage > 0) {
                        t.mitigation += t.statuses.curlUp;
                        t.statuses.curlUp = 0;
                        newMessage += ` ${t.name} Curled Up! (+${t.statuses.curlUp} Blk)`;
                    }
                    if (t.statuses.malleable > 0 && finalDamage > 0) {
                        t.mitigation += t.statuses.malleable;
                        t.statuses.malleable += 1;
                        newMessage += ` ${t.name} is Malleable! (+${t.statuses.malleable} Blk)`;
                    }
                    if (t.statuses.asleep > 0 && finalDamage > 0) {
                        t.statuses.asleep = 0;
                        newMessage += ` ${t.name} Woke Up!`;
                    }
                });

                if (newEnemies.every(e => e.hp <= 0)) {
                    newStatus = 'VICTORY';
                    newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                }
            } else if (effect.type === 'damage_scale_mitigation') {
                // Body Slam: Damage = Mitigation
                const dmg = prev.playerStats.mitigation;
                let targets: EnemyData[] = [];
                if (target === 'enemy' && targetEnemy) targets = [targetEnemy];
                
                targets.forEach(t => {
                    let finalDamage = calculateDamage(dmg, prev.playerStats.statuses, t.statuses);
                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                    }
                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} (Mitigation-based).`;
                });
            } else if (effect.type === 'damage_scale_matches') {
                // Perfected Strike: Damage scales with matches in deck
                const matchString = effect.matchString || 'Commit';
                // Count in Hand, Draw, Discard, Exhaust (Combat Deck)
                const combatDeck = [...currentHand, ...newDrawPile, ...newDiscardPile, ...newExhaustPile, card];
                const matches = countCardsMatches(combatDeck, matchString);
                const bonus = matches * (effect.value === 6 ? 2 : 2); // Hardcoded +2 per match for now based on description
                const totalDmg = effect.value + bonus;
                
                let targets: EnemyData[] = [];
                if (target === 'enemy' && targetEnemy) targets = [targetEnemy];
                
                targets.forEach(t => {
                    let finalDamage = calculateDamage(totalDmg, prev.playerStats.statuses, t.statuses);
                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                    }
                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} (${matches} matches).`;
                });
            } else if (effect.type === 'block') {
                let blockAmount = effect.value;
                if (newPlayerStatuses.frail > 0) blockAmount = Math.floor(blockAmount * 0.75);
                newMitigation += blockAmount;
                newMessage += ` gained ${blockAmount} Mitigation.`;
            } else if (effect.type === 'draw') {
                if (newPlayerStatuses.noDraw > 0) newMessage += ` (Draw prevented)`;
                else {
                    const result = drawCards(newDrawPile, newDiscardPile, effect.value);
                    
                    const currentStats = { ...prev.playerStats, bandwidth: newBandwidth, statuses: newPlayerStatuses, mitigation: newMitigation };
                    const processed = processDrawnCards(result.drawn, currentHand, newDiscardPile, result.newDraw, currentStats, newMessage);
                    
                    currentHand = processed.hand;
                    newDiscardPile = processed.discard;
                    newDrawPile = processed.drawPile;
                    newMessage = processed.message;
                    newBandwidth = processed.stats.bandwidth;
                    newPlayerStatuses = processed.stats.statuses;
                    
                    newMessage += ` Drew ${result.drawn.length} cards.`;
                }
            } else if (effect.type === 'apply_status') {
                const amount = effect.value;
                const statusType = effect.status || 'vulnerable';
                if (effect.target === 'self') {
                    if (statusType === 'strength') newPlayerStatuses.strength += amount;
                    if (statusType === 'metallicize') newPlayerStatuses.metallicize += amount;
                    if (statusType === 'evolve') newPlayerStatuses.evolve += amount;
                    if (statusType === 'feelNoPain') newPlayerStatuses.feelNoPain += amount;
                    if (statusType === 'noDraw') newPlayerStatuses.noDraw += amount;
                    if (statusType === 'thorns') newPlayerStatuses.thorns += amount;
                    if (statusType === 'antifragile') newPlayerStatuses.antifragile += amount;
                    if (statusType === 'artifact') newPlayerStatuses.artifact += amount;
                } else if (targetEnemy) {
                    if (statusType === 'vulnerable') targetEnemy.statuses.vulnerable += amount;
                    if (statusType === 'weak') targetEnemy.statuses.weak += amount;
                    if (statusType === 'strength') targetEnemy.statuses.strength += amount; // Disarm (negative strength)
                } else if (effect.target === 'all_enemies') {
                    newEnemies.forEach(e => {
                        if (statusType === 'vulnerable') e.statuses.vulnerable += amount;
                        if (statusType === 'weak') e.statuses.weak += amount;
                    });
                }
            } else if (effect.type === 'add_copy') {
                const copy = { ...card, id: `${card.id}_copy_${Date.now()}` };
                newDiscardPile.push(copy);
                newMessage += ` Added copy of ${card.name} to discard.`;
            } else if (effect.type === 'add_card') {
                if (effect.cardId) {
                    const cardTemplate = Object.values(GAME_DATA.cards).find(c => c.id === effect.cardId);
                    if (cardTemplate) {
                        const newCard = { ...cardTemplate, id: `${effect.cardId}_${Date.now()}` };
                        // Default to discard for now, or check target?
                        // YOLO Deploy -> Draw Pile? Tech Shortcut -> Discard.
                        // Effect usually specifies target, but here we assume Discard unless specified?
                        // YOLO Deploy says "Shuffle into your draw pile".
                        // Tech Shortcut says "Shuffle into your discard".
                        // We need a 'destination' in CardEffect or infer from card logic.
                        // For MVP, let's hardcode based on card ID or add destination to effect type?
                        // Let's assume Discard for now, unless it's YOLO Deploy.
                        if (card.id === 'cto_yolo_deploy') {
                            newDrawPile.push(newCard);
                            newDrawPile = shuffle(newDrawPile);
                            newMessage += ` Shuffled ${newCard.name} into Draw Pile.`;
                        } else {
                            newDiscardPile.push(newCard);
                            newMessage += ` Added ${newCard.name} to Discard.`;
                        }
                    }
                }
            } else if (effect.type === 'upgrade_hand') {
                if (effect.value === 1) {
                    // Trigger selection
                    newStatus = 'CARD_SELECTION';
                    newPendingSelection = { context: 'hand', action: 'upgrade', count: 1 };
                    newMessage += ` Select a card to upgrade.`;
                } else {
                    // Upgrade all?
                    currentHand = currentHand.map(c => upgradeCard(c));
                    drawnCards = drawnCards.map(c => upgradeCard(c)); // Also upgrade cards drawn this turn?
                    newMessage += ` Upgraded hand.`;
                }
            } else if (effect.type === 'retrieve_discard') {
                if (newDiscardPile.length > 0) {
                    newStatus = 'DISCARD_SELECTION';
                    newPendingSelection = { context: 'discard_pile', action: 'move_to_draw_pile', count: 1 };
                    newMessage += ` Select a card from discard.`;
                } else {
                    newMessage += ` Discard is empty.`;
                }
            } else if (effect.type === 'conditional_strength') {
                // Spot Weakness: If enemy intends to attack
                if (targetEnemy && targetEnemy.currentIntent.type === 'attack') {
                    newPlayerStatuses.strength += effect.value;
                    newMessage += ` Gained ${effect.value} Strength.`;
                }
            } else if (effect.type === 'conditional_refund') {
                // Dropkick: If enemy is Vulnerable
                if (targetEnemy && targetEnemy.statuses.vulnerable > 0) {
                    newBandwidth += effect.value;
                    const result = drawCards(newDrawPile, newDiscardPile, 1);
                    
                    const currentStats = { ...prev.playerStats, bandwidth: newBandwidth, statuses: newPlayerStatuses, mitigation: newMitigation };
                    const processed = processDrawnCards(result.drawn, currentHand, newDiscardPile, result.newDraw, currentStats, newMessage);
                    
                    currentHand = processed.hand;
                    newDiscardPile = processed.discard;
                    newDrawPile = processed.drawPile;
                    newMessage = processed.message;
                    newBandwidth = processed.stats.bandwidth;
                    newPlayerStatuses = processed.stats.statuses;
                    
                    newMessage += ` Refunded Energy & Draw.`;
                }
            } else if (effect.type === 'exhaust_random') {
                // Refactor: Exhaust random card
                if (currentHand.length > 0) {
                    const idx = Math.floor(Math.random() * currentHand.length);
                    const exhausted = currentHand.splice(idx, 1)[0];
                    newExhaustPile.push(exhausted);
                    newMessage += ` Exhausted ${exhausted.name}.`;
                    if (newPlayerStatuses.feelNoPain > 0) newMitigation += newPlayerStatuses.feelNoPain;
                }
            } else if (effect.type === 'exhaust_targeted') {
                if (currentHand.length > 0) {
                    newStatus = 'CARD_SELECTION';
                    newPendingSelection = { context: 'hand', action: 'exhaust', count: effect.value };
                    newMessage += ` Select ${effect.value} card(s) to exhaust.`;
                } else {
                    newMessage += ` Hand is empty.`;
                }
            } else if (effect.type === 'discard') {
                 if (currentHand.length > 0) {
                    newStatus = 'DISCARD_SELECTION';
                    newPendingDiscard = effect.value;
                    newMessage += ` Select ${effect.value} card(s) to discard.`;
                } else {
                    newMessage += ` Hand is empty.`;
                }
            } else if (effect.type === 'gain_bandwidth') {
                newBandwidth += effect.value;
                newMessage += ` Gained ${effect.value} Bandwidth.`;
            }
        }
    };

    card.effects.forEach(effect => {
        let loops = 1;
        if (card.cost === -1) loops = costPaid;
        executeEffect(effect, loops);
    });

    // Elite Mechanism: Scope Creep Passive
    newEnemies.forEach(e => {
        if (e.id === 'enemy_scope_creep' && card.type === 'skill' && e.hp > 0) {
            e.statuses = { ...e.statuses };
            e.statuses.strength += 2;
            newMessage += " Scope Creep grows stronger! (+2 Complexity)";
        }
    });

    if (card.exhaust) {
        newExhaustPile.push(card);
        if (newPlayerStatuses.feelNoPain > 0) newMitigation += newPlayerStatuses.feelNoPain;
    } else {
        newDiscardPile.push(card);
    }

    let earnedCapital = 0;
    let earnedRelic: RelicData | undefined;

    if (newStatus === 'VICTORY') {
        // Calculate Capital
        prev.enemies.forEach(e => {
            if (e.rewards && e.rewards.capital) {
                 const min = e.rewards.capital.min;
                 const max = e.rewards.capital.max;
                 earnedCapital += Math.floor(Math.random() * (max - min + 1)) + min;
            }
        });

        // Elite/Boss Relic Logic
        const isEliteOrBoss = prev.enemies.some(e => e.type === 'elite' || e.type === 'boss');
        if (isEliteOrBoss) {
            const hasCoffee = newRelics.some(r => r.id === 'relic_coffee_drip');
            if (!hasCoffee) {
                earnedRelic = GAME_DATA.relics.coffee_drip;
                newRelics.push(earnedRelic);
            }
        }
    }

    return {
        ...prev,
        playerStats: {
            ...prev.playerStats,
            mitigation: newMitigation,
            bandwidth: newBandwidth,
            statuses: newPlayerStatuses,
            capital: prev.playerStats.capital + earnedCapital
        },
        hand: [...currentHand, ...drawnCards],
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        exhaustPile: newExhaustPile,
        enemies: newEnemies,
        status: newStatus,
        message: newMessage,
        pendingDiscard: newPendingDiscard,
        pendingSelection: newPendingSelection,
        relics: newRelics,
        lastVictoryReward: newStatus === 'VICTORY' ? { capital: earnedCapital, relic: earnedRelic } : undefined
    };
};
