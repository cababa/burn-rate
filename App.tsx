import React, { useState } from 'react';
import { Unit } from './components/Unit';
import { Card } from './components/Card';
import { MapScreen } from './components/MapScreen';
import { GAME_DATA, MAX_HAND_SIZE, ACT1_EVENTS } from './constants';
import { CardData, GameState, EnemyIntent, MapLayer, MapNode, CharacterStats, RelicData, EntityStatus, EnemyData, CardEffect, EventData, EventChoice, EventEffect } from './types';
import { Battery, DollarSign, CheckCircle2, AlertOctagon, RefreshCw, Play, Layers, Archive, Gift, ArrowRight, Coffee, Hammer, Store, Trash2, Gem, Wrench, FastForward, Heart, Plus, Bug, Ghost, Rocket, Lock, User, Briefcase, ChevronRight, Zap, X, HelpCircle } from 'lucide-react';
import {
    calculateDamage, countCardsMatches, generateStarterDeck, getRandomRewardCards, shuffle, drawCards, upgradeCard,
    applyCombatStartRelics, applyCombatEndRelics, getTurnStartBandwidth, generateMap, resolveCardEffect, resolveEnemyTurn, resolveEndTurn, processDrawnCards,
    getEncounterForFloor, getEliteEncounter, getBossEncounter
} from './gameLogic';

const App: React.FC = () => {
    // --- Game State Initialization ---

    const [gameState, setGameState] = useState<GameState>({
        playerStats: GAME_DATA.character.stats, // Placeholder until start
        enemies: [], // Was enemy: null
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
            deck: initialDeck, // Initialize Master Deck
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
        if (gameState.status !== 'PLAYING' || gameState.enemies.length === 0) return;

        let earnedCapital = 50;
        let earnedRelic: RelicData | undefined;

        // Check if any enemy is elite
        const isElite = gameState.enemies.some(e => e.id === 'enemy_scope_creep') || gameState.map.flat().find(n => n.id === gameState.currentMapPosition?.nodeId)?.type === 'milestone';
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
                enemies: prev.enemies.map(e => ({ ...e, hp: 0 })), // Kill all
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

    const devSpawnLegacy = () => {
        setGameState(prev => {
            const floorScaling = (prev.floor - 1) * 10;

            // Monolith: Starts with Beam (Attack)
            const monolith = { ...GAME_DATA.enemies.legacy_monolith, id: `legacy_monolith_${Date.now()}`, hp: GAME_DATA.enemies.legacy_monolith.hp + floorScaling, maxHp: GAME_DATA.enemies.legacy_monolith.maxHp + floorScaling, statuses: { ...GAME_DATA.enemies.legacy_monolith.statuses }, currentIntent: { ...GAME_DATA.enemies.legacy_monolith.currentIntent } };

            // Hack: Starts with Bolt (Debuff)
            const hack = { ...GAME_DATA.enemies.legacy_hack, id: `legacy_hack_${Date.now()}`, hp: GAME_DATA.enemies.legacy_hack.hp + floorScaling, maxHp: GAME_DATA.enemies.legacy_hack.maxHp + floorScaling, statuses: { ...GAME_DATA.enemies.legacy_hack.statuses }, currentIntent: { ...GAME_DATA.enemies.legacy_hack.currentIntent } };

            // Patch: Starts with Beam (Attack) - STAGGERED
            const patch = { ...GAME_DATA.enemies.legacy_patch, id: `legacy_patch_${Date.now()}`, hp: GAME_DATA.enemies.legacy_patch.hp + floorScaling, maxHp: GAME_DATA.enemies.legacy_patch.maxHp + floorScaling, statuses: { ...GAME_DATA.enemies.legacy_patch.statuses }, currentIntent: { type: 'attack', value: 9, icon: 'attack', description: "Beam" } };

            // Draw Initial Hand
            const combatDeck = shuffle([...prev.deck]);
            const { drawn, newDraw, newDiscard } = drawCards(combatDeck, [], 5);
            
            const startStatsWithRelics = {
                ...prev.playerStats,
                bandwidth: getTurnStartBandwidth(prev.relics),
            };
            
            const processed = processDrawnCards(drawn, [], newDiscard, newDraw, startStatsWithRelics, 'DEV: Spawned Legacy Systems.');

            return {
                ...prev,
                status: 'PLAYING',
                enemies: [hack, monolith, patch],
                message: processed.message,
                playerStats: processed.stats,
                drawPile: processed.drawPile,
                hand: processed.hand,
                discardPile: processed.discard,
                exhaustPile: []
            };
        });
    };

    const endTurn = () => {
        if (gameState.status !== 'PLAYING') return;
        setGameState(prev => resolveEndTurn(prev));
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

    const handleEnemyDrop = (e: React.DragEvent, targetEnemyId: string) => {
        e.preventDefault();
        if (gameState.status !== 'PLAYING') return;
        const cardId = e.dataTransfer.getData('cardId');
        const card = gameState.hand.find(c => c.id === cardId);
        if (card && card.type === 'attack') playCard(card, 'enemy', targetEnemyId);
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

    const playCard = (card: CardData, target: 'enemy' | 'self', targetEnemyId?: string) => {
        setGameState(prev => resolveCardEffect(prev, card, target, targetEnemyId));
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
        setGameState(prev => resolveEnemyTurn(prev));
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
            let newDeck = [...prev.deck]; // Use Master Deck
            let newMessage = "Reward skipped.";

            if (card) {
                newDeck.push(card);
                newMessage = `Added ${card.name} to deck.`;
            }

            let newMap = [...prev.map];
            if (prev.currentMapPosition) {
                const { floor, nodeId } = prev.currentMapPosition;
                newMap[floor - 1] = newMap[floor - 1].map(n =>
                    n.id === nodeId ? { ...n, completed: true } : n
                );
            }

            return {
                ...prev,
                deck: newDeck,
                map: newMap,
                status: 'MAP',
                message: newMessage,
                rewardOptions: [],
                // Reset piles for safety, though handleNodeSelect does it too
                hand: [],
                drawPile: [],
                discardPile: [],
                exhaustPile: []
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

        // Handle non-combat nodes
        if (node.type === 'retrospective') {
            return { ...newState, status: 'RETROSPECTIVE', message: 'Sprint Retrospective: Optimize or Recover?' };
        }
        if (node.type === 'vendor') {
            const stock = getRandomRewardCards(3);
            return { ...newState, status: 'VENDOR', vendorStock: stock, message: 'Vendor: Acquire new assets.' };
        }
        if (node.type === 'treasure') {
            // Grant a random relic and go back to map
            const availableRelics = Object.values(GAME_DATA.relics).filter(r => !prev.relics.some(pr => pr.id === r.id));
            const relic = availableRelics.length > 0 ? availableRelics[Math.floor(Math.random() * availableRelics.length)] : GAME_DATA.relics.coffee_drip;

            // Mark node as completed
            let newMap = [...prev.map];
            newMap[node.floor - 1] = newMap[node.floor - 1].map(n => n.id === node.id ? { ...n, completed: true } : n);

            return {
                ...newState,
                map: newMap,
                relics: [...prev.relics, relic],
                status: 'MAP',
                message: `Funding Round! Found ${relic.name}.`
            };
        }
        if (node.type === 'opportunity') {
            // 25% Shop, 25% Monster, 50% Event
            const roll = Math.random() * 100;
            if (roll < 25) {
                const stock = getRandomRewardCards(3);
                return { ...newState, status: 'VENDOR', vendorStock: stock, message: 'Opportunity: Hidden Vendor discovered!' };
            } else if (roll < 50) {
                // Fight hard pool monster
                const nextEnemies = getEncounterForFloor(node.floor);
                return startCombat(newState, prev, nextEnemies, 'Unexpected Problem appeared!');
            }
            // 50% - Actual Event
            const randomEvent = ACT1_EVENTS[Math.floor(Math.random() * ACT1_EVENTS.length)];
            return {
                ...newState,
                status: 'EVENT',
                currentEvent: randomEvent,
                message: `Event: ${randomEvent.name}`
            };
        }

        // Combat nodes
        let nextEnemies: EnemyData[] = [];

        if (node.type === 'boss') {
            nextEnemies = getBossEncounter();
        } else if (node.type === 'elite') {
            nextEnemies = getEliteEncounter();
        } else {
            // Normal problem node
            nextEnemies = getEncounterForFloor(node.floor);
        }

        // Apply floor scaling
        const floorScaling = Math.floor((node.floor - 1) * 5);
        nextEnemies = nextEnemies.map(e => ({
            ...e,
            hp: e.hp + floorScaling,
            maxHp: e.maxHp + floorScaling
        }));

        return startCombat(newState, prev, nextEnemies, `Encounter: ${nextEnemies.map(e => e.name).join(', ')}`);
    });
};

// Helper function to start combat
const startCombat = (newState: any, prev: GameState, nextEnemies: EnemyData[], encounterMessage: string) => {
    // Apply Combat Start Relics
    const { stats: startStats, message: relicMsg } = applyCombatStartRelics(newState.playerStats, newState.relics);

    // Reset Deck for Combat
    const combatDeck = shuffle([...prev.deck]);

    // Draw Initial Hand
    const { drawn, newDraw, newDiscard } = drawCards(combatDeck, [], 5);

    // Process Initial Draw (e.g. Legacy Code)
    const startStatsWithRelics = {
        ...startStats,
        bandwidth: getTurnStartBandwidth(prev.relics),
    };

    const processed = processDrawnCards(drawn, [], newDiscard, newDraw, startStatsWithRelics, relicMsg ? `${encounterMessage} ${relicMsg}` : encounterMessage);

    return {
        ...newState,
        status: 'PLAYING',
        enemies: nextEnemies,
        playerStats: processed.stats,
        message: processed.message,
        turn: 1,
        drawPile: processed.drawPile,
        hand: processed.hand,
        discardPile: processed.discard,
        exhaustPile: []
    };
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

const handleUpgradeCard = (cardIndex: number) => {
    setGameState(prev => {
        const newDeck = [...prev.deck];
        const card = newDeck[cardIndex];

        if (card.upgraded) {
            newDeck[cardIndex] = {
                ...card,
                name: card.upgraded.name,
                effects: card.upgraded.effects,
                cost: card.upgraded.cost !== undefined ? card.upgraded.cost : card.cost,
                description: card.upgraded.effects.map(e => e.type).join(', '),
                upgraded: undefined
            };
        }

        return {
            ...prev,
            deck: newDeck,
            status: 'MAP',
            message: `Upgraded ${card.name}!`,
            pendingSelection: undefined
        };
    });
};

const handleConfirmUpgrade = (card: CardData) => {
    // Find index in deck
    const index = gameState.deck.findIndex(c => c.id === card.id);
    if (index !== -1) {
        handleUpgradeCard(index);
        setViewingDeckForUpgrade(false);
    }
};

// --- Vendor Actions ---

const handleBuyCard = (card: CardData, price: number) => {
    setGameState(prev => {
        if (prev.playerStats.capital < price) return prev;

        const newDeck = [...prev.deck, card]; // Add to Master Deck
        const newStock = prev.vendorStock?.filter(c => c.id !== card.id);

        return {
            ...prev,
            playerStats: { ...prev.playerStats, capital: prev.playerStats.capital - price },
            deck: newDeck,
            vendorStock: newStock,
            message: `Acquired ${card.name} for $${price}k.`
        };
    });
};
const handleRemoveCardService = (price: number) => {
    setGameState(prev => {
        if (prev.playerStats.capital < price) return prev;

        // Remove a random 'Commit' or basic card for MVP, or open removal UI
        // For MVP: Remove first 'Commit' found
        const indexToRemove = prev.deck.findIndex(c => c.name === 'Commit');
        if (indexToRemove === -1) return { ...prev, message: "No basic Commit cards found to remove." };

        const newDeck = [...prev.deck];
        newDeck.splice(indexToRemove, 1);

        return {
            ...prev,
            playerStats: { ...prev.playerStats, capital: prev.playerStats.capital - price },
            deck: newDeck,
            message: "Removed 1 'Commit' (Technical Debt) from codebase."
        };
    });
};

// --- Event Actions ---

const handleEventChoice = (choice: EventChoice) => {
    setGameState(prev => {
        let newStats = { ...prev.playerStats };
        let newDeck = [...prev.deck];
        let newRelics = [...prev.relics];
        let message = '';

        // Check condition if present
        if (choice.condition) {
            const { type, operator, value } = choice.condition;
            let conditionMet = false;

            if (type === 'gold') {
                conditionMet = operator === '>=' ? newStats.capital >= value : newStats.capital < value;
            } else if (type === 'hp') {
                conditionMet = operator === '>=' ? newStats.hp >= value : newStats.hp < value;
            } else if (type === 'upgraded_cards') {
                const upgradedCount = newDeck.filter(c => c.name.endsWith('+')).length;
                conditionMet = operator === '>=' ? upgradedCount >= value : upgradedCount < value;
            }

            if (!conditionMet) {
                return { ...prev, message: 'Condition not met for this choice.' };
            }
        }

        // Process effects
        const processEffect = (effect: EventEffect) => {
            switch (effect.type) {
                case 'gain_gold':
                    newStats.capital += effect.value || 0;
                    message += ` Gained $${effect.value}k.`;
                    break;
                case 'lose_gold':
                    newStats.capital = Math.max(0, newStats.capital - (effect.value || 0));
                    message += ` Lost $${effect.value}k.`;
                    break;
                case 'gain_hp':
                    newStats.hp = Math.min(newStats.maxHp, newStats.hp + (effect.value || 0));
                    message += ` Healed ${effect.value} Runway.`;
                    break;
                case 'lose_hp':
                    newStats.hp = Math.max(0, newStats.hp - (effect.value || 0));
                    message += ` Lost ${effect.value} Runway.`;
                    break;
                case 'lose_max_hp':
                    const lostHp = Math.floor(newStats.maxHp * (effect.value || 0) / 100);
                    newStats.maxHp = Math.max(1, newStats.maxHp - lostHp);
                    newStats.hp = Math.min(newStats.hp, newStats.maxHp);
                    message += ` Lost ${lostHp} max Runway.`;
                    break;
                case 'gain_card':
                    const rarityPool = effect.cardRarity === 'random'
                        ? ['common', 'uncommon', 'rare'][Math.floor(Math.random() * 3)]
                        : effect.cardRarity;
                    const cards = getRandomRewardCards(1);
                    if (cards.length > 0) {
                        newDeck.push(cards[0]);
                        message += ` Gained ${cards[0].name}.`;
                    }
                    break;
                case 'remove_card':
                    for (let i = 0; i < (effect.value || 1); i++) {
                        if (newDeck.length > 5) { // Keep minimum deck size
                            const idx = Math.floor(Math.random() * newDeck.length);
                            const removed = newDeck.splice(idx, 1)[0];
                            message += ` Removed ${removed.name}.`;
                        }
                    }
                    break;
                case 'upgrade_card':
                    for (let i = 0; i < (effect.value || 1); i++) {
                        const upgradeable = newDeck.filter(c => !c.name.endsWith('+'));
                        if (upgradeable.length > 0) {
                            const cardToUpgrade = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            const idx = newDeck.findIndex(c => c.id === cardToUpgrade.id);
                            if (idx !== -1) {
                                newDeck[idx] = upgradeCard(newDeck[idx]);
                                message += ` Upgraded ${cardToUpgrade.name}.`;
                            }
                        }
                    }
                    break;
                case 'transform_card':
                    for (let i = 0; i < (effect.value || 1); i++) {
                        if (newDeck.length > 5) {
                            const idx = Math.floor(Math.random() * newDeck.length);
                            const removed = newDeck.splice(idx, 1)[0];
                            const replacement = getRandomRewardCards(1)[0];
                            newDeck.push(replacement);
                            message += ` Transformed ${removed.name} into ${replacement.name}.`;
                        }
                    }
                    break;
                case 'gain_strength':
                    newStats.statuses.strength += effect.value || 0;
                    message += ` Gained ${effect.value} permanent Strength.`;
                    break;
                case 'gain_relic':
                    const availableRelics = Object.values(GAME_DATA.relics).filter(r => !newRelics.some(pr => pr.id === r.id));
                    if (availableRelics.length > 0) {
                        const relic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                        newRelics.push(relic);
                        message += ` Gained relic: ${relic.name}.`;
                    }
                    break;
                case 'add_status_card':
                    const statusCard = GAME_DATA.cards[effect.statusId as keyof typeof GAME_DATA.cards];
                    if (statusCard) {
                        newDeck.push({ ...statusCard, id: `${statusCard.id}_${Date.now()}` });
                        message += ` Added ${statusCard.name} to deck.`;
                    }
                    break;
                case 'random_chance':
                    const successRoll = Math.random() * 100;
                    if (successRoll < (effect.chance || 50)) {
                        effect.successEffects?.forEach(e => processEffect(e));
                    } else {
                        effect.failureEffects?.forEach(e => processEffect(e));
                    }
                    break;
                case 'fight_elite':
                    // This will trigger an elite fight - handled separately
                    message += ' Elite encounter triggered!';
                    break;
                case 'nothing':
                default:
                    message += ' Nothing happened.';
                    break;
            }
        };

        choice.effects.forEach(e => processEffect(e));

        // Check for elite fight
        const triggerEliteFight = choice.effects.some(e => e.type === 'fight_elite');

        if (triggerEliteFight) {
            const eliteEnemies = getEliteEncounter();
            return startCombat({ ...prev, currentEvent: undefined }, prev, eliteEnemies, 'Elite Encounter!' + message);
        }

        // Mark node as completed
        let newMap = [...prev.map];
        if (prev.currentMapPosition) {
            const { floor, nodeId } = prev.currentMapPosition;
            newMap[floor - 1] = newMap[floor - 1].map(n => n.id === nodeId ? { ...n, completed: true } : n);
        }

        return {
            ...prev,
            playerStats: newStats,
            deck: newDeck,
            relics: newRelics,
            map: newMap,
            status: 'MAP',
            currentEvent: undefined,
            message: `${choice.label}:${message}`
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
        enemies: [], // Was enemy: null
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

                <button onClick={devSpawnLegacy} className="flex items-center gap-2 text-xs font-mono bg-purple-500/10 text-purple-500 border border-purple-500/30 hover:bg-purple-500/20 p-2 rounded transition text-left">
                    <Ghost size={14} /> Spawn Legacy Systems
                </button>

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
                    currentNodeId={gameState.currentMapPosition?.nodeId || null}
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
                    {gameState.deck.map((card, index) => (
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

// --- EVENT SCREEN ---
if (gameState.status === 'EVENT' && gameState.currentEvent) {
    const event = gameState.currentEvent;

    const checkCondition = (choice: EventChoice): boolean => {
        if (!choice.condition) return true;
        const { type, operator, value } = choice.condition;

        if (type === 'gold') {
            return operator === '>=' ? gameState.playerStats.capital >= value : gameState.playerStats.capital < value;
        }
        if (type === 'hp') {
            return operator === '>=' ? gameState.playerStats.hp >= value : gameState.playerStats.hp < value;
        }
        if (type === 'upgraded_cards') {
            const upgradedCount = gameState.deck.filter(c => c.name.endsWith('+')).length;
            return operator === '>=' ? upgradedCount >= value : upgradedCount < value;
        }
        return true;
    };

    return (
        <div className="min-h-screen bg-black/95 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-2xl bg-surface border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                {/* Event Header */}
                <div className="bg-blue-900/30 border-b border-blue-500/20 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-full">
                            <HelpCircle size={32} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white">{event.name}</h2>
                            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">Opportunity Event</span>
                        </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed italic">"{event.description}"</p>
                </div>

                {/* Choices */}
                <div className="p-6 space-y-4">
                    {event.choices.map((choice, index) => {
                        const isAvailable = checkCondition(choice);
                        return (
                            <button
                                key={choice.id}
                                onClick={() => isAvailable && handleEventChoice(choice)}
                                disabled={!isAvailable}
                                className={`
                                    w-full p-4 rounded-xl border text-left transition-all
                                    ${isAvailable
                                        ? 'border-gray-700 bg-black/40 hover:border-blue-500/50 hover:bg-blue-500/10 cursor-pointer'
                                        : 'border-gray-800 bg-gray-900/30 opacity-50 cursor-not-allowed'}
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm
                                        ${isAvailable ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-600'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold mb-1 ${isAvailable ? 'text-white' : 'text-gray-500'}`}>
                                            {choice.label}
                                        </div>
                                        <div className={`text-sm ${isAvailable ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {choice.description}
                                        </div>
                                        {!isAvailable && choice.condition && (
                                            <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                                <X size={12} /> Requires: {choice.condition.type} {choice.condition.operator} {choice.condition.value}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer Stats */}
                <div className="bg-black/40 border-t border-gray-800 px-6 py-4 flex justify-between items-center text-sm font-mono">
                    <div className="flex items-center gap-4 text-gray-500">
                        <span className="flex items-center gap-1">
                            <Battery size={14} className="text-primary" /> {gameState.playerStats.hp}/{gameState.playerStats.maxHp}k
                        </span>
                        <span className="flex items-center gap-1">
                            <DollarSign size={14} className="text-warning" /> ${gameState.playerStats.capital}k
                        </span>
                    </div>
                    <span className="text-gray-600">Deck: {gameState.deck.length} cards</span>
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

            <div className="w-full max-w-7xl flex justify-between items-center mb-24 px-4">

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

                <div className={`
                        flex flex-row flex-nowrap justify-center items-end gap-2 w-full transition-all duration-300
                        ${gameState.enemies.length > 3 ? 'scale-90' : ''}
                        ${gameState.enemies.length > 4 ? 'scale-75' : ''}
                    `}>
                    {gameState.enemies.map((enemy, index) => (
                        <Unit
                            key={enemy.id}
                            name={enemy.name}
                            currentHp={enemy.hp}
                            maxHp={enemy.maxHp}
                            emoji={enemy.emoji}
                            isEnemy
                            intent={enemy.currentIntent}
                            statuses={enemy.statuses}
                            description={enemy.description}
                            onDrop={(card) => handleEnemyDrop(card, enemy.id)}
                            isTargetable={gameState.status === 'PLAYING'}
                            isSelected={gameState.selectedEnemyId === enemy.id}
                            onClick={() => setGameState(prev => ({ ...prev, selectedEnemyId: enemy.id }))}
                        />
                    ))}
                </div>
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