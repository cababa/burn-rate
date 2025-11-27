import React, { useState } from 'react';
import { Unit } from './components/Unit';
import { Card } from './components/Card';
import { MapScreen } from './components/MapScreen';
import { GAME_DATA } from './constants';
import { CardData, GameState, EnemyIntent, MapLayer, MapNode, CharacterStats, RelicData, EntityStatus } from './types';
import { Battery, DollarSign, CheckCircle2, AlertOctagon, RefreshCw, Play, Layers, Archive, Gift, ArrowRight, Coffee, Hammer, Store, Trash2, Gem, Wrench, FastForward, Heart, Plus, Bug, Ghost, Rocket, Lock, User, Briefcase, ChevronRight, Zap, X } from 'lucide-react';

// --- Math Helpers ---

const calculateDamage = (baseDamage: number, attackerStatus: EntityStatus, defenderStatus: EntityStatus, strengthMultiplier: number = 1): number => {
    // 1. Base + Strength (Multiplied by Heavy Blade factor if present)
    let damage = baseDamage + (attackerStatus.strength * strengthMultiplier);

    // 2. Weak (Attacker has Weak) -> 0.75x
    if (attackerStatus.weak > 0) {
        damage = damage * 0.75;
    }

    // 3. Vulnerable (Defender has Vulnerable) -> 1.5x
    if (defenderStatus.vulnerable > 0) {
        damage = damage * 1.5;
    }

    // 4. Floor
    return Math.floor(damage);
};

const countCardsMatches = (cards: CardData[], matchString: string): number => {
    return cards.filter(c => c.name.includes(matchString)).length;
};

// --- Deck Helpers ---

const generateStarterDeck = (): CardData[] => {
    const deck: CardData[] = [];
    // 5 Commits
    for (let i = 0; i < 5; i++) {
        deck.push({ ...GAME_DATA.cards.cto_commit, id: `commit_${i}_${Math.random().toString(36).substr(2, 9)}` });
    }
    // 4 Rollbacks
    for (let i = 0; i < 4; i++) {
        deck.push({ ...GAME_DATA.cards.cto_rollback, id: `rollback_${i}_${Math.random().toString(36).substr(2, 9)}` });
    }
    // 1 Hotfix (Bash)
    deck.push({ ...GAME_DATA.cards.cto_hotfix, id: `hotfix_${Math.random().toString(36).substr(2, 9)}` });

    return deck;
};

const getRandomRewardCards = (count: number): CardData[] => {
    // Rarity Weights: Common 60%, Uncommon 37%, Rare 3%
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

        // Fallback if pool empty (shouldn't happen with full implementation)
        const finalPool = rarityPool.length > 0 ? rarityPool : pool;

        const randomCard = finalPool[Math.floor(Math.random() * finalPool.length)];
        rewards.push({ ...randomCard, id: `reward_${Date.now()}_${i}` });
    }
    return rewards;
};

const shuffle = (cards: CardData[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
};

const drawCards = (
    currentDraw: CardData[],
    currentDiscard: CardData[],
    count: number
): { drawn: CardData[], newDraw: CardData[], newDiscard: CardData[] } => {
    let drawn: CardData[] = [];
    let newDraw = [...currentDraw];
    let newDiscard = [...currentDiscard];

    for (let i = 0; i < count; i++) {
        if (newDraw.length === 0) {
            if (newDiscard.length === 0) break; // No cards left anywhere
            // Reshuffle discard into draw
            newDraw = shuffle(newDiscard);
            newDiscard = [];
        }
        const card = newDraw.pop();
        if (card) drawn.push(card);
    }
    return { drawn, newDraw, newDiscard };
};

const upgradeCard = (card: CardData): CardData => {
    if (card.upgraded) return card;

    // Special Logic for Refactor (True Grit): Exhaust Random -> Exhaust Targeted
    if (card.id === 'cto_refactor') {
        return {
            ...card,
            name: card.name,
            upgraded: true,
            effects: [
                { type: 'block', value: 9, target: 'self' }, // 7 -> 9
                { type: 'exhaust_targeted', value: 1, target: 'self' } // Random -> Targeted
            ],
            description: "Gain 9 Mitigation. Exhaust a card."
        };
    }

    // Simple upgrade logic: +3 to base numbers.
    const newEffects = card.effects.map(effect => {
        if (effect.type === 'damage' || effect.type === 'block') {
            return { ...effect, value: effect.value + 3 };
        }
        if (effect.type === 'apply_status' && (effect.status === 'vulnerable' || effect.status === 'weak' || effect.status === 'strength')) {
            return { ...effect, value: effect.value + 1 };
        }
        // Heavy Blade Upgrade (5x Strength)
        if (effect.strengthMultiplier && effect.strengthMultiplier === 3) {
            return { ...effect, strengthMultiplier: 5 };
        }
        // Tooling (Armaments) Upgrade: Upgrade ALL cards (1 -> 99)
        if (effect.type === 'upgrade_hand' && effect.value === 1) {
            return { ...effect, value: 99 };
        }
        return effect;
    });

    let newDesc = card.description;
    newDesc = newDesc.replace(/\d+/, (match) => {
        return (parseInt(match) + 3).toString();
    });
    // Description Hacks for Specific Cards
    if (card.id === 'cto_brute_force') newDesc = newDesc.replace('3 times', '5 times');
    if (card.id === 'cto_tooling') newDesc = newDesc.replace('a card', 'ALL cards');
    if (card.id === 'cto_refactor') newDesc = "Gain 9 Mitigation. Exhaust a card.";

    return {
        ...card,
        name: card.name + "+",
        upgraded: true,
        effects: newEffects,
        description: newDesc
    };
};

// --- Relic Helpers ---

const applyCombatStartRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let message = '';

    relics.forEach(relic => {
        if (relic.trigger === 'combat_start') {
            if (relic.effect.type === 'block') {
                newStats.mitigation += relic.effect.value;
                message = `Relic Active: ${relic.name} (+${relic.effect.value} Mitigation)`;
            }
        }
    });

    return { stats: newStats, message };
};

const applyCombatEndRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let message = '';

    relics.forEach(relic => {
        if (relic.trigger === 'combat_end') {
            if (relic.effect.type === 'heal') {
                const healAmount = relic.effect.value;
                const oldHp = newStats.hp;
                newStats.hp = Math.min(newStats.maxHp, newStats.hp + healAmount);
                const actualHeal = newStats.hp - oldHp;
                if (actualHeal > 0) {
                    message = `${relic.name}: Recovered ${actualHeal} Runway.`;
                }
            }
        }
    });

    return { stats: newStats, message };
};

const getTurnStartBandwidth = (relics: RelicData[]): number => {
    let bandwidth = 3; // Base
    relics.forEach(relic => {
        if (relic.trigger === 'turn_start' && relic.effect.type === 'bandwidth') {
            bandwidth += relic.effect.value;
        }
    });
    return bandwidth;
}

// --- Map Generation ---

const generateMap = (): MapLayer[] => {
    const floor1: MapNode[] = [
        { id: 'f1_l', type: 'problem', floor: 1, lane: 0, locked: false, completed: false },
        { id: 'f1_r', type: 'problem', floor: 1, lane: 1, locked: false, completed: false }
    ];
    const floor2: MapNode[] = [
        { id: 'f2_l', type: 'problem', floor: 2, lane: 0, locked: false, completed: false },
        { id: 'f2_r', type: 'retrospective', floor: 2, lane: 1, locked: false, completed: false }
    ];
    const floor3: MapNode[] = [
        { id: 'f3_vendor', type: 'vendor', floor: 3, lane: 0, locked: false, completed: false },
        { id: 'f3_elite', type: 'milestone', floor: 3, lane: 1, locked: false, completed: false }
    ];
    const floor4: MapNode[] = [
        { id: 'f4_l', type: 'problem', floor: 4, lane: 0, locked: false, completed: false },
        { id: 'f4_r', type: 'problem', floor: 4, lane: 1, locked: false, completed: false }
    ];
    const floor5: MapNode[] = [
        { id: 'f5_boss', type: 'boss', floor: 5, lane: 0, locked: false, completed: false }
    ];

    return [floor1, floor2, floor3, floor4, floor5];
};

const App: React.FC = () => {
    // --- Game State Initialization ---

    const [gameState, setGameState] = useState<GameState>({
        playerStats: GAME_DATA.character.stats, // Placeholder until start
        enemy: null,
        hand: [],
        drawPile: [],
        discardPile: [],
        exhaustPile: [],
        relics: [],
        turn: 0,
        floor: 0,
        status: 'MENU', // Start at Menu
        rewardOptions: [],
        message: "",
        map: [],
        currentMapPosition: null,
        vendorStock: [],
        pendingDiscard: 0
    });

    const [viewingDeckForUpgrade, setViewingDeckForUpgrade] = useState(false);
    const [showDevPanel, setShowDevPanel] = useState(false);

    // --- START GAME LOGIC ---

    const handleStartRun = (characterId: string) => {
        if (characterId !== 'cto') return; // Only CTO implemented for now

        const initialDeck = shuffle(generateStarterDeck());
        // Initial Relics
        const initialRelics = [GAME_DATA.relics.git_repository];
        const initialStats = { ...GAME_DATA.character.stats };

        setGameState({
            playerStats: initialStats,
            enemy: null,
            hand: [],
            drawPile: initialDeck,
            discardPile: [],
            exhaustPile: [],
            relics: initialRelics,
            turn: 0,
            floor: 1,
            status: 'MAP', // Go straight to map
            rewardOptions: [],
            message: 'Sprint 1 Planning...',
            map: generateMap(),
            currentMapPosition: null,
            lastVictoryReward: undefined,
            pendingDiscard: 0
        });
    };

    // --- DEV MODE ACTIONS ---
    const devKillEnemy = () => {
        if (gameState.status !== 'PLAYING' || !gameState.enemy) return;

        let earnedCapital = 50;
        let earnedRelic: RelicData | undefined;

        const isElite = gameState.enemy.id === 'enemy_scope_creep' || gameState.map.flat().find(n => n.id === gameState.currentMapPosition?.nodeId)?.type === 'milestone';
        if (isElite) {
            earnedRelic = GAME_DATA.relics.coffee_drip;
        }

        setGameState(prev => {
            const nextRelics = earnedRelic ? [...prev.relics, earnedRelic] : prev.relics;

            let nextStats = { ...prev.playerStats, capital: prev.playerStats.capital + earnedCapital };
            // Apply combat end relics (Heal)
            const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(nextStats, nextRelics);

            return {
                ...prev,
                enemy: prev.enemy ? { ...prev.enemy, hp: 0 } : null,
                status: 'VICTORY',
                message: `DEV: Force Kill Executed. ${relicMsg}`,
                playerStats: afterRelicStats,
                lastVictoryReward: { capital: earnedCapital, relic: earnedRelic },
                relics: nextRelics
            };
        });
    };

    const devSkipFloor = () => {
        setGameState(prev => ({
            ...prev,
            status: 'MAP',
            currentMapPosition: { floor: prev.floor, nodeId: 'dev_skip' },
            message: `DEV: Warped past Sprint ${prev.floor}.`
        }));
    };

    const devFullHeal = () => {
        setGameState(prev => ({
            ...prev,
            playerStats: { ...prev.playerStats, hp: prev.playerStats.maxHp },
            message: 'DEV: Health restored.'
        }));
    };

    const devAddCash = () => {
        setGameState(prev => ({
            ...prev,
            playerStats: { ...prev.playerStats, capital: prev.playerStats.capital + 100 },
            message: 'DEV: Funding secured.'
        }));
    };

    const endTurn = () => {
        if (gameState.status !== 'PLAYING') return;

        setGameState(prev => {
            let newHand = [...prev.hand];
            let newDiscardPile = [...prev.discardPile];
            let newExhaustPile = [...prev.exhaustPile];
            let newPlayerStats = { ...prev.playerStats };
            let newMessage = "End of Turn.";

            // 1. Handle Ethereal (Exhaust) and Burnout (Damage)
            const retainedHand: CardData[] = [];

            newHand.forEach(card => {
                // Burnout Logic
                if (card.effects?.some(e => e.type === 'lose_hp_turn_end')) {
                    const burnDamage = card.effects.find(e => e.type === 'lose_hp_turn_end')?.value || 0;
                    newPlayerStats.hp = Math.max(0, newPlayerStats.hp - burnDamage);
                    newMessage += ` Burnout: -${burnDamage} Runway.`;

                    // Antifragile Trigger
                    if (newPlayerStats.statuses.antifragile > 0) {
                        newPlayerStats.statuses.strength += newPlayerStats.statuses.antifragile;
                        newMessage += ` (Antifragile: +${newPlayerStats.statuses.antifragile} STR)`;
                    }
                }

                if (card.ethereal) {
                    newExhaustPile.push(card);
                    newMessage += ` ${card.name} faded away.`;
                    // Feel No Pain Trigger
                    if (newPlayerStats.statuses.feelNoPain > 0) {
                        newPlayerStats.mitigation += newPlayerStats.statuses.feelNoPain;
                    }
                } else if (card.retain) {
                    retainedHand.push(card);
                } else {
                    newDiscardPile.push(card);
                }
            });

            // 2. Metallicize
            if (newPlayerStats.statuses.metallicize > 0) {
                newPlayerStats.mitigation += newPlayerStats.statuses.metallicize;
                newMessage += ` (Caching: +${newPlayerStats.statuses.metallicize} Block)`;
            }

            // 3. Reset Block (unless Barricade - not implemented yet)
            // newPlayerStats.mitigation = 0; // Wait, block expires at START of next turn usually? Or end? StS is Start of next.
            // Actually StS block expires at start of your turn. But here we clear it now for simplicity or keep it?
            // Let's clear it at Start of Player Turn to allow enemy to attack into it.

            return {
                ...prev,
                hand: retainedHand, // Only retained cards stay
                discardPile: newDiscardPile,
                exhaustPile: newExhaustPile,
                playerStats: newPlayerStats,
                status: 'ENEMY_TURN',
                message: newMessage,
                turn: prev.turn // Turn number increments at start of player turn
            };
        });

        // Trigger Enemy Turn after short delay
        setTimeout(processEnemyTurn, 1000);
    };
    const devDrawCards = () => {
        setGameState(prev => {
            const { drawn, newDraw, newDiscard } = drawCards(prev.drawPile, prev.discardPile, 5);
            return {
                ...prev,
                hand: [...prev.hand, ...drawn],
                drawPile: newDraw,
                discardPile: newDiscard,
                message: 'DEV: Cards drawn.'
            };
        });
    };

    // --- Interaction Logic ---

    const handleDragStart = (e: React.DragEvent, card: CardData) => {
        // Determine if playable
        let isPlayable = !card.unplayable;

        // Check if we are in a special mode
        if (gameState.status === 'PLAYING') {
            // Cost Check (Support X Cost which is -1)
            const costToPay = card.cost === -1 ? gameState.playerStats.bandwidth : card.cost;
            if (gameState.playerStats.bandwidth < costToPay) isPlayable = false;

            // Special Condition: Only Attacks in Hand (Ship It / Clash)
            if (card.playCondition === 'only_attacks_in_hand') {
                const hasNonAttack = gameState.hand.some(c => c.id !== card.id && c.type !== 'attack');
                if (hasNonAttack) isPlayable = false;
            }
        } else {
            // Prevent dragging if not in PLAYING mode
            isPlayable = false;
        }

        if (!isPlayable) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData('cardId', card.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleEnemyDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (gameState.status !== 'PLAYING' || !gameState.enemy) return;
        const cardId = e.dataTransfer.getData('cardId');
        const card = gameState.hand.find(c => c.id === cardId);
        if (card && card.type === 'attack') playCard(card, 'enemy');
    };

    const handlePlayerDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (gameState.status !== 'PLAYING') return;
        const cardId = e.dataTransfer.getData('cardId');
        const card = gameState.hand.find(c => c.id === cardId);
        if (card && (card.type === 'skill' || card.type === 'power')) playCard(card, 'self');
    };

    // Manual Card Click Handler (For Discard Mode / Selection Mode)
    const handleCardClick = (card: CardData) => {
        if (gameState.status === 'DISCARD_SELECTION' && gameState.pendingDiscard > 0) {
            handleCardDiscard(card);
        } else if (gameState.status === 'CARD_SELECTION' && gameState.pendingSelection?.context === 'hand') {
            handleCardSelection(card);
        }
    };

    // Generic Handler for selection actions (Hand or Discard Pile)
    const handleCardSelection = (card: CardData) => {
        setGameState(prev => {
            if (!prev.pendingSelection) return prev;

            let newHand = [...prev.hand];
            let newDiscardPile = [...prev.discardPile];
            let newDrawPile = [...prev.drawPile];
            let newExhaustPile = [...prev.exhaustPile];
            let newMessage = prev.message;
            let newMitigation = prev.playerStats.mitigation;

            if (prev.pendingSelection.action === 'upgrade') {
                // Upgrade the selected card
                if (prev.pendingSelection.context === 'hand') {
                    newHand = newHand.map(c => c.id === card.id ? upgradeCard(c) : c);
                }
                newMessage = `Upgraded ${card.name}.`;

            } else if (prev.pendingSelection.action === 'move_to_draw_pile') {
                // Move from Discard to Top of Draw
                newDiscardPile = newDiscardPile.filter(c => c.id !== card.id);
                newDrawPile.push(card);
                newMessage = `Placed ${card.name} on top of Draw Pile.`;
            } else if (prev.pendingSelection.action === 'exhaust') {
                // Exhaust the selected card
                if (prev.pendingSelection.context === 'hand') {
                    newHand = newHand.filter(c => c.id !== card.id);
                    newExhaustPile.push(card);
                    if (prev.playerStats.statuses.feelNoPain > 0) {
                        newMitigation += prev.playerStats.statuses.feelNoPain;
                    }
                    newMessage = `Exhausted ${card.name}.`;
                }
            }

            // Decrease Count
            const newCount = prev.pendingSelection.count - 1;
            let newStatus = prev.status;
            let newPendingSelection = { ...prev.pendingSelection, count: newCount };

            if (newCount <= 0) {
                newStatus = 'PLAYING';
                newPendingSelection = undefined as any; // Clear it
            } else {
                newMessage += ` Select ${newCount} more.`;
            }

            return {
                ...prev,
                hand: newHand,
                discardPile: newDiscardPile,
                drawPile: newDrawPile,
                exhaustPile: newExhaustPile,
                playerStats: { ...prev.playerStats, mitigation: newMitigation },
                status: newStatus,
                pendingSelection: newPendingSelection,
                message: newMessage
            };
        });
    };

    const handleCardDiscard = (card: CardData) => {
        setGameState(prev => {
            if (!prev.pendingDiscard || prev.pendingDiscard <= 0) return prev;

            const newHand = prev.hand.filter(c => c.id !== card.id);
            const newDiscard = [...prev.discardPile, card];
            const remainingDiscards = prev.pendingDiscard - 1;

            let newMessage = prev.message;
            let newStatus = prev.status;

            if (remainingDiscards === 0) {
                newMessage = "Discard complete.";
                newStatus = 'PLAYING';
            } else {
                newMessage = `Select ${remainingDiscards} more card(s) to discard.`;
            }

            return {
                ...prev,
                hand: newHand,
                discardPile: newDiscard,
                pendingDiscard: remainingDiscards,
                status: newStatus, // Go back to playing if done, else stay in selection
                message: newMessage
            };
        });
    };

    const playCard = (card: CardData, target: 'enemy' | 'self') => {
        const costPaid = card.cost === -1 ? gameState.playerStats.bandwidth : card.cost;

        if (gameState.playerStats.bandwidth < costPaid) {
            setGameState(prev => ({ ...prev, message: "Not enough Bandwidth to deploy component." }));
            return;
        }

        setGameState(prev => {
            let newEnemy = prev.enemy ? { ...prev.enemy } : null;
            let newMessage = `Deployed ${card.name}.`;
            let newStatus = prev.status;
            let newMitigation = prev.playerStats.mitigation;
            let newPlayerStatuses = { ...prev.playerStats.statuses };
            let newBandwidth = prev.playerStats.bandwidth - costPaid;
            let newPendingDiscard = 0;
            let newPendingSelection = prev.pendingSelection;

            let drawnCards: CardData[] = [];
            let newDrawPile = [...prev.drawPile];
            let newDiscardPile = [...prev.discardPile];
            let newExhaustPile = [...prev.exhaustPile];
            let currentHand = [...prev.hand.filter(c => c.id !== card.id)];

            // Helper for Repeat Effects (X Cost or Twin Strike)
            const executeEffect = (effect: any, loops: number = 1) => {
                for (let i = 0; i < loops; i++) {
                    if (effect.type === 'damage') {
                        // Determine target (support ALL enemies)
                        const targets = effect.target === 'all_enemies' && newEnemy ? [newEnemy] : (target === 'enemy' && newEnemy ? [newEnemy] : []);

                        targets.forEach(t => {
                            let finalDamage = calculateDamage(
                                effect.value,
                                prev.playerStats.statuses,
                                t.statuses,
                                effect.strengthMultiplier || 1
                            );

                            if (t.statuses.vulnerable > 0) newMessage += " (Vuln!)";
                            if (prev.playerStats.statuses.weak > 0) newMessage += " (Weak...)";

                            const newHp = Math.max(0, t.hp - finalDamage);
                            t.hp = newHp;
                            newMessage += ` Dealt ${finalDamage} execution.`;
                        });

                        if (newEnemy && newEnemy.hp <= 0) {
                            newStatus = 'VICTORY';
                            newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                        }
                    } else if (effect.type === 'damage_scale_mitigation' && newEnemy) {
                        // Body Slam logic: Damage = Block
                        const dmg = newMitigation;
                        let finalDamage = calculateDamage(dmg, prev.playerStats.statuses, newEnemy.statuses);
                        newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                        newMessage += ` Dealt ${finalDamage} (based on ${newMitigation} block).`;
                        if (newEnemy.hp <= 0) { newStatus = 'VICTORY'; newMessage = "PROBLEM SOLVED."; }
                    } else if (effect.type === 'damage_scale_matches' && newEnemy && effect.matchString) {
                        // Perfected Strike Logic
                        const matchCount = countCardsMatches([...newDrawPile, ...newDiscardPile, ...currentHand], effect.matchString);
                        const dmg = effect.value + (2 * matchCount); // Base + 2 per match
                        let finalDamage = calculateDamage(dmg, prev.playerStats.statuses, newEnemy.statuses);
                        newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                        newMessage += ` Dealt ${finalDamage} (${matchCount} matching cards).`;
                        if (newEnemy.hp <= 0) { newStatus = 'VICTORY'; newMessage = "PROBLEM SOLVED."; }
                    } else if (effect.type === 'block') {
                        newMitigation += effect.value;
                        newMessage += ` gained ${effect.value} Mitigation.`;
                    } else if (effect.type === 'apply_status') {
                        const amount = effect.value;
                        const statusType = effect.status || 'vulnerable';
                        const targets = (effect.target === 'all_enemies' && newEnemy) ? [newEnemy] : (effect.target === 'enemy' && newEnemy ? [newEnemy] : (effect.target === 'self' ? ['self'] : []));

                        targets.forEach(t => {
                            if (t === 'self') {
                                if (statusType === 'vulnerable') newPlayerStatuses.vulnerable += amount;
                                if (statusType === 'weak') newPlayerStatuses.weak += amount;
                                if (statusType === 'strength') newPlayerStatuses.strength += amount;
                                if (statusType === 'metallicize') newPlayerStatuses.metallicize += amount;
                                if (statusType === 'evolve') newPlayerStatuses.evolve += amount;
                                if (statusType === 'feelNoPain') newPlayerStatuses.feelNoPain += amount;
                                if (statusType === 'noDraw') newPlayerStatuses.noDraw += amount;
                                if (statusType === 'thorns') newPlayerStatuses.thorns += amount;
                                if (statusType === 'antifragile') newPlayerStatuses.antifragile += amount;
                                newMessage += ` Gained ${statusType}.`;
                            } else if (typeof t === 'object') {
                                // Enemy
                                t.statuses = { ...t.statuses };
                                if (statusType === 'vulnerable') t.statuses.vulnerable += amount;
                                if (statusType === 'weak') t.statuses.weak += amount;
                                if (statusType === 'strength') t.statuses.strength += amount;
                                newMessage += ` Applied ${statusType} to enemy.`;
                            }
                        });
                    } else if (effect.type === 'draw') {
                        if (newPlayerStatuses.noDraw > 0) {
                            newMessage += ` (Draw prevented by Flow State)`;
                        } else {
                            const result = drawCards(newDrawPile, newDiscardPile, effect.value);
                            drawnCards = [...drawnCards, ...result.drawn];
                            newDrawPile = result.newDraw;
                            newDiscardPile = result.newDiscard;
                            newMessage += ` Drew ${effect.value} cards.`;
                        }
                    } else if (effect.type === 'add_card' && effect.cardId) {
                        const template = Object.values(GAME_DATA.cards).find(c => c.id === effect.cardId);
                        if (template) {
                            const newCard = { ...template, id: `${effect.cardId}_${Date.now()}` };
                            // Default to discard, check if specific logic requires Draw pile (YOLO Deploy)
                            if (card.id === 'cto_yolo_deploy') {
                                newDrawPile.push(newCard);
                                newDrawPile = shuffle(newDrawPile);
                                newMessage += ` Shuffled ${template.name} into Draw Pile.`;
                            } else {
                                newDiscardPile.push(newCard);
                                newMessage += ` Added ${template.name} to discard.`;
                            }
                        }
                    } else if (effect.type === 'add_copy') {
                        const copy = { ...card, id: `${card.id}_copy_${Date.now()}` };
                        newDiscardPile.push(copy);
                        newMessage += ` Copied to discard.`;
                    } else if (effect.type === 'discard') {
                        newPendingDiscard = effect.value;
                        newMessage += ` Select ${effect.value} cards to discard.`;
                    } else if (effect.type === 'exhaust_random') {
                        if (currentHand.length > 0) {
                            const randomIndex = Math.floor(Math.random() * currentHand.length);
                            const exhaustedCard = currentHand.splice(randomIndex, 1)[0];
                            newExhaustPile.push(exhaustedCard);
                            if (newPlayerStatuses.feelNoPain > 0) {
                                newMitigation += newPlayerStatuses.feelNoPain;
                            }
                            newMessage += ` Exhausted ${exhaustedCard.name}.`;
                        }
                    } else if (effect.type === 'exhaust_targeted') {
                        if (currentHand.length > 0) {
                            newStatus = 'CARD_SELECTION';
                            newPendingSelection = {
                                context: 'hand',
                                action: 'exhaust',
                                count: effect.value
                            };
                            newMessage += ` Select a card to exhaust.`;
                        }
                    } else if (effect.type === 'upgrade_hand') {
                        const upgradeCount = effect.value;
                        if (upgradeCount > 10) {
                            // Upgrade ALL
                            currentHand = currentHand.map(c => upgradeCard(c));
                            newMessage += ` Upgraded ALL cards in hand.`;
                        } else {
                            // Targeted Upgrade (Armaments)
                            if (currentHand.length > 0) {
                                newStatus = 'CARD_SELECTION';
                                newPendingSelection = {
                                    context: 'hand',
                                    action: 'upgrade',
                                    count: upgradeCount
                                };
                                newMessage += ` Select a card to upgrade.`;
                            } else {
                                newMessage += ` (No cards to upgrade)`;
                            }
                        }
                    } else if (effect.type === 'retrieve_discard') {
                        if (newDiscardPile.length > 0) {
                            newStatus = 'CARD_SELECTION';
                            newPendingSelection = {
                                context: 'discard_pile',
                                action: 'move_to_draw_pile',
                                count: effect.value
                            };
                            newMessage += ` Select a card to retrieve from discard.`;
                        } else {
                            newMessage += ` (Discard is empty)`;
                        }
                    } else if (effect.type === 'gain_bandwidth') {
                        newBandwidth += effect.value;
                        newMessage += ` Gained ${effect.value} Bandwidth.`;
                    } else if (effect.type === 'conditional_refund' && newEnemy) {
                        if (newEnemy.statuses.vulnerable > 0) {
                            newBandwidth += 1;
                            const result = drawCards(newDrawPile, newDiscardPile, 1);
                            drawnCards = [...drawnCards, ...result.drawn];
                            newDrawPile = result.newDraw;
                            newDiscardPile = result.newDiscard;
                            newMessage += ` (Vulnerable Bonus: +1 BW, +1 Draw)`;
                        }
                    } else if (effect.type === 'conditional_strength' && target === 'self') {
                        if (newEnemy && newEnemy.currentIntent.type === 'attack') {
                            newPlayerStatuses.strength += effect.value;
                            newMessage += ` Gained ${effect.value} Strength!`;
                        }
                    }
                }
            };

            // Apply Effects
            card.effects.forEach(effect => {
                // Check for X Cost (Cost -1) loops
                let loops = 1;
                if (card.cost === -1) {
                    loops = costPaid;
                }
                executeEffect(effect, loops);
            });

            // Elite Mechanism: Scope Creep Passive
            if (newEnemy && newEnemy.id === 'enemy_scope_creep' && card.type === 'skill' && newEnemy.hp > 0) {
                newEnemy.statuses = { ...newEnemy.statuses };
                newEnemy.statuses.strength += 2;
                newMessage += " Scope Creep grows stronger! (+2 Complexity)";
            }

            // Exhaust vs Discard Logic
            if (card.exhaust) {
                newExhaustPile.push(card);
                // Trigger Feel No Pain
                if (newPlayerStatuses.feelNoPain > 0) {
                    newMitigation += newPlayerStatuses.feelNoPain;
                    newMessage += ` (Lean Ops: +${newPlayerStatuses.feelNoPain} Blk)`;
                }
                newMessage += " (Exhausted)";
            } else {
                newDiscardPile.push(card);
            }

            // Handle On-Draw Triggers for Newly Drawn Cards (Logic + Evolve)
            let extraDraws: CardData[] = [];
            let cardsToCheck = [...drawnCards];
            let safetyCap = 0;

            while (cardsToCheck.length > 0 && safetyCap < 20) {
                const checking = cardsToCheck.shift();
                if (!checking) continue;
                safetyCap++;

                // Evolve Trigger
                if (checking.type === 'status' && newPlayerStatuses.evolve > 0 && newPlayerStatuses.noDraw === 0) {
                    const evolveResult = drawCards(newDrawPile, newDiscardPile, newPlayerStatuses.evolve);
                    extraDraws = [...extraDraws, ...evolveResult.drawn];
                    newDrawPile = evolveResult.newDraw;
                    newDiscardPile = evolveResult.newDiscard;
                    cardsToCheck = [...cardsToCheck, ...evolveResult.drawn];
                    newMessage += ` (Troubleshoot: Drew ${evolveResult.drawn.length})`;
                }

                // Context Switch (Void) Logic: Lose Bandwidth on Draw
                if (checking.effects.some(e => e.type === 'lose_bandwidth')) {
                    newBandwidth -= 1;
                    newMessage += ` ${checking.name} drained 1 Bandwidth!`;
                }
            }

            drawnCards = [...drawnCards, ...extraDraws];

            // Check Victory Rewards
            let newCapital = prev.playerStats.capital;
            let newRelics = [...prev.relics];
            let earnedRelic: RelicData | undefined;
            let earnedCapital = 0;

            let nextPlayerStats = {
                ...prev.playerStats,
                bandwidth: Math.max(0, newBandwidth),
                mitigation: newMitigation,
                capital: newCapital,
                statuses: newPlayerStatuses
            };

            if (newStatus === 'VICTORY') {
                const currentNode = prev.map.flat().find(n => n.id === prev.currentMapPosition?.nodeId);
                const isElite = currentNode?.type === 'milestone';

                if (isElite) {
                    earnedCapital = Math.floor(Math.random() * 11) + 25;
                    const hasCoffee = prev.relics.some(r => r.id === 'relic_coffee_drip');
                    if (!hasCoffee) {
                        earnedRelic = GAME_DATA.relics.coffee_drip;
                        newRelics.push(earnedRelic);
                        newMessage = `Milestone Reached! Found Relic: ${earnedRelic.name}.`;
                    }
                } else {
                    earnedCapital = Math.floor(Math.random() * 11) + 20;
                    newMessage = `Problem Solved! Earned $${earnedCapital}k Capital.`;
                }
                nextPlayerStats.capital += earnedCapital;

                const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(nextPlayerStats, newRelics);
                nextPlayerStats = afterRelicStats;
                if (relicMsg) newMessage += ` ${relicMsg}`;
            }

            if (newPendingDiscard > 0 && newStatus !== 'VICTORY') {
                newStatus = 'DISCARD_SELECTION';
            }

            return {
                ...prev,
                playerStats: nextPlayerStats,
                relics: newRelics,
                enemy: newEnemy,
                hand: [...currentHand, ...drawnCards],
                drawPile: newDrawPile,
                discardPile: newDiscardPile,
                exhaustPile: newExhaustPile,
                status: newStatus,
                message: newMessage,
                pendingDiscard: newPendingDiscard,
                pendingSelection: newPendingSelection,
                lastVictoryReward: newStatus === 'VICTORY' ? { capital: earnedCapital, relic: earnedRelic } : undefined
            };
        });
    };

    // --- Turn Management ---

    const handleEndTurn = () => {
        if (gameState.status !== 'PLAYING') return;

        let nextPlayerStatuses = { ...gameState.playerStats.statuses };
        let nextMitigation = gameState.playerStats.mitigation;
        let endTurnMessage = 'Enemy is executing intent...';

        // Status Decay
        if (nextPlayerStatuses.vulnerable > 0) nextPlayerStatuses.vulnerable--;
        if (nextPlayerStatuses.weak > 0) nextPlayerStatuses.weak--;
        if (nextPlayerStatuses.noDraw > 0) nextPlayerStatuses.noDraw = 0; // Clear NoDraw at end of turn

        // Turn End Powers
        if (nextPlayerStatuses.metallicize > 0) {
            nextMitigation += nextPlayerStatuses.metallicize;
        }

        // Handle Ethereal Cards (Exhaust them) & Retain Cards
        const cardsToDiscard: CardData[] = [];
        const cardsToExhaust: CardData[] = [];
        const cardsToRetain: CardData[] = [];

        gameState.hand.forEach(card => {
            if (card.ethereal) {
                cardsToExhaust.push(card);
            } else if (card.retain) {
                cardsToRetain.push(card);
            } else {
                cardsToDiscard.push(card);
            }
        });

        if (cardsToExhaust.length > 0) {
            endTurnMessage += ` ${cardsToExhaust.length} card(s) faded away.`;
            if (nextPlayerStatuses.feelNoPain > 0) {
                nextMitigation += (nextPlayerStatuses.feelNoPain * cardsToExhaust.length);
            }
        }

        if (cardsToRetain.length > 0) {
            endTurnMessage += ` Retained ${cardsToRetain.length} card(s).`;
        }

        setGameState(prev => ({
            ...prev,
            playerStats: { ...prev.playerStats, statuses: nextPlayerStatuses, mitigation: nextMitigation },
            discardPile: [...prev.discardPile, ...cardsToDiscard],
            exhaustPile: [...prev.exhaustPile, ...cardsToExhaust],
            hand: cardsToRetain, // Keep retained cards in hand
            status: 'ENEMY_TURN',
            message: endTurnMessage
        }));

        setTimeout(processEnemyTurn, 1000);
    };

    const processEnemyTurn = () => {
        setGameState(prev => {
            if (!prev.enemy) return prev;
            if (prev.status === 'VICTORY') return prev;

            let newPlayerHp = prev.playerStats.hp;
            let newMitigation = prev.playerStats.mitigation;
            let newPlayerStatuses = { ...prev.playerStats.statuses };

            let newEnemyHp = prev.enemy.hp;
            const newEnemyStatuses = { ...prev.enemy.statuses };
            let newMessage = '';

            const intent = prev.enemy.currentIntent;

            if (intent.type === 'attack') {
                const damage = calculateDamage(intent.value, newEnemyStatuses, newPlayerStatuses);

                let unblockedDamage = damage;

                // Thorns Check
                if (newPlayerStatuses.thorns > 0) {
                    newEnemyHp -= newPlayerStatuses.thorns;
                    newMessage += ` Thorns dealt ${newPlayerStatuses.thorns} Dmg.`;
                }

                if (newMitigation > 0) {
                    const blocked = Math.min(newMitigation, unblockedDamage);
                    newMitigation -= blocked;
                    unblockedDamage -= blocked;
                }
                newPlayerHp -= unblockedDamage;
                newMessage = `Enemy caused ${unblockedDamage} Burn (Runway Loss).`;
            } else if (intent.type === 'buff') {
                newEnemyStatuses.growth += intent.value;
                newMessage = `Enemy Complexity is growing (${intent.value} per turn).`;
            } else if (intent.type === 'debuff') {
                newPlayerStatuses.weak += intent.value;
                newMessage = `Enemy caused LAG! Applied ${intent.value} Weak.`;
            }

            if (newEnemyStatuses.vulnerable > 0) newEnemyStatuses.vulnerable--;
            if (newEnemyStatuses.weak > 0) newEnemyStatuses.weak--;
            if (newEnemyStatuses.growth > 0) newEnemyStatuses.strength += newEnemyStatuses.growth;

            let newStatus: GameState['status'] = 'PLAYING';
            if (newPlayerHp <= 0) {
                newStatus = 'GAME_OVER';
                newMessage = "RUNWAY DEPLETED. STARTUP FAILED.";
            }

            // Check for Enemy Death during enemy turn (e.g. Thorns)
            let earnedCapital = 0;
            let earnedRelic: RelicData | undefined;
            let newRelics = [...prev.relics];

            if (newEnemyHp <= 0 && newStatus !== 'GAME_OVER') {
                newStatus = 'VICTORY';
                newMessage = "PROBLEM SOLVED. THORN DEFENSE SUCCESSFUL.";

                // Copied reward logic from playCard
                const currentNode = prev.map.flat().find(n => n.id === prev.currentMapPosition?.nodeId);
                const isElite = currentNode?.type === 'milestone';

                if (isElite) {
                    earnedCapital = Math.floor(Math.random() * 11) + 25;
                    const hasCoffee = prev.relics.some(r => r.id === 'relic_coffee_drip');
                    if (!hasCoffee) {
                        earnedRelic = GAME_DATA.relics.coffee_drip;
                        newRelics.push(earnedRelic);
                        newMessage += ` Milestone Reached! Found Relic: ${earnedRelic.name}.`;
                    }
                } else {
                    earnedCapital = Math.floor(Math.random() * 11) + 20;
                    newMessage += ` Problem Solved! Earned $${earnedCapital}k Capital.`;
                }
            }

            // Start of Player Turn Powers
            // (None currently active at start of turn except Relics handled elsewhere)

            let nextIntent: EnemyIntent = prev.enemy.currentIntent;
            const nextTurn = prev.turn + 1;

            // AI Logic - Only calc if alive
            if (newEnemyHp > 0) {
                if (prev.enemy.id === 'enemy_legacy_code') {
                    if (nextTurn === 1) {
                        nextIntent = { type: 'buff', value: 3, icon: 'buff', description: 'Spaghetti Code' };
                    } else {
                        const currentStrength = newEnemyStatuses.strength;
                        const incomingDmg = 6 + currentStrength;
                        nextIntent = { type: 'attack', value: 6, icon: 'attack', description: `${incomingDmg} System Crash` };
                    }
                } else if (prev.enemy.id === 'boss_the_pivot') {
                    nextIntent = { type: 'attack', value: 15, icon: 'attack', description: "Market Shift" };
                } else if (prev.enemy.id === 'enemy_scope_creep') {
                    const baseDmg = 14;
                    nextIntent = { type: 'attack', value: 14, icon: 'attack', description: `${baseDmg} Feature Bloat` };
                } else if (prev.enemy.id === 'enemy_simple_bug') {
                    if (nextTurn % 2 === 0) {
                        nextIntent = { type: 'debuff', value: 2, icon: 'debuff', description: "Lag Spike (Weak)" };
                    } else {
                        nextIntent = { type: 'attack', value: 12, icon: 'attack', description: "12 Burn" };
                    }
                } else {
                    if (intent.type === 'attack') {
                        nextIntent = { type: 'buff', value: 6, icon: 'buff', description: "Increase Complexity" };
                    } else {
                        nextIntent = { type: 'attack', value: 12, icon: 'attack', description: "12 Burn" };
                    }
                }
            }

            const nextBandwidth = getTurnStartBandwidth(prev.relics);

            let nextPlayerStats = {
                ...prev.playerStats,
                hp: Math.max(0, newPlayerHp),
                mitigation: 0,
                bandwidth: nextBandwidth,
                statuses: { ...newPlayerStatuses, thorns: 0 } // Reset Thorns at start of player turn
            };

            if (newStatus === 'VICTORY') {
                nextPlayerStats.capital += earnedCapital;
                // Apply combat end relics (Heal)
                const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(nextPlayerStats, newRelics);
                nextPlayerStats = afterRelicStats;
                if (relicMsg) newMessage += ` ${relicMsg}`;
            }

            let nextState = {
                ...prev,
                playerStats: nextPlayerStats,
                relics: newRelics,
                enemy: {
                    ...prev.enemy,
                    hp: newEnemyHp,
                    currentIntent: nextIntent,
                    statuses: newEnemyStatuses
                },
                turn: nextTurn,
                status: newStatus,
                message: newMessage,
                lastVictoryReward: newStatus === 'VICTORY' ? { capital: earnedCapital, relic: earnedRelic } : undefined
            };

            if (newStatus === 'PLAYING') {
                const { drawn, newDraw, newDiscard } = drawCards(prev.drawPile, prev.discardPile, 5);
                nextState.hand = [...prev.hand, ...drawn]; // Append drawn cards to retained cards
                nextState.drawPile = newDraw;
                nextState.discardPile = newDiscard;

                let extraDraws: CardData[] = [];
                let cardsToCheck = [...drawn];
                let safety = 0;
                let currentNewDraw = newDraw;
                let currentNewDiscard = newDiscard;

                while (cardsToCheck.length > 0 && safety < 10) {
                    const c = cardsToCheck.shift();
                    if (!c) continue;

                    // Legacy Code
                    if (c.effects.some(e => e.type === 'lose_bandwidth' && c.unplayable)) {
                        nextState.playerStats.bandwidth = Math.max(0, nextState.playerStats.bandwidth - 1);
                        nextState.message = `${nextState.message} (Legacy Code drained 1 Bandwidth!)`;
                    }

                    // Evolve
                    if (c.type === 'status' && nextState.playerStats.statuses.evolve > 0 && nextState.playerStats.statuses.noDraw === 0) {
                        safety++;
                        const evolveResult = drawCards(currentNewDraw, currentNewDiscard, nextState.playerStats.statuses.evolve);
                        extraDraws = [...extraDraws, ...evolveResult.drawn];
                        currentNewDraw = evolveResult.newDraw;
                        currentNewDiscard = evolveResult.newDiscard;
                        cardsToCheck = [...cardsToCheck, ...evolveResult.drawn];
                    }
                }

                nextState.hand = [...nextState.hand, ...extraDraws];
                nextState.drawPile = currentNewDraw;
                nextState.discardPile = currentNewDiscard;
            }

            return nextState;
        });
    };

    // --- Transition Logic ---

    const handleVictoryProceed = () => {
        setGameState(prev => ({
            ...prev,
            status: 'REWARD_SELECTION',
            rewardOptions: getRandomRewardCards(3),
            message: "Select a component to add to your stack.",
            lastVictoryReward: undefined
        }));
    };

    const handleSelectReward = (card: CardData | null) => {
        setGameState(prev => {
            // Gather all cards
            let allCards = [...prev.drawPile, ...prev.discardPile, ...prev.hand, ...prev.exhaustPile];

            // Remove Status cards before returning to Map
            allCards = allCards.filter(c => c.type !== 'status');

            if (card) allCards.push(card);

            const newDeck = shuffle(allCards);
            const newDrawPile = newDeck;

            let newMap = [...prev.map];
            if (prev.currentMapPosition) {
                const { floor, nodeId } = prev.currentMapPosition;
                newMap[floor - 1] = newMap[floor - 1].map(n =>
                    n.id === nodeId ? { ...n, completed: true } : n
                );
            }

            return {
                ...prev,
                status: 'MAP',
                hand: [],
                discardPile: [],
                exhaustPile: [], // Reset exhaust on combat end
                drawPile: newDrawPile,
                rewardOptions: [],
                map: newMap,
                message: "Check the roadmap for next steps.",
                enemy: null
            };
        });
    };

    const handleNodeSelect = (node: MapNode) => {
        setGameState(prev => {
            let newState = {
                ...prev,
                currentMapPosition: { floor: node.floor, nodeId: node.id },
                floor: node.floor,
            };

            if (node.type === 'retrospective') {
                return { ...newState, status: 'RETROSPECTIVE', message: 'Sprint Retrospective: Optimize or Recover?' };
            }
            if (node.type === 'vendor') {
                const stock = getRandomRewardCards(3);
                return { ...newState, status: 'VENDOR', vendorStock: stock, message: 'Vendor: Acquire new assets.' };
            }

            let enemyData = GAME_DATA.enemies.simple_bug;
            const floorScaling = (node.floor - 1) * 10;

            if (node.type === 'boss') {
                enemyData = GAME_DATA.enemies.boss_the_pivot;
            } else if (node.type === 'milestone') {
                enemyData = GAME_DATA.enemies.scope_creep;
            } else if (node.floor === 4) {
                enemyData = GAME_DATA.enemies.legacy_code;
            }

            const nextEnemy = {
                ...enemyData,
                hp: enemyData.hp + floorScaling,
                maxHp: enemyData.maxHp + floorScaling,
                statuses: { ...enemyData.statuses },
                currentIntent: { ...enemyData.currentIntent }
            };

            const deck = shuffle([...prev.drawPile]);
            const hand = deck.slice(0, 5);
            const draw = deck.slice(5);

            const { stats: combatStats, message: relicMessage } = applyCombatStartRelics(
                { ...prev.playerStats, bandwidth: 3, mitigation: 0, statuses: { vulnerable: 0, weak: 0, strength: 0, metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0, thorns: 0, antifragile: 0 } },
                prev.relics
            );

            combatStats.bandwidth = getTurnStartBandwidth(prev.relics);

            return {
                ...newState,
                status: 'PLAYING',
                enemy: nextEnemy,
                turn: 1,
                hand: hand,
                drawPile: draw,
                discardPile: [],
                exhaustPile: [],
                playerStats: combatStats,
                message: relicMessage || `Sprint ${node.floor} Started: ${nextEnemy.name}`
            };
        });
    };

    // --- Retrospective Actions ---

    const handleRetrospectiveAction = (action: 'heal' | 'upgrade') => {
        if (action === 'heal') {
            setGameState(prev => {
                const healAmount = Math.floor(prev.playerStats.maxHp * 0.3);
                const newHp = Math.min(prev.playerStats.maxHp, prev.playerStats.hp + healAmount);
                return {
                    ...prev,
                    playerStats: { ...prev.playerStats, hp: newHp },
                    status: 'MAP',
                    message: `Team Retreat successful. Recovered ${healAmount} Runway.`
                };
            });
        } else {
            setViewingDeckForUpgrade(true);
        }
    };

    const handleConfirmUpgrade = (card: CardData) => {
        setGameState(prev => {
            const newDeck = prev.drawPile.map(c => c.id === card.id ? upgradeCard(c) : c);

            let newMap = [...prev.map];
            if (prev.currentMapPosition) {
                const { floor, nodeId } = prev.currentMapPosition;
                newMap[floor - 1] = newMap[floor - 1].map(n => n.id === nodeId ? { ...n, completed: true } : n);
            }

            return {
                ...prev,
                drawPile: newDeck,
                status: 'MAP',
                message: `Optimized ${card.name}. Efficiency increased.`
            };
        });
        setViewingDeckForUpgrade(false);
    };

    // --- Vendor Actions ---

    const handleBuyCard = (card: CardData, price: number) => {
        if (gameState.playerStats.capital < price) return;

        setGameState(prev => ({
            ...prev,
            playerStats: { ...prev.playerStats, capital: prev.playerStats.capital - price },
            drawPile: [...prev.drawPile, card],
            vendorStock: prev.vendorStock?.filter(c => c.id !== card.id),
            message: `Acquired ${card.name} for $${price}k.`
        }));
    };

    const handleRemoveCardService = (price: number) => {
        if (gameState.playerStats.capital < price) return;

        setGameState(prev => {
            const indexToRemove = prev.drawPile.findIndex(c => c.name === 'Commit');
            if (indexToRemove === -1) return { ...prev, message: "No basic Commit cards found to remove." };

            const newDeck = [...prev.drawPile];
            newDeck.splice(indexToRemove, 1);

            return {
                ...prev,
                playerStats: { ...prev.playerStats, capital: prev.playerStats.capital - price },
                drawPile: newDeck,
                message: "Removed 1 'Commit' (Technical Debt) from codebase."
            };
        });
    };

    const handleLeaveNode = () => {
        setGameState(prev => {
            let newMap = [...prev.map];
            if (prev.currentMapPosition) {
                const { floor, nodeId } = prev.currentMapPosition;
                newMap[floor - 1] = newMap[floor - 1].map(n => n.id === nodeId ? { ...n, completed: true } : n);
            }
            return { ...prev, status: 'MAP' };
        });
    };

    const handleRestart = () => {
        setGameState({
            playerStats: GAME_DATA.character.stats,
            enemy: null,
            hand: [],
            drawPile: [],
            discardPile: [],
            exhaustPile: [],
            relics: [],
            turn: 0,
            floor: 0,
            status: 'MENU',
            rewardOptions: [],
            message: "",
            map: [],
            currentMapPosition: null,
            pendingDiscard: 0
        });
        setViewingDeckForUpgrade(false);
    };

    const getBandwidthSegments = () => {
        const segments = [];
        const totalBandwidth = Math.max(gameState.playerStats.bandwidth, 3);
        for (let i = 0; i < totalBandwidth; i++) segments.push(i < gameState.playerStats.bandwidth);
        return segments;
    };

    // --- Render Helpers ---

    const DevConsole = () => (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {showDevPanel && (
                <div className="bg-black/95 border border-gray-700 p-4 rounded-lg shadow-2xl flex flex-col gap-2 min-w-[200px] mb-2 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500 border-b border-gray-800 pb-2 mb-1">
                        <Wrench size={12} /> DEV CONSOLE
                    </div>

                    {gameState.status === 'PLAYING' && (
                        <button onClick={devKillEnemy} className="flex items-center gap-2 text-xs font-mono bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 p-2 rounded transition text-left">
                            <Bug size={14} /> Kill Enemy (Win)
                        </button>
                    )}

                    {gameState.status === 'MAP' && (
                        <button onClick={devSkipFloor} className="flex items-center gap-2 text-xs font-mono bg-info/10 text-info border border-info/30 hover:bg-info/20 p-2 rounded transition text-left">
                            <FastForward size={14} /> Skip Map Node
                        </button>
                    )}

                    <button onClick={devFullHeal} className="flex items-center gap-2 text-xs font-mono bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 p-2 rounded transition text-left">
                        <Heart size={14} /> Full Heal
                    </button>

                    <button onClick={devAddCash} className="flex items-center gap-2 text-xs font-mono bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 p-2 rounded transition text-left">
                        <DollarSign size={14} /> + $100k Cash
                    </button>

                    <button onClick={devDrawCards} className="flex items-center gap-2 text-xs font-mono bg-white/10 text-white border border-white/30 hover:bg-white/20 p-2 rounded transition text-left">
                        <Plus size={14} /> Draw 5 Cards
                    </button>

                    <div className="text-[10px] text-gray-600 font-mono mt-2 pt-2 border-t border-gray-800">
                        Exhaust Pile: {gameState.exhaustPile.length}
                    </div>
                </div>
            )}
            <button
                onClick={() => setShowDevPanel(!showDevPanel)}
                className={`p-3 rounded-full shadow-lg border transition-all ${showDevPanel ? 'bg-primary text-black border-primary' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
            >
                <Wrench size={20} />
            </button>
        </div>
    );

    // --- MENUS ---

    if (gameState.status === 'MENU') {
        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#000000] flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3')] bg-cover bg-center opacity-10"></div>

                <div className="z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-4 bg-primary/10 rounded-full border border-primary/30 mb-4 shadow-[0_0_30px_rgba(0,255,136,0.3)]">
                            <Rocket size={48} className="text-primary" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 text-center">
                            BURN RATE: THE UNICORN RUN
                        </h1>
                        <p className="font-mono text-gray-400 mt-2 tracking-widest uppercase text-sm">Pre-Alpha Build v0.14</p>
                    </div>

                    <p className="max-w-md text-center text-gray-300 font-sans leading-relaxed">
                        A roguelite deckbuilder where your health is your runway. Survive the market, defeat technical debt, and reach the IPO.
                    </p>

                    <button
                        onClick={() => setGameState(prev => ({ ...prev, status: 'CHARACTER_SELECT' }))}
                        className="group relative px-8 py-4 bg-primary text-black font-bold font-mono text-lg uppercase tracking-wider rounded-sm hover:bg-white hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(0,255,136,0.4)]"
                    >
                        Initialize Startup
                        <div className="absolute inset-0 border-2 border-white/20 rounded-sm scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
                    </button>
                </div>
            </div>
        );
    }

    if (gameState.status === 'CHARACTER_SELECT') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-white relative">
                <div className="absolute top-8 left-8">
                    <button onClick={() => setGameState(prev => ({ ...prev, status: 'MENU' }))} className="text-gray-500 hover:text-white font-mono text-sm">
                        &lt; Back to Menu
                    </button>
                </div>

                <h2 className="text-3xl font-display font-bold mb-12 flex items-center gap-3">
                    <User className="text-primary" /> Select Founder
                </h2>

                <div className="flex flex-wrap gap-8 justify-center">
                    {/* CTO - Available */}
                    <div className="w-72 bg-surface border-2 border-primary rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 group shadow-[0_0_30px_rgba(0,255,136,0.1)] hover:shadow-[0_0_50px_rgba(0,255,136,0.3)]">
                        <div className="h-32 bg-primary/20 flex items-center justify-center text-6xl border-b border-primary/20">
                            {GAME_DATA.character.emoji}
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-display font-bold text-white mb-1">{GAME_DATA.character.name}</h3>
                            <div className="text-primary font-mono text-xs uppercase mb-4">{GAME_DATA.character.role}</div>

                            <div className="space-y-2 mb-6 text-sm text-gray-400 font-sans">
                                <p>The builder. Focuses on scaling infrastructure and managing technical debt.</p>
                                <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-1 text-white font-mono">
                                        <Battery size={14} className="text-primary" /> {GAME_DATA.character.stats.hp}k
                                    </div>
                                    <div className="flex items-center gap-1 text-white font-mono">
                                        <Zap size={14} className="text-warning" /> {GAME_DATA.character.stats.bandwidth}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleStartRun('cto')}
                                className="w-full py-3 bg-primary text-black font-bold font-mono uppercase rounded hover:bg-white transition-colors flex items-center justify-center gap-2"
                            >
                                Select <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* CEO - Locked */}
                    <div className="w-72 bg-gray-900 border-2 border-gray-800 rounded-xl overflow-hidden opacity-60 grayscale cursor-not-allowed relative">
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                            <Lock size={48} className="text-gray-500" />
                        </div>
                        <div className="h-32 bg-gray-800 flex items-center justify-center text-6xl border-b border-gray-700">
                            👔
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-display font-bold text-gray-500 mb-1">CEO</h3>
                            <div className="text-gray-600 font-mono text-xs uppercase mb-4">The Visionary</div>
                            <div className="space-y-2 mb-6 text-sm text-gray-600 font-sans">
                                <p>Focuses on fundraising, hype generation, and market distortion.</p>
                            </div>
                            <button disabled className="w-full py-3 bg-gray-800 text-gray-600 font-bold font-mono uppercase rounded">
                                Locked
                            </button>
                        </div>
                    </div>

                    {/* COO - Locked */}
                    <div className="w-72 bg-gray-900 border-2 border-gray-800 rounded-xl overflow-hidden opacity-60 grayscale cursor-not-allowed relative">
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                            <Lock size={48} className="text-gray-500" />
                        </div>
                        <div className="h-32 bg-gray-800 flex items-center justify-center text-6xl border-b border-gray-700">
                            💼
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-display font-bold text-gray-500 mb-1">COO</h3>
                            <div className="text-gray-600 font-mono text-xs uppercase mb-4">The Scaler</div>
                            <div className="space-y-2 mb-6 text-sm text-gray-600 font-sans">
                                <p>Focuses on efficiency, hiring, and operational excellence.</p>
                            </div>
                            <button disabled className="w-full py-3 bg-gray-800 text-gray-600 font-bold font-mono uppercase rounded">
                                Locked
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAP SCREEN ---

    if (gameState.status === 'MAP') {
        return (
            <div className="min-h-screen bg-background text-white font-sans flex flex-col">
                <header className="h-14 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <h1 className="font-display font-bold text-lg">BURN RATE: THE UNICORN RUN</h1>
                        <div className="h-6 w-px bg-white/10" />
                        <span className="text-sm font-mono text-gray-400">Roadmap View</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono">
                        <span className="text-warning flex items-center gap-2">
                            <DollarSign size={16} /> ${gameState.playerStats.capital}k
                        </span>
                        <span className="text-primary flex items-center gap-2">
                            <Battery size={16} /> $ {gameState.playerStats.hp}k
                        </span>
                    </div>
                </header>
                <main className="flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#000000]">
                    <MapScreen
                        map={gameState.map}
                        currentFloor={gameState.currentMapPosition ? gameState.currentMapPosition.floor : 0}
                        onNodeSelect={handleNodeSelect}
                    />
                </main>
                <DevConsole />
            </div>
        );
    }

    // --- RETROSPECTIVE SCREEN ---
    if (gameState.status === 'RETROSPECTIVE') {
        if (viewingDeckForUpgrade) {
            return (
                <div className="min-h-screen bg-black flex flex-col p-8 items-center">
                    <h2 className="text-2xl font-bold mb-8 text-warning flex items-center gap-2"><Hammer /> Select a component to Optimize</h2>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {gameState.drawPile.map(card => (
                            <div key={card.id} onClick={() => !card.upgraded && handleConfirmUpgrade(card)} className={`cursor-pointer ${card.upgraded ? 'opacity-50' : 'hover:scale-105 transition'}`}>
                                <Card card={card} onDragStart={() => { }} disabled={card.upgraded} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setViewingDeckForUpgrade(false)} className="mt-8 text-gray-400 hover:text-white">Cancel</button>
                    <DevConsole />
                </div>
            )
        }

        return (
            <div className="min-h-screen bg-black/90 flex flex-col items-center justify-center gap-12 p-8">
                <h2 className="text-3xl font-display font-bold text-white mb-4 flex items-center gap-3">
                    <Coffee size={32} className="text-info" /> Sprint Retrospective
                </h2>
                <div className="flex gap-8">
                    {/* Heal Option */}
                    <button
                        onClick={() => handleRetrospectiveAction('heal')}
                        className="group w-64 p-6 border-2 border-gray-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center text-center gap-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Battery size={32} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white mb-1">Team Retreat</div>
                            <div className="text-sm text-gray-400">Recover 30% Runway ($ {Math.floor(gameState.playerStats.maxHp * 0.3)}k)</div>
                        </div>
                    </button>

                    {/* Upgrade Option */}
                    <button
                        onClick={() => handleRetrospectiveAction('upgrade')}
                        className="group w-64 p-6 border-2 border-gray-700 rounded-xl hover:border-warning hover:bg-warning/5 transition-all flex flex-col items-center text-center gap-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center text-warning group-hover:scale-110 transition-transform">
                            <Hammer size={32} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white mb-1">Refactor Code</div>
                            <div className="text-sm text-gray-400">Optimize (Upgrade) a card in your deck.</div>
                        </div>
                    </button>
                </div>
                <DevConsole />
            </div>
        );
    }

    // --- VENDOR SCREEN ---
    if (gameState.status === 'VENDOR') {
        const cardPrice = 50;
        const removePrice = 75;

        return (
            <div className="min-h-screen bg-black/90 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-4xl bg-surface border border-gray-800 rounded-2xl p-8 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                            <Store size={32} className="text-warning" /> Vendor
                        </h2>
                        <div className="flex items-center gap-2 text-warning font-mono text-xl font-bold bg-black/50 px-4 py-2 rounded">
                            <DollarSign /> {gameState.playerStats.capital}k
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                        {/* Cards Section */}
                        <div>
                            <h3 className="text-gray-400 font-mono text-sm uppercase tracking-wider mb-4">Acquire Assets</h3>
                            <div className="flex gap-4">
                                {gameState.vendorStock?.map(card => {
                                    const canAfford = gameState.playerStats.capital >= cardPrice;
                                    return (
                                        <div key={card.id} className="flex flex-col items-center gap-2">
                                            <Card card={card} onDragStart={() => { }} disabled={!canAfford} />
                                            <button
                                                onClick={() => handleBuyCard(card, cardPrice)}
                                                disabled={!canAfford}
                                                className={`px-3 py-1 rounded text-sm font-mono flex items-center gap-1 ${canAfford ? 'bg-primary text-black hover:bg-white' : 'bg-gray-800 text-gray-500'}`}
                                            >
                                                ${cardPrice}k
                                            </button>
                                        </div>
                                    )
                                })}
                                {gameState.vendorStock?.length === 0 && (
                                    <div className="text-gray-600 italic">Sold Out</div>
                                )}
                            </div>
                        </div>

                        {/* Services Section */}
                        <div className="border-l border-gray-800 pl-8">
                            <h3 className="text-gray-400 font-mono text-sm uppercase tracking-wider mb-4">Services</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between bg-black/40 p-4 rounded border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-danger/20 flex items-center justify-center text-danger">
                                            <Trash2 size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">Fire Incompetent Dev</div>
                                            <div className="text-xs text-gray-500">Remove a card from deck.</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveCardService(removePrice)}
                                        disabled={gameState.playerStats.capital < removePrice}
                                        className={`px-3 py-1 rounded text-sm font-mono ${gameState.playerStats.capital >= removePrice ? 'bg-danger text-white hover:bg-red-500' : 'bg-gray-800 text-gray-500'}`}
                                    >
                                        ${removePrice}k
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button onClick={handleLeaveNode} className="text-gray-400 hover:text-white flex items-center gap-2">
                            Leave Shop <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
                <DevConsole />
            </div>
        );
    }

    // --- PLAYING UI ---

    return (
        <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 overflow-hidden flex flex-col">
            <header className="h-14 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-6">
                    <h1 className="font-display font-bold text-lg tracking-tight">BURN RATE: THE UNICORN RUN</h1>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex items-center gap-2 text-sm font-mono text-gray-300">
                        <span className="text-gray-500">ACT 1</span>
                        <span>The Incubator</span>
                        <span className="text-gray-600 mx-2">|</span>
                        <span className="text-primary">SPRINT {gameState.floor}</span>
                        <span className="text-gray-600 mx-2">|</span>
                        <span className="text-gray-400">TURN {gameState.turn}</span>
                    </div>

                    {/* Relic Bar */}
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2">
                        {gameState.relics.map(relic => (
                            <div key={relic.id} className="group relative w-8 h-8 rounded border border-white/20 bg-black/40 flex items-center justify-center cursor-help hover:border-warning/50 hover:bg-warning/10 transition-colors">
                                <span className="text-lg">{relic.icon}</span>
                                {/* Tooltip */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 border border-warning rounded shadow-xl hidden group-hover:block z-50">
                                    <div className="font-bold text-warning mb-1 flex items-center gap-2">
                                        <span>{relic.name}</span>
                                        <span className="text-[10px] uppercase bg-white/10 px-1 rounded text-gray-400">{relic.rarity}</span>
                                    </div>
                                    <div className="text-xs text-white mb-2">{relic.description}</div>
                                    {relic.tooltip && (
                                        <div className="border-t border-gray-700 pt-2 mt-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{relic.tooltip.term}</div>
                                            <div className="text-[10px] text-gray-500 italic">{relic.tooltip.definition}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-mono">
                    <span className="text-warning flex items-center gap-2">
                        <DollarSign size={16} /> ${gameState.playerStats.capital}k
                    </span>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#000000]">

                <div className="w-full max-w-5xl flex justify-between items-center mb-24 px-12">

                    {/* Player Column */}
                    <div className="flex flex-col gap-4">
                        <Unit
                            name={GAME_DATA.character.name}
                            currentHp={gameState.playerStats.hp}
                            maxHp={gameState.playerStats.maxHp}
                            emoji={GAME_DATA.character.emoji}
                            description={GAME_DATA.character.role}
                            onDrop={handlePlayerDrop}
                            isTargetable={gameState.status === 'PLAYING' || gameState.status === 'DISCARD_SELECTION' || gameState.status === 'CARD_SELECTION'}
                            mitigation={gameState.playerStats.mitigation}
                            statuses={gameState.playerStats.statuses}
                        />

                        {/* Terminal Log moved here */}
                        <div className={`
                    w-full min-w-[280px] px-4 py-3 rounded-md font-mono text-xs border backdrop-blur-sm transition-all duration-300
                    ${gameState.status === 'VICTORY' ? 'bg-primary/10 border-primary text-primary' :
                                gameState.status === 'GAME_OVER' ? 'bg-danger/10 border-danger text-danger' :
                                    gameState.status === 'ENEMY_TURN' ? 'bg-warning/10 border-warning text-warning' :
                                        'bg-black/50 border-white/10 text-gray-400'}
                `}>
                            <span className="opacity-50 mr-2">{`>_`}</span>
                            {gameState.message}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 opacity-20 select-none">
                        <div className="w-px h-12 bg-white"></div>
                        <span className="font-display font-bold text-2xl">VS</span>
                        <div className="w-px h-12 bg-white"></div>
                    </div>

                    {gameState.enemy && (
                        <Unit
                            name={gameState.enemy.name}
                            currentHp={gameState.enemy.hp}
                            maxHp={gameState.enemy.maxHp}
                            emoji={gameState.enemy.emoji}
                            isEnemy
                            intent={gameState.enemy.currentIntent}
                            statuses={gameState.enemy.statuses}
                            description={gameState.enemy.description}
                            onDrop={handleEnemyDrop}
                            isTargetable={gameState.status === 'PLAYING'}
                        />
                    )}
                </div>

                {/* Modal Overlays */}

                {gameState.status === 'CARD_SELECTION' && gameState.pendingSelection?.context === 'discard_pile' && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                        <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-2">
                            <Archive className="text-primary" /> Retrieve from Discard
                        </h2>
                        <p className="text-gray-400 font-mono text-sm mb-8">{gameState.message}</p>

                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl max-h-[60vh] overflow-y-auto p-4">
                            {gameState.discardPile.map((card) => (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardSelection(card)}
                                    className="cursor-pointer hover:scale-105 transition-transform duration-150"
                                >
                                    <Card card={card} onDragStart={() => { }} disabled={false} selectable />
                                </div>
                            ))}
                            {gameState.discardPile.length === 0 && (
                                <div className="text-gray-500 italic">Discard pile is empty.</div>
                            )}
                        </div>

                        <button
                            onClick={() => setGameState(prev => ({ ...prev, status: 'PLAYING', pendingSelection: undefined, message: 'Selection cancelled.' }))}
                            className="mt-8 text-gray-400 hover:text-white font-mono text-sm flex items-center gap-2 border border-transparent hover:border-white/20 px-4 py-2 rounded transition-all"
                        >
                            <X size={14} /> Cancel
                        </button>
                    </div>
                )}

                {gameState.status === 'VICTORY' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative z-50 bg-surface border border-primary p-8 rounded-2xl flex flex-col items-center text-center max-w-md shadow-[0_0_50px_rgba(0,255,136,0.1)]">
                            <CheckCircle2 size={48} className="text-primary mb-4" />
                            <h2 className="text-3xl font-display font-bold text-white mb-2">Problem Solved</h2>
                            <p className="text-gray-400 mb-6">The bug has been fixed and deployed to production.</p>

                            {/* Rewards Summary */}
                            {gameState.lastVictoryReward && (
                                <div className="bg-black/40 p-4 rounded-lg w-full mb-6 flex flex-col gap-2">
                                    <div className="text-xs text-gray-500 font-mono uppercase tracking-widest text-left">Rewards Acquired</div>
                                    <div className="flex items-center gap-2 text-warning font-mono font-bold">
                                        <DollarSign size={16} />
                                        <span>${gameState.lastVictoryReward.capital}k Capital</span>
                                    </div>
                                    {gameState.lastVictoryReward.relic && (
                                        <div className="relative group flex items-center gap-2 text-purple-400 font-mono font-bold animate-pulse cursor-help">
                                            <Gem size={16} />
                                            <span>Relic: {gameState.lastVictoryReward.relic.name}</span>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 border border-purple-500/50 rounded shadow-2xl hidden group-hover:block z-[100] text-left pointer-events-none">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                                    <span className="text-2xl">{gameState.lastVictoryReward.relic.icon}</span>
                                                    <div>
                                                        <div className="text-purple-400 font-bold text-sm">{gameState.lastVictoryReward.relic.name}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase">{gameState.lastVictoryReward.relic.rarity} Relic</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-300 leading-relaxed font-sans font-normal opacity-100 animate-none whitespace-normal break-words">
                                                    {gameState.lastVictoryReward.relic.description}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleVictoryProceed}
                                className="bg-primary text-black font-bold py-3 px-8 rounded hover:bg-white transition-colors font-mono text-sm uppercase tracking-wider flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Next Sprint
                            </button>
                        </div>
                    </div>
                )}

                {gameState.status === 'REWARD_SELECTION' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                        <h2 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-2">
                            <Gift className="text-primary" /> Select Reward
                        </h2>

                        <div className="flex gap-6 mb-12">
                            {gameState.rewardOptions.map((card) => (
                                <div
                                    key={card.id}
                                    onClick={() => handleSelectReward(card)}
                                    className="cursor-pointer hover:scale-105 transition-transform duration-150"
                                >
                                    <Card card={card} onDragStart={() => { }} disabled={false} />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => handleSelectReward(null)}
                            className="text-gray-500 hover:text-white font-mono text-sm flex items-center gap-2 border border-transparent hover:border-white/20 px-4 py-2 rounded transition-all"
                        >
                            Skip Reward <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                {gameState.status === 'GAME_OVER' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-[#1a0a0a] border border-danger p-8 rounded-2xl flex flex-col items-center text-center max-w-md shadow-[0_0_50px_rgba(255,68,68,0.15)]">
                            <AlertOctagon size={48} className="text-danger mb-4" />
                            <h2 className="text-3xl font-display font-bold text-white mb-1">Startup Failed</h2>
                            <p className="text-danger/80 font-mono text-sm mb-6 uppercase tracking-widest">Runway Depleted</p>

                            <div className="bg-black/40 p-4 rounded w-full mb-6 border border-white/5 text-left space-y-2">
                                <div className="text-xs text-gray-500 font-mono">POSTMORTEM</div>
                                <div className="text-sm text-gray-300">You ran out of cash before finding Product-Market Fit.</div>
                                <div className="text-sm text-gray-400">Reached Sprint: {gameState.floor}</div>
                            </div>

                            <button
                                onClick={handleRestart}
                                className="bg-danger text-white font-bold py-3 px-8 rounded hover:bg-red-400 transition-colors font-mono text-sm uppercase tracking-wider flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Pivot & Retry
                            </button>
                        </div>
                    </div>
                )}

            </main>

            <footer className="h-72 border-t border-border bg-[#050505] relative flex justify-between items-end px-12 pb-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

                <div className="w-48 flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-3 text-warning mb-2">
                        <div className="relative">
                            <Battery size={48} className="stroke-1" />
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pl-1 pr-3 gap-0.5">
                                {getBandwidthSegments().map((active, i) => (
                                    <div
                                        key={i}
                                        className={`h-6 w-3 rounded-sm transition-all duration-300 ${active ? 'bg-warning shadow-[0_0_10px_rgba(255,170,0,0.5)]' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold font-mono leading-none">{gameState.playerStats.bandwidth}</span>
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Bandwidth</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end relative h-full">
                    <div className="mb-6">
                        <button
                            onClick={handleEndTurn}
                            disabled={gameState.status !== 'PLAYING'}
                            className={`
                        flex items-center gap-2 px-8 py-3 rounded-full font-mono text-sm font-bold uppercase tracking-wider shadow-xl transition-all duration-150
                        ${gameState.status === 'PLAYING'
                                    ? 'bg-primary text-black hover:bg-white hover:scale-105 active:scale-95'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'}
                    `}
                        >
                            {gameState.status === 'ENEMY_TURN' ? (
                                <>Running Exploit...</>
                            ) : (
                                <>
                                    End Sprint <Play size={14} className="fill-current" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex gap-4 items-end justify-center perspective-[1000px] min-h-[240px]">
                        {gameState.hand.map((card, index) => {
                            const isXCost = card.cost === -1;
                            const canAfford = isXCost ? gameState.playerStats.bandwidth > 0 : gameState.playerStats.bandwidth >= card.cost;

                            let isDisabled = (gameState.status !== 'PLAYING' || !canAfford);
                            if (gameState.status === 'DISCARD_SELECTION') isDisabled = false;

                            // Enable selection in Hand context
                            const isSelectionMode = gameState.status === 'CARD_SELECTION' && gameState.pendingSelection?.context === 'hand';
                            if (isSelectionMode) isDisabled = false;

                            // Specific check for Ship It!
                            if (card.playCondition === 'only_attacks_in_hand' && gameState.status === 'PLAYING') {
                                const hasNonAttack = gameState.hand.some(c => c.id !== card.id && c.type !== 'attack');
                                if (hasNonAttack) isDisabled = true;
                            }

                            return (
                                <div
                                    key={card.id}
                                    className="animate-draw-card origin-bottom-right"
                                    style={{
                                        transform: `translateY(${index % 2 === 0 ? '0px' : '4px'}) rotate(${(index - gameState.hand.length / 2) * 2}deg)`,
                                        zIndex: index,
                                        animationDelay: `${index * 30}ms`
                                    }}
                                    onClick={() => handleCardClick(card)}
                                >
                                    <Card
                                        card={card}
                                        onDragStart={handleDragStart}
                                        disabled={isDisabled && !isSelectionMode}
                                        selectable={gameState.status === 'DISCARD_SELECTION' || isSelectionMode}
                                    />
                                </div>
                            )
                        })}

                        {gameState.hand.length === 0 && gameState.status === 'PLAYING' && (
                            <div className="text-gray-600 font-mono text-sm italic mb-12">
                                No execution bandwidth remaining...
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-48 flex flex-col items-end gap-2 mb-4">
                    <div className="flex items-center gap-3 text-xs font-mono text-gray-500 group relative">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Draw Pile</span>
                        <div className="w-16 h-20 border border-gray-700 bg-gray-900 rounded flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-primary/50 transition-colors">
                            <Layers size={20} />
                            <span className="font-bold text-white text-lg">{gameState.drawPile.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-gray-500 group relative">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Discard</span>
                        <div className="w-16 h-20 border border-gray-700 bg-gray-900 rounded flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-gray-500 transition-colors">
                            <Archive size={20} />
                            <span className="font-bold text-white text-lg">{gameState.discardPile.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-gray-500 group relative">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Exhaust</span>
                        <div className="w-12 h-14 border border-gray-800 bg-black/60 rounded flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-gray-600 transition-colors">
                            <Ghost size={16} />
                            <span className="font-bold text-gray-400 text-sm">{gameState.exhaustPile.length}</span>
                        </div>
                    </div>
                </div>
            </footer>
            <DevConsole />
        </div>
    );
};

export default App;