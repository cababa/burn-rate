import React, { useState, useRef, useEffect } from 'react';
import { Unit } from './components/Unit';
import { Card } from './components/Card';
import { MapScreen } from './components/MapScreen';
import { DeckViewer } from './components/DeckViewer';
import { GAME_DATA, MAX_HAND_SIZE, ACT1_EVENTS, generateBlessingOptions } from './constants';
import { CardData, GameState, EnemyIntent, MapLayer, MapNode, CharacterStats, RelicData, EntityStatus, EnemyData, CardEffect, EventData, EventChoice, EventEffect, PotionData, NeowBlessing } from './types';
import { Battery, DollarSign, CheckCircle2, AlertOctagon, RefreshCw, Play, Layers, Archive, Gift, ArrowRight, Coffee, Hammer, Store, Trash2, Gem, Wrench, FastForward, Heart, Plus, Bug, Ghost, Rocket, Lock, User, Briefcase, ChevronRight, Zap, X, HelpCircle, Shuffle, Hash, BookOpen, Skull } from 'lucide-react';
import {
    calculateDamage, countCardsMatches, generateStarterDeck, getRandomRewardCards, shuffle, drawCards, drawCardsWithInnate, upgradeCard,
    applyCombatStartRelics, applyCombatEndRelics, getTurnStartBandwidth, generateMap, resolveCardEffect, resolveEnemyTurn, resolveEndTurn, processDrawnCards,
    applyOnAttackRelics, applyOnEnemyDeathRelics, applyTurnEndRelics, hasRetainHand, getCardLimit, canRestAtSite,
    getRelicWoundsToAdd, applyOnCardReward, getSecretWeaponCard, getEncounterForFloor, getEliteEncounter, getBossEncounter,
    // Potion functions
    resolvePotionEffect, checkPotionDrop, generateRandomPotion, addPotionToSlot, removePotionFromSlot, canAcquirePotion, canUseExitStrategy,
    // Progressive narrative helper
    getConnectedNodes
} from './gameLogic';
import { createGameRNG, GameRNG, generateRandomSeed } from './rng';

// === NARRATIVE SYSTEM ===
import { TweetOverlay } from './components/TweetOverlay';
import { TimelineModal } from './components/TimelineModal';
import { TweetSidebar } from './components/TweetSidebar';
import { ApproachTweetOverlay } from './components/ApproachTweetOverlay';
import { EnemyTweetBubble } from './components/EnemyTweetBubble';
import { FounderTweetBubble } from './components/FounderTweetBubble';
import { PostMortemModal } from './components/PostMortemModal';
import {
    NarrativeTweet,
    ActNarrative,
    StartupContext,
    STARTUP_PRESETS
} from './narrativeTypes';
import {
    generateActNarrative,
    getEnemyAttackTweet,
    getEnemyTweetByIntent,
    getEnemyDefeatTweet,
    getStoryBeatTweet,
    createFallbackNarrative,
    hasGeminiApiKey,
    setGeminiApiKey,
    getGeminiApiKey
} from './narrativeService';
// === PROGRESSIVE NARRATIVE SYSTEM ===
import {
    MacroNarrative,
    MesoNarrative
} from './progressiveNarrativeTypes';
import {
    generateInitialNarrative,
    generateMesoNarrative,
    generateMacroNarrative,
    generateNextPathNarratives,
    getEnemyIntentTweet,
    getEnemyDefeatTweetProgressive,
    getCardPlayTweet,
    getFounderTurnEndTweet,
    getCachedMeso,
    setCachedMeso,
    createFallbackMacro,
    createFallbackMeso,
    clearNarrativeCache,
    hasGeminiApiKey as hasProgressiveApiKey,
    setGeminiApiKey as setProgressiveApiKey
} from './progressiveNarrativeService';
import { useEnemyGifs } from './useEnemyGifs';
import { useCardGifs } from './useCardGifs';
import { prefetchCardGifs, searchMultipleGifsForCard, searchGifsByCustomTerm, setCuratedCardGif, isCardCurated, getCuratedCount, CARD_GIF_SEARCH_TERMS, searchMultipleGifsForEnemy, setCuratedEnemyGif, isEnemyCurated, getCuratedEnemyCount, EMOJI_SEARCH_TERMS } from './giphyService';
import { PostMortemAnalysis, generatePostMortem } from './postMortemService';
import { getGlobalLogger } from './logger';

const App: React.FC = () => {
    // --- Game State Initialization ---

    // Seeded RNG manager - ref to persist across re-renders
    const rngRef = useRef<GameRNG | null>(null);

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
        pendingDiscard: 0,
        // Potion system
        potions: [null, null, null],
        potionSlotCount: 3,
        potionDropChance: 40,
        duplicateNextCard: false,
        // Seed system
        seed: ''
    });

    const [viewingDeckForUpgrade, setViewingDeckForUpgrade] = useState(false);
    const [showDevPanel, setShowDevPanel] = useState(false);
    const [showCardCompendium, setShowCardCompendium] = useState(false);
    const [showEnemyCompendium, setShowEnemyCompendium] = useState(false);
    const [curateMode, setCurateMode] = useState(false);
    const [curatingCard, setCuratingCard] = useState<{ cardId: string; options: string[]; loading: boolean } | null>(null);
    const [curatingEnemy, setCuratingEnemy] = useState<{ emoji: string; name: string; options: string[]; loading: boolean } | null>(null);
    const [curatedGifs, setCuratedGifs] = useState<Record<string, string>>({});
    const [curatedEnemyGifs, setCuratedEnemyGifsState] = useState<Record<string, string>>({});

    // Deck/pile viewer modal state
    const [viewingPile, setViewingPile] = useState<'deck' | 'draw' | 'discard' | 'exhaust' | 'remove' | null>(null);
    const [pendingRemovalPrice, setPendingRemovalPrice] = useState(0);

    // Secret Weapon relic: pending relic that needs skill card selection before being added
    const [pendingSecretWeaponRelic, setPendingSecretWeaponRelic] = useState<RelicData | null>(null);

    // Potion targeting state: which potion is being targeted
    const [pendingPotionUse, setPendingPotionUse] = useState<{ potion: PotionData; slotIndex: number } | null>(null);

    // === NARRATIVE SYSTEM STATE ===
    const [actNarrative, setActNarrative] = useState<ActNarrative | null>(null);
    const [currentTweet, setCurrentTweet] = useState<NarrativeTweet | null>(null);
    const [tweetHistory, setTweetHistory] = useState<NarrativeTweet[]>([]);
    const [showTimeline, setShowTimeline] = useState(false);
    const [narrativeLoading, setNarrativeLoading] = useState(false);
    const [narrativeError, setNarrativeError] = useState<string | null>(null);
    // Per-enemy tweet bubbles (enemyId -> tweet)
    const [enemyTweets, setEnemyTweets] = useState<Record<string, NarrativeTweet>>({});

    // === PROGRESSIVE NARRATIVE STATE ===
    const [macroNarrative, setMacroNarrative] = useState<MacroNarrative | null>(null);
    const [currentMeso, setCurrentMeso] = useState<MesoNarrative | null>(null);
    const [useProgressiveNarrative, setUseProgressiveNarrative] = useState(true); // Feature flag
    const [showApproachOverlay, setShowApproachOverlay] = useState(false); // Combat start overlay
    const [victoryPhase, setVictoryPhase] = useState<'tweet' | 'rewards'>('tweet'); // Victory screen phase
    const [founderTweet, setFounderTweet] = useState<NarrativeTweet | null>(null); // Founder tweet on turn end

    // === POST-MORTEM ANALYSIS STATE ===
    const [postMortemAnalysis, setPostMortemAnalysis] = useState<PostMortemAnalysis | null>(null);
    const [postMortemLoading, setPostMortemLoading] = useState(false);

    // === GIPHY GIF SYSTEM ===
    const { gifUrls: enemyGifUrls, isLoading: gifsLoading } = useEnemyGifs({
        enemies: gameState.enemies.map(e => ({ id: e.id, emoji: e.emoji })),
        enabled: gameState.status === 'PLAYING' || gameState.status === 'ENEMY_TURN' || gameState.status === 'VICTORY'
    });

    // Card GIFs - pre-fetched on game start, 1:1 static mapping
    const { getGifUrl: getCardGifUrl, isReady: cardGifsReady } = useCardGifs({ enabled: true });

    // Pre-fetch card GIFs on app mount
    useEffect(() => {
        prefetchCardGifs();
    }, []);

    // Startup input form state
    const [startupNameInput, setStartupNameInput] = useState('');
    const [startupOneLinerInput, setStartupOneLinerInput] = useState('');
    const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey() || '');

    // Track previous status and enemies for detecting changes
    const prevStatusRef = useRef(gameState.status);
    const prevEnemiesRef = useRef<string[]>([]);

    // === PROGRESSIVE NARRATIVE: Generate MESO on combat start, use progressive tweets ===
    useEffect(() => {
        const prevStatus = prevStatusRef.current;
        prevStatusRef.current = gameState.status;

        // Detect combat start (turn 1 from MAP or other non-PLAYING state)
        const isCombatStart = gameState.status === 'PLAYING' && gameState.turn === 1 && prevStatus !== 'PLAYING';
        const isNewPlayerTurn = gameState.status === 'PLAYING' && prevStatus === 'ENEMY_TURN';

        if (isCombatStart && macroNarrative && gameState.enemies.length > 0) {
            // MESO GENERATION: Generate narrative for this combat node
            const context: StartupContext = {
                name: gameState.startupName || 'Startup',
                oneLiner: gameState.startupOneLiner || 'Building something great'
            };

            const nodeId = gameState.currentMapPosition?.nodeId || `floor_${gameState.floor}`;
            const floor = gameState.floor;
            const nodeType = 'problem'; // Could be enhanced to pass actual node type

            // Get enemy info for MESO generation - extract base ID by removing timestamp suffix
            const enemies = gameState.enemies.map(e => {
                // Same algorithm as getEnemyIntentTweet: remove trailing timestamp (10+ digit number)
                const parts = e.id.split('_');
                const baseIdParts: string[] = [];
                for (const part of parts) {
                    if (/^\d{10,}$/.test(part)) break; // Stop at timestamp
                    baseIdParts.push(part);
                }
                return {
                    id: baseIdParts.join('_') || e.id,
                    name: e.name,
                    type: e.type || 'enemy'
                };
            });

            // Get next nodes for path previews (simplified)
            const nextNodes = getConnectedNodes(gameState.map, gameState.currentMapPosition)
                .map(n => ({ id: n.id, type: n.type }));

            console.log('[Progressive] 🎬 Generating MESO for combat at floor', floor);

            // IMMEDIATELY show the approach overlay to hide battle UI while MESO generates
            setShowApproachOverlay(true);

            // Prepare deck cards for contextual tweet generation
            const deckCards = (gameState.deck || []).map(c => ({
                name: c.name,
                type: c.type,
                description: c.description
            }));

            // Generate MESO for this combat (async) - wait for LLM first, fallback only on failure
            generateMesoNarrative(context, macroNarrative, nodeId, floor, nodeType, enemies, nextNodes, deckCards)
                .then(meso => {
                    console.log('[Progressive] ✅ MESO ready! Showing AI-generated tweets');
                    setCurrentMeso(meso);

                    // Update currentTweet with approach tweet (overlay is already visible)
                    if (meso.approachTweet) {
                        setCurrentTweet(meso.approachTweet);
                        setTweetHistory(hist => {
                            const isDup = hist.some(t => t.content === meso.approachTweet.content);
                            return isDup ? hist : [...hist, meso.approachTweet];
                        });
                    }

                    // Generate enemy tweets from MESO
                    const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
                    const newEnemyTweets: Record<string, NarrativeTweet> = {};
                    const newHistoryTweets: NarrativeTweet[] = [];
                    const seenContent = new Set<string>(); // Track content we've already queued

                    for (const enemy of aliveEnemies) {
                        const intentType = enemy.currentIntent.type as 'attack' | 'buff' | 'debuff';
                        const tweet = getEnemyIntentTweet(meso, enemy.id, intentType);

                        if (tweet) {
                            newEnemyTweets[enemy.id] = tweet;
                            // Check both history AND tweets we're about to add
                            const isDuplicate = tweetHistory.some(t => t.content === tweet.content) ||
                                seenContent.has(tweet.content);
                            if (!isDuplicate) {
                                newHistoryTweets.push(tweet);
                                seenContent.add(tweet.content);
                            }
                        }
                    }

                    console.log('[Progressive] Generated tweets for', Object.keys(newEnemyTweets).length, 'enemies');
                    setEnemyTweets(newEnemyTweets);
                    if (newHistoryTweets.length > 0) {
                        setTweetHistory(hist => {
                            // Filter out any duplicates against actual current history
                            const newTweets = newHistoryTweets.filter(t =>
                                !hist.some(h => h.content === t.content)
                            );
                            return [...hist, ...newTweets];
                        });
                    }
                })
                .catch(err => {
                    console.error('[Progressive] ⚠️ MESO generation failed, using fallback tweets:', err);

                    // Create and show fallback tweets only on LLM failure
                    const fallbackMeso = createFallbackMeso(
                        context,
                        macroNarrative,
                        nodeId,
                        floor,
                        nodeType,
                        enemies
                    );
                    setCurrentMeso(fallbackMeso);

                    // Show fallback approach tweet (overlay is already visible)
                    if (fallbackMeso.approachTweet) {
                        setCurrentTweet(fallbackMeso.approachTweet);
                        setTweetHistory(hist => {
                            const isDup = hist.some(t => t.content === fallbackMeso.approachTweet.content);
                            return isDup ? hist : [...hist, fallbackMeso.approachTweet];
                        });
                    }

                    // Show fallback enemy tweets
                    const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
                    const fallbackEnemyTweets: Record<string, NarrativeTweet> = {};
                    for (const enemy of aliveEnemies) {
                        const intentType = enemy.currentIntent.type as 'attack' | 'buff' | 'debuff';
                        const tweet = getEnemyIntentTweet(fallbackMeso, enemy.id, intentType);
                        if (tweet) {
                            fallbackEnemyTweets[enemy.id] = tweet;
                        }
                    }
                    setEnemyTweets(fallbackEnemyTweets);
                    console.log('[Progressive] 📝 Using fallback tweets for', Object.keys(fallbackEnemyTweets).length, 'enemies');
                });
        } else if (isNewPlayerTurn && currentMeso && gameState.enemies.length > 0) {
            // Subsequent turns: Use cached MESO for tweets
            const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
            const newEnemyTweets: Record<string, NarrativeTweet> = {};
            const newHistoryTweets: NarrativeTweet[] = [];
            const seenContent = new Set<string>(); // Track content we've already queued

            for (const enemy of aliveEnemies) {
                const intentType = enemy.currentIntent.type as 'attack' | 'buff' | 'debuff';
                const tweet = getEnemyIntentTweet(currentMeso, enemy.id, intentType);

                if (tweet) {
                    newEnemyTweets[enemy.id] = tweet;
                    // Check both history AND tweets we're about to add
                    const isDuplicate = tweetHistory.some(t => t.content === tweet.content) ||
                        seenContent.has(tweet.content);
                    if (!isDuplicate) {
                        newHistoryTweets.push(tweet);
                        seenContent.add(tweet.content);
                    }
                }
            }

            console.log('[Progressive] Turn', gameState.turn, '- generated tweets for', Object.keys(newEnemyTweets).length, 'enemies');
            setEnemyTweets(newEnemyTweets);
            if (newHistoryTweets.length > 0) {
                setTweetHistory(hist => {
                    // Filter out any duplicates against actual current history
                    const newTweets = newHistoryTweets.filter(t =>
                        !hist.some(h => h.content === t.content)
                    );
                    return [...hist, ...newTweets];
                });
            }
        } else if ((isCombatStart || isNewPlayerTurn) && !macroNarrative && actNarrative) {
            // Fallback to old system if no MACRO
            const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
            const newEnemyTweets: Record<string, NarrativeTweet> = {};
            for (const enemy of aliveEnemies) {
                const baseEnemyId = enemy.id.split('_').slice(0, -1).join('_') || enemy.id;
                const intentType = enemy.currentIntent.type as 'attack' | 'buff' | 'debuff' | 'defend' | 'unknown';
                const tweet = getEnemyTweetByIntent(actNarrative, baseEnemyId, intentType);
                if (tweet) newEnemyTweets[enemy.id] = tweet;
            }
            console.log('[Narrative] Fallback - generated tweets for', Object.keys(newEnemyTweets).length, 'enemies');
            setEnemyTweets(newEnemyTweets);
        }
    }, [gameState.status, gameState.turn, macroNarrative, currentMeso, actNarrative]);

    // === PROGRESSIVE NARRATIVE: Detect enemy deaths and show victory tweets ===
    useEffect(() => {
        const currentEnemyIds = gameState.enemies.filter(e => e.hp > 0).map(e => e.id);
        const prevIds = prevEnemiesRef.current;
        prevEnemiesRef.current = currentEnemyIds;

        // Find enemies that died (were in prev but not in current)
        const deadIds = prevIds.filter(id => !currentEnemyIds.includes(id));

        if (deadIds.length > 0) {
            for (const deadId of deadIds) {
                // Try progressive MESO first
                let tweet: NarrativeTweet | null = null;
                if (currentMeso) {
                    tweet = getEnemyDefeatTweetProgressive(currentMeso, deadId);
                    if (tweet) {
                        console.log('[Progressive] Enemy defeated! Showing MESO victory tweet for:', deadId);
                    }
                }

                // Fallback to old system
                if (!tweet && actNarrative) {
                    const parts = deadId.split('_');
                    const baseIdParts: string[] = [];
                    for (const part of parts) {
                        if (/^\d{10,}$/.test(part)) break;
                        baseIdParts.push(part);
                    }
                    const baseEnemyId = baseIdParts.join('_') || deadId;
                    tweet = getEnemyDefeatTweet(actNarrative, baseEnemyId);
                    if (tweet) {
                        console.log('[Narrative] Fallback defeat tweet for:', baseEnemyId);
                    }
                }

                if (tweet) {
                    // Remove the dead enemy's tweet bubble
                    setEnemyTweets(prev => {
                        const next = { ...prev };
                        delete next[deadId];
                        return next;
                    });
                    // Show victory tweet and add to history
                    setCurrentTweet(tweet);
                    setTweetHistory(hist => {
                        const isDup = hist.some(t => t.content === tweet!.content);
                        return isDup ? hist : [...hist, tweet!];
                    });
                }
            }
        }
    }, [gameState.enemies, currentMeso, actNarrative]);

    // === RESET VICTORY PHASE WHEN ENTERING VICTORY ===
    useEffect(() => {
        if (gameState.status === 'VICTORY') {
            setVictoryPhase('tweet'); // Start with tweet phase
        }
    }, [gameState.status]);

    // === POST-MORTEM GENERATION ON GAME OVER ===
    // Generate AI analysis when player's startup fails
    useEffect(() => {
        if (gameState.status === 'GAME_OVER' && !postMortemLoading && !postMortemAnalysis) {
            console.log('[PostMortem] 💀 Game Over detected - generating analysis...');
            setPostMortemLoading(true);

            // Get game history from logger
            const gameHistory = getGlobalLogger().toNarrativeText();
            const startupName = gameState.startupName || 'Startup';
            const floor = gameState.floor;
            const oneLiner = gameState.startupOneLiner || 'Building something amazing';

            generatePostMortem(gameHistory, startupName, floor, oneLiner)
                .then(analysis => {
                    console.log('[PostMortem] ✅ Analysis ready:', analysis.headline);
                    setPostMortemAnalysis(analysis);
                    setPostMortemLoading(false);
                })
                .catch(err => {
                    console.error('[PostMortem] ❌ Generation failed:', err);
                    setPostMortemLoading(false);
                });
        }
    }, [gameState.status, gameState.floor, gameState.startupName, gameState.startupOneLiner, postMortemLoading, postMortemAnalysis]);

    // Reset post-mortem state when starting new game
    const resetPostMortemState = () => {
        setPostMortemAnalysis(null);
        setPostMortemLoading(false);
    };


    // === FOUNDER TURN-END TWEET ===
    // Display a founder tweet when player ends turn and status becomes ENEMY_TURN
    useEffect(() => {
        if (gameState.status === 'ENEMY_TURN' && currentMeso) {
            const tweet = getFounderTurnEndTweet(currentMeso);
            if (tweet) {
                console.log('[Progressive] 💬 Founder turn-end tweet:', tweet.content);
                setFounderTweet(tweet);
                setTweetHistory(hist => {
                    const isDup = hist.some(t => t.content === tweet.content);
                    return isDup ? hist : [...hist, tweet];
                });
            }
        }
        // Note: We don't clear on PLAYING - tweet persists until dismissed or next turn end
    }, [gameState.status, currentMeso]);

    // === PRE-GENERATE MESO FOR NEXT NODES ===
    // Triggered during player "idle" states: VICTORY, EVENT, VENDOR
    // This ensures narratives are cached and ready before the player enters the next node
    useEffect(() => {
        const idleStates = ['VICTORY', 'EVENT', 'VENDOR'];

        const shouldPregenerate =
            idleStates.includes(gameState.status) &&
            macroNarrative &&
            gameState.currentMapPosition;

        if (!shouldPregenerate) return;

        const connectedNodes = getConnectedNodes(gameState.map, gameState.currentMapPosition);
        if (connectedNodes.length === 0) return;

        // Prepare nodes with floor info (next floor = current + 1)
        const nextFloor = (gameState.currentMapPosition?.floor || 0) + 1;
        const nodesWithFloor = connectedNodes.map(n => ({
            id: n.id,
            floor: nextFloor,
            type: n.type
        }));

        // Helper to get enemies for a node based on its type
        // Extract base ID: minor_bug_1234567890 -> minor_bug
        const extractBaseId = (id: string) => {
            const parts = id.split('_');
            const baseParts: string[] = [];
            for (const part of parts) {
                if (/^\d{10,}$/.test(part)) break; // Stop at timestamp
                if (/^\d{1,2}$/.test(part) && baseParts.length > 0) break; // Stop at index
                baseParts.push(part);
            }
            return baseParts.join('_') || id;
        };

        const getEnemiesForNode = (node: { id: string; floor: number; type: string }) => {
            if (node.type === 'problem' || node.type === 'enemy') {
                const enemies = getEncounterForFloor(node.floor, rngRef.current?.encounters);
                return enemies.map(e => ({
                    id: extractBaseId(e.id),
                    name: e.name,
                    type: 'enemy'
                }));
            } else if (node.type === 'elite') {
                const enemies = getEliteEncounter(rngRef.current?.encounters);
                return enemies.map(e => ({
                    id: extractBaseId(e.id),
                    name: e.name,
                    type: 'elite'
                }));
            } else if (node.type === 'boss') {
                const enemies = getBossEncounter(rngRef.current?.encounters);
                return enemies.map(e => ({
                    id: extractBaseId(e.id),
                    name: e.name,
                    type: 'boss'
                }));
            }
            return [];
        };

        const context = {
            name: gameState.startupName || 'Startup',
            oneLiner: gameState.startupOneLiner || 'Building something great'
        };

        console.log('[Progressive] 🔮 Pre-generating MESO for', nodesWithFloor.length, 'next nodes during', gameState.status);

        // Prepare deck cards for contextual tweet generation (filter out starter cards to reduce noise)
        const deckCards = (gameState.deck || [])
            .filter(c => c.rarity !== 'starter')
            .map(c => ({
                name: c.name,
                type: c.type,
                description: c.description
            }));

        generateNextPathNarratives(context, macroNarrative, nodesWithFloor, gameState.map, getEnemiesForNode, deckCards)
            .then(mesos => console.log('[Progressive] ✅ Pre-generated', mesos.length, 'MESO narratives'))
            .catch(err => console.error('[Progressive] Pre-generation failed:', err));

    }, [gameState.status, gameState.currentMapPosition, macroNarrative]);

    // === PRE-GENERATE MESO DURING BLESSING SCREEN ===
    // First encounter is always a fight, so generate MESO early while player picks blessing
    useEffect(() => {
        if (gameState.status !== 'NEOW_BLESSING' || !macroNarrative || !gameState.map?.length) return;

        // Get first floor combat nodes (first encounter is always a fight)
        const firstFloorNodes = gameState.map[0]?.filter(n =>
            n.type === 'problem' || n.type === 'enemy'
        ) || [];

        if (firstFloorNodes.length === 0) {
            console.log('[Progressive] ⚠️ Blessing screen: No combat nodes found on floor 1');
            return;
        }

        const context = {
            name: gameState.startupName || 'Startup',
            oneLiner: gameState.startupOneLiner || 'Building something great'
        };

        console.log('[Progressive] 🔮 BLESSING SCREEN: Pre-generating MESO for', firstFloorNodes.length, 'first floor combat nodes');
        const pregenStartTime = Date.now();

        // Extract base ID helper
        const extractBaseId = (id: string) => {
            const parts = id.split('_');
            const baseParts: string[] = [];
            for (const part of parts) {
                if (/^\d{10,}$/.test(part)) break;
                if (/^\d{1,2}$/.test(part) && baseParts.length > 0) break;
                baseParts.push(part);
            }
            return baseParts.join('_') || id;
        };

        // Get enemies for a node
        const getEnemiesForFirstFloorNode = (nodeType: string) => {
            if (nodeType === 'problem' || nodeType === 'enemy') {
                const enemies = getEncounterForFloor(1, rngRef.current?.encounters);
                return enemies.map(e => ({
                    id: extractBaseId(e.id),
                    name: e.name,
                    type: 'enemy'
                }));
            }
            return [];
        };

        // Pre-generate for first 2 accessible nodes (typical branching paths)
        const nodesToPregen = firstFloorNodes.slice(0, 2);
        let completedCount = 0;

        // Prepare deck cards for contextual tweet generation (full starter deck for first battle)
        const deckCards = (gameState.deck || []).map(c => ({
            name: c.name,
            type: c.type,
            description: c.description
        }));

        for (const node of nodesToPregen) {
            const nodeStartTime = Date.now();
            console.log(`[Progressive] 🎯 BLESSING PREGEN: Starting for node ${node.id} (${node.type})`);

            const enemies = getEnemiesForFirstFloorNode(node.type);
            const nextNodes = getConnectedNodes(gameState.map, { floor: 1, nodeId: node.id })
                .map(n => ({ id: n.id, type: n.type }));

            generateMesoNarrative(context, macroNarrative, node.id, 1, node.type, enemies, nextNodes, deckCards)
                .then(() => {
                    completedCount++;
                    const nodeElapsed = Date.now() - nodeStartTime;
                    console.log(`[Progressive] ✅ BLESSING PREGEN: Cached MESO for ${node.id} in ${nodeElapsed}ms`);

                    if (completedCount === nodesToPregen.length) {
                        const totalElapsed = Date.now() - pregenStartTime;
                        console.log(`[Progressive] 🎉 BLESSING PREGEN COMPLETE: All ${completedCount} nodes cached in ${totalElapsed}ms`);
                    }
                })
                .catch(err => {
                    console.error(`[Progressive] ❌ BLESSING PREGEN FAILED for ${node.id}:`, err);
                });
        }
    }, [gameState.status, macroNarrative, gameState.map, gameState.startupName, gameState.startupOneLiner, gameState.deck]);

    // --- START GAME LOGIC ---

    const handleStartRun = (characterId: string) => {
        if (characterId !== 'cto') return; // Only CTO implemented for now

        // Create seeded RNG for this run
        const seed = generateRandomSeed();
        const rng = createGameRNG(seed);
        rngRef.current = rng;

        const initialDeck = shuffle(generateStarterDeck(), rng.shuffle);
        // Initial Relics
        const initialRelics = [GAME_DATA.relics.git_repository];
        const initialStats = { ...GAME_DATA.character.stats };

        setGameState({
            playerStats: initialStats,
            enemies: [],
            hand: [],
            drawPile: initialDeck,
            deck: initialDeck, // Initialize Master Deck
            discardPile: [],
            exhaustPile: [],
            relics: initialRelics,
            turn: 0,
            floor: 1,
            status: 'STARTUP_INPUT', // Go to startup input first, then Neow's blessing
            rewardOptions: [],
            message: 'Friends & Family Round...',
            map: generateMap(rng.map),
            currentMapPosition: null,
            lastVictoryReward: undefined,
            pendingDiscard: 0,
            // Potion system
            potions: [null, null, null],
            potionSlotCount: 3,
            potionDropChance: 40,
            duplicateNextCard: false,
            // Blessing options
            pendingBlessingOptions: generateBlessingOptions(),
            // Seed
            seed: seed
        });
    };

    // --- DEV MODE ACTIONS ---
    const devKillEnemy = () => {
        if (gameState.status !== 'PLAYING' || gameState.enemies.length === 0) return;

        let earnedCapital = 50;
        let earnedRelic: RelicData | undefined;

        // Check if any enemy is elite or boss by their type property
        const isEliteOrBoss = gameState.enemies.some(e => e.type === 'elite' || e.type === 'boss');
        console.log('DEV KILL: isEliteOrBoss =', isEliteOrBoss, 'enemy types =', gameState.enemies.map(e => e.type));

        if (isEliteOrBoss) {
            // Get random relic from pool (not already owned)
            const ownedRelicIds = gameState.relics.map(r => r.id);
            const isBoss = gameState.enemies.some(e => e.type === 'boss');
            const availableRelics = Object.values(GAME_DATA.relics).filter(r =>
                !ownedRelicIds.includes(r.id) &&
                r.rarity !== 'starter' &&
                (isBoss ? true : r.rarity !== 'boss')
            );

            console.log('DEV KILL: availableRelics.length =', availableRelics.length);

            if (availableRelics.length > 0) {
                earnedRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
            }
        }

        setGameState(prev => {
            // Don't auto-add relic to relics - player must take it from reward screen
            const nextRelics = [...prev.relics];

            // Don't auto-apply capital - use new reward system
            let nextStats = { ...prev.playerStats };
            // Apply combat end relics (Heal)
            const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(nextStats, nextRelics);

            // Generate card rewards
            const cardRewards = getRandomRewardCards(3);

            return {
                ...prev,
                enemies: prev.enemies.map(e => ({ ...e, hp: 0 })), // Kill all
                status: 'VICTORY',
                message: `DEV: Force Kill Executed. ${relicMsg}`,
                playerStats: afterRelicStats,
                lastVictoryReward: {
                    capital: earnedCapital,
                    cardRewards: cardRewards,
                    relic: earnedRelic,
                    goldCollected: false,
                    cardCollected: false,
                    relicCollected: false
                },
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

    // Clone cards before combat so per-combat fields (e.g., rampage stacks) don't leak across fights
    const sanitizeCardForCombat = (card: CardData): CardData => {
        const clone: CardData = { ...card };
        delete (clone as any).rampageBonus;
        return clone;
    };

    const buildCombatDeck = (deck: CardData[], extras: CardData[] = []) => {
        return [...deck, ...extras].map(sanitizeCardForCombat);
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
            const cleanDeck = buildCombatDeck(prev.deck);
            const combatDeck = shuffle([...cleanDeck]);
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
                exhaustPile: [],
                deck: cleanDeck
            };
        });
    };

    // Dev tool: Trigger a specific event by ID (for testing)
    // Usage in browser console: devTriggerEvent('refactoring_session') or devTriggerEvent() for random
    const devTriggerEvent = (eventId?: string) => {
        setGameState(prev => {
            const event = eventId
                ? ACT1_EVENTS.find(e => e.id === eventId) || ACT1_EVENTS[Math.floor(Math.random() * ACT1_EVENTS.length)]
                : ACT1_EVENTS[Math.floor(Math.random() * ACT1_EVENTS.length)];
            return {
                ...prev,
                status: 'EVENT',
                currentEvent: event,
                eventResult: undefined,
                message: `DEV: Triggered event: ${event.name}`
            };
        });
    };

    // Make devTriggerEvent available on window for console testing
    if (typeof window !== 'undefined') {
        (window as any).devTriggerEvent = devTriggerEvent;
        (window as any).listEvents = () => ACT1_EVENTS.map(e => ({ id: e.id, name: e.name }));
    }

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
        if (!card) return;

        // Attacks target specific enemy
        if (card.type === 'attack') {
            playCard(card, 'enemy', targetEnemyId);
        }
        // Skills can be played on enemies too - they apply to all enemies or self based on effect.target
        else if (card.type === 'skill') {
            playCard(card, 'self'); // Skills still resolve as 'self' but effects check their own target
        }
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

    // Generic Handler for selection actions (Hand, Discard Pile, or Deck)
    const handleCardSelection = (card: CardData) => {
        setGameState(prev => {
            if (!prev.pendingSelection) return prev;

            let newHand = [...prev.hand];
            let newDiscardPile = [...prev.discardPile];
            let newDrawPile = [...prev.drawPile];
            let newExhaustPile = [...prev.exhaustPile];
            let newDeck = [...prev.deck];
            let newMessage = prev.message;
            let newMitigation = prev.playerStats.mitigation;

            const { action, context, eventContext } = prev.pendingSelection;

            if (action === 'upgrade') {
                // Upgrade the selected card
                if (context === 'hand') {
                    newHand = newHand.map(c => c.id === card.id ? upgradeCard(c) : c);
                } else if (context === 'deck') {
                    newDeck = newDeck.map(c => c.id === card.id ? upgradeCard(c) : c);
                }
                newMessage = `⬆️ Upgraded ${card.name}.`;

            } else if (action === 'move_to_draw_pile') {
                // Move from Discard to Top of Draw
                if (context === 'hand') {
                    newHand = newHand.filter(c => c.id !== card.id);
                    newDrawPile.push(card);
                } else {
                    newDiscardPile = newDiscardPile.filter(c => c.id !== card.id);
                    newDrawPile.push(card);
                }
                newMessage = `Placed ${card.name} on top of Draw Pile.`;

            } else if (action === 'exhaust') {
                // Exhaust the selected card from hand
                if (context === 'hand') {
                    newHand = newHand.filter(c => c.id !== card.id);
                    newExhaustPile.push(card);
                    if (prev.playerStats.statuses.feelNoPain > 0) {
                        newMitigation += prev.playerStats.statuses.feelNoPain;
                    }
                    newMessage = `Archived ${card.name}.`;
                }

            } else if (action === 'remove') {
                // Remove from deck permanently (event context)
                if (context === 'deck') {
                    newDeck = newDeck.filter(c => c.id !== card.id);
                    newMessage = `🗑️ Removed ${card.name} from deck.`;
                }

            } else if (action === 'transform') {
                // Transform card in deck (event context)
                if (context === 'deck') {
                    const replacement = getRandomRewardCards(1)[0];
                    newDeck = newDeck.filter(c => c.id !== card.id);
                    newDeck.push(replacement);
                    newMessage = `🔄 Transformed ${card.name} → ${replacement.name}.`;
                }
            }

            // Decrease Count
            const newCount = prev.pendingSelection.count - 1;
            let newStatus: GameState['status'] = prev.status;
            let newPendingSelection = newCount > 0 ? { ...prev.pendingSelection, count: newCount } : undefined;

            // Mark node as completed if returning from event
            let newMap = [...prev.map];

            if (newCount <= 0) {
                // If this was an event context, return to MAP and mark node complete
                if (eventContext) {
                    newStatus = 'MAP';
                    if (prev.currentMapPosition) {
                        const { floor, nodeId } = prev.currentMapPosition;
                        newMap[floor - 1] = newMap[floor - 1].map(n => n.id === nodeId ? { ...n, completed: true } : n);
                    }
                } else if (prev.turn === 0) {
                    // Pre-combat selection (blessing) - go to MAP
                    newStatus = 'MAP';
                } else {
                    newStatus = 'PLAYING';
                }
            } else {
                newMessage += ` Select ${newCount} more.`;
            }

            return {
                ...prev,
                hand: newHand,
                discardPile: newDiscardPile,
                drawPile: newDrawPile,
                exhaustPile: newExhaustPile,
                deck: newDeck,
                map: newMap,
                playerStats: { ...prev.playerStats, mitigation: newMitigation },
                status: newStatus,
                pendingSelection: newPendingSelection,
                currentEvent: newCount <= 0 && eventContext ? undefined : prev.currentEvent,
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
        setGameState(prev => resolveCardEffect(prev, card, target, targetEnemyId, rngRef.current?.cards));

        // Generate card play tweet for variety during combat
        if (currentMeso) {
            const cardType = card.type as 'attack' | 'skill' | 'power';
            const tweet = getCardPlayTweet(currentMeso, cardType);
            if (tweet) {
                setCurrentTweet(tweet);
                setTweetHistory(hist => {
                    const isDup = hist.some(t => t.content === tweet.content);
                    return isDup ? hist : [...hist, tweet];
                });
            }
        }
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

        // Check if player has Memory Bank relic (retain all cards)
        const retainAllCards = hasRetainHand(gameState.relics);

        gameState.hand.forEach(card => {
            if (card.ethereal) {
                cardsToExhaust.push(card);
            } else if (card.retain || retainAllCards) {
                // Retain if card has retain OR if relic gives global retain
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
            const newState = resolveEnemyTurn(prev, rngRef.current?.cards);
            return newState;
        });
        // Tweet generation moved to useEffect that triggers when status becomes PLAYING
    };


    // --- Reward Collection Handlers (StS-style) ---

    const handleTakeGold = () => {
        setGameState(prev => {
            if (!prev.lastVictoryReward || prev.lastVictoryReward.goldCollected) return prev;
            return {
                ...prev,
                playerStats: { ...prev.playerStats, capital: prev.playerStats.capital + prev.lastVictoryReward.capital },
                lastVictoryReward: { ...prev.lastVictoryReward, goldCollected: true },
                message: `Collected $${prev.lastVictoryReward.capital}k Capital!`
            };
        });
    };

    const handleTakeCard = (card: CardData) => {
        setGameState(prev => {
            if (!prev.lastVictoryReward || prev.lastVictoryReward.cardCollected) return prev;

            // Apply Smart Money relic (bonus capital on card reward)
            const { stats: newStats, messages: relicMessages } = applyOnCardReward(prev.relics, prev.playerStats);
            const bonusMsg = relicMessages.length > 0 ? ` ${relicMessages.join(' ')}` : '';

            return {
                ...prev,
                deck: [...prev.deck, card],
                playerStats: newStats,
                lastVictoryReward: { ...prev.lastVictoryReward, cardCollected: true },
                message: `Added ${card.name} to deck!${bonusMsg}`
            };
        });
    };

    const handleSkipCard = () => {
        setGameState(prev => {
            if (!prev.lastVictoryReward) return prev;
            return {
                ...prev,
                lastVictoryReward: { ...prev.lastVictoryReward, cardCollected: true },
                message: 'Skipped card reward.'
            };
        });
    };

    const handleTakeRelic = () => {
        setGameState(prev => {
            if (!prev.lastVictoryReward || !prev.lastVictoryReward.relic || prev.lastVictoryReward.relicCollected) return prev;

            const relic = prev.lastVictoryReward.relic;

            // Secret Weapon requires skill card selection before adding
            if (relic.effect.type === 'start_with_card') {
                // Store the relic and wait for card selection
                setPendingSecretWeaponRelic({ ...relic });
                return {
                    ...prev,
                    lastVictoryReward: { ...prev.lastVictoryReward, relicCollected: true },
                    message: `Select a skill card for ${relic.name}...`
                };
            }

            // Normal relic acquisition
            return {
                ...prev,
                relics: [...prev.relics, relic],
                lastVictoryReward: { ...prev.lastVictoryReward, relicCollected: true },
                message: `Perk unlocked: ${relic.name}!`
            };
        });
    };

    // Handler for Secret Weapon skill card selection
    const handleSecretWeaponCardSelect = (card: CardData) => {
        if (!pendingSecretWeaponRelic) return;

        // Store the chosen card ID on the relic and add it
        const relicWithCard = { ...pendingSecretWeaponRelic, chosenCardId: card.id };

        setGameState(prev => ({
            ...prev,
            relics: [...prev.relics, relicWithCard],
            message: `${pendingSecretWeaponRelic.name}: Will start each combat with ${card.name}!`
        }));

        setPendingSecretWeaponRelic(null);
    };

    // --- POTION HANDLERS ---

    // Click on potion slot to initiate use
    const handlePotionClick = (potion: PotionData, slotIndex: number) => {
        if (gameState.status !== 'PLAYING') return;

        // Check if this potion requires a target
        const needsTarget = potion.target === 'enemy';

        // Exit Strategy cannot be used on boss fights
        if (potion.effects.some(e => e.type === 'escape')) {
            if (!canUseExitStrategy(gameState.enemies)) {
                setGameState(prev => ({ ...prev, message: 'Cannot use Exit Strategy in boss fights!' }));
                return;
            }
        }

        if (needsTarget) {
            // If only one enemy, use directly
            const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
            if (aliveEnemies.length === 1) {
                handleUsePotion(potion, slotIndex, aliveEnemies[0].id);
            } else {
                // Multiple enemies - enter targeting mode
                setPendingPotionUse({ potion, slotIndex });
                setGameState(prev => ({ ...prev, message: `Select target for ${potion.name}...` }));
            }
        } else {
            // No target needed, use immediately
            handleUsePotion(potion, slotIndex);
        }
    };

    // Actually use the potion
    const handleUsePotion = (potion: PotionData, slotIndex: number, targetEnemyId?: string) => {
        setPendingPotionUse(null);
        setGameState(prev => {
            const newState = resolvePotionEffect(prev, potion, slotIndex, targetEnemyId);
            return {
                ...newState,
                message: `Used ${potion.name}!`
            };
        });
    };

    // Handle enemy click for potion targeting
    const handlePotionTargetEnemy = (enemyId: string) => {
        if (!pendingPotionUse) return;
        handleUsePotion(pendingPotionUse.potion, pendingPotionUse.slotIndex, enemyId);
    };

    // Cancel potion targeting
    const cancelPotionTargeting = () => {
        setPendingPotionUse(null);
        setGameState(prev => ({ ...prev, message: 'Stash use cancelled.' }));
    };

    // Discard a potion (right-click or shift-click)
    const handleDiscardPotion = (slotIndex: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setGameState(prev => ({
            ...prev,
            potions: removePotionFromSlot(prev.potions, slotIndex),
            message: 'Item discarded.'
        }));
    };

    // Handle taking a potion reward
    const handleTakePotion = () => {
        setGameState(prev => {
            if (!prev.pendingPotionReward) return prev;
            if (!canAcquirePotion(prev.potions)) {
                return { ...prev, message: 'Stash slots full! Discard one first.' };
            }
            return {
                ...prev,
                potions: addPotionToSlot(prev.potions, prev.pendingPotionReward),
                pendingPotionReward: undefined,
                message: `Acquired ${prev.pendingPotionReward.name}!`
            };
        });
    };

    // Skip potion reward
    const handleSkipPotion = () => {
        setGameState(prev => ({
            ...prev,
            pendingPotionReward: undefined,
            message: 'Skipped stash item.'
        }));
    };

    const handleVictoryProceed = () => {
        // Add victory tweet to timeline if not already there
        if (currentMeso?.victoryTweet) {
            setTweetHistory(hist => {
                const isDup = hist.some(t => t.content === currentMeso.victoryTweet.content);
                return isDup ? hist : [...hist, currentMeso.victoryTweet];
            });
        }

        // Proceed to map
        setGameState(prev => {
            // Mark current node as completed
            let newMap = [...prev.map];
            if (prev.currentMapPosition) {
                const { floor, nodeId } = prev.currentMapPosition;
                newMap[floor - 1] = newMap[floor - 1].map(n =>
                    n.id === nodeId ? { ...n, completed: true } : n
                );
            }

            return {
                ...prev,
                map: newMap,
                status: 'MAP',
                message: 'Returning to map...',
                lastVictoryReward: undefined,
                rewardOptions: [],
                hand: [],
                drawPile: [],
                discardPile: [],
                exhaustPile: []
            };
        });
    };

    // Legacy handler kept for compatibility
    const handleSelectReward = (card: CardData | null) => {
        if (card) handleTakeCard(card);
        else handleSkipCard();
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
                    message: `Funding Round! Unlocked ${relic.name} perk.`
                };
            }
            if (node.type === 'opportunity') {
                // 25% Shop, 25% Monster, 50% Event
                const roll = rngRef.current ? rngRef.current.events.next() * 100 : Math.random() * 100;
                if (roll < 25) {
                    const stock = getRandomRewardCards(3, rngRef.current?.cards);
                    return { ...newState, status: 'VENDOR', vendorStock: stock, message: 'Opportunity: Hidden Vendor discovered!' };
                } else if (roll < 50) {
                    // Fight hard pool monster
                    const nextEnemies = getEncounterForFloor(node.floor, rngRef.current?.encounters);
                    return startCombat(newState, prev, nextEnemies, 'Unexpected Problem appeared!');
                }
                // 50% - Actual Event
                const randomEvent = rngRef.current
                    ? rngRef.current.events.pick(ACT1_EVENTS)
                    : ACT1_EVENTS[Math.floor(Math.random() * ACT1_EVENTS.length)];
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
                nextEnemies = getBossEncounter(rngRef.current?.encounters);
            } else if (node.type === 'elite') {
                nextEnemies = getEliteEncounter(rngRef.current?.encounters);
            } else {
                // Normal problem node
                nextEnemies = getEncounterForFloor(node.floor, rngRef.current?.encounters);
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
        // RESET STATUSES AT COMBAT START (StS behavior - statuses don't persist between combats)
        const resetStatuses = {
            vulnerable: 0, weak: 0, strength: 0, dexterity: 0,
            metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0,
            thorns: 0, antifragile: 0, artifact: 0, frail: 0,
            growth: 0, corruption: 0, combust: 0, darkEmbrace: 0,
            rage: 0, fireBreathing: 0, barricade: 0, doubleTap: 0,
            berserk: 0, brutality: 0, juggernaut: 0, tempStrength: 0
        };

        const statsWithResetStatuses = {
            ...newState.playerStats,
            statuses: resetStatuses,
            mitigation: 0 // Also reset block
        };

        // Apply Combat Start Relics
        const { stats: startStats, enemies: modifiedEnemies, message: relicMsg } = applyCombatStartRelics(statsWithResetStatuses, newState.relics, nextEnemies);

        // Get wound cards to add from relics like Cutting Corners
        const woundCards = getRelicWoundsToAdd(newState.relics);

        // Reset Deck for Combat (including any wound cards from relics)
        const cleanDeck = buildCombatDeck(prev.deck);
        const combatDeck = [...cleanDeck, ...woundCards.map(sanitizeCardForCombat)];

        // Draw Initial Hand (using Innate-aware drawing to prioritize innate cards)
        const drawCount = 5;
        const { drawn, newDraw, newDiscard } = drawCardsWithInnate(combatDeck, drawCount);

        // Check for Secret Weapon relic (start with a skill card in hand)
        const secretWeaponCard = getSecretWeaponCard(newState.relics, combatDeck);
        let finalHand = [...drawn];
        let finalDraw = [...newDraw];

        if (secretWeaponCard) {
            // Find and remove the card from draw pile, add to hand
            const idx = finalDraw.findIndex(c => c.id === secretWeaponCard.id);
            if (idx !== -1) {
                finalDraw.splice(idx, 1);
                finalHand.push(secretWeaponCard);
            }
        }

        // Process Initial Draw (e.g. Legacy Code)
        const startStatsWithRelics = {
            ...startStats,
            bandwidth: getTurnStartBandwidth(prev.relics),
        };

        const processed = processDrawnCards(finalHand, [], newDiscard, finalDraw, startStatsWithRelics, relicMsg ? `${encounterMessage} ${relicMsg}` : encounterMessage);

        return {
            ...newState,
            status: 'PLAYING',
            enemies: modifiedEnemies,
            playerStats: processed.stats,
            message: processed.message,
            turn: 1,
            drawPile: processed.drawPile,
            hand: processed.hand,
            discardPile: processed.discard,
            exhaustPile: [],
            deck: cleanDeck
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
        if (gameState.playerStats.capital < price) return;
        setPendingRemovalPrice(price);
        setViewingPile('remove');
    };

    const handleConfirmCardRemoval = (card: CardData) => {
        setGameState(prev => ({
            ...prev,
            playerStats: { ...prev.playerStats, capital: prev.playerStats.capital - pendingRemovalPrice },
            deck: prev.deck.filter(c => c.id !== card.id),
            message: `Removed ${card.name} from codebase.`
        }));
        setViewingPile(null);
        setPendingRemovalPrice(0);
    };


    // --- Event Actions ---

    const handleEventChoice = (choice: EventChoice) => {
        setGameState(prev => {
            let newStats = { ...prev.playerStats };
            let newDeck = [...prev.deck];
            let newRelics = [...prev.relics];
            let message = '';
            let pendingChoiceEffect: EventEffect | null = null;

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
                        const cardRarityPool = effect.cardRarity === 'random'
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
                        // Random upgrade with explicit UI feedback
                        const upgradedCards: string[] = [];
                        for (let i = 0; i < (effect.value || 1); i++) {
                            const upgradeable = newDeck.filter(c => !c.name.endsWith('+'));
                            if (upgradeable.length > 0) {
                                const cardToUpgrade = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                                const idx = newDeck.findIndex(c => c.id === cardToUpgrade.id);
                                if (idx !== -1) {
                                    const oldName = newDeck[idx].name;
                                    newDeck[idx] = upgradeCard(newDeck[idx]);
                                    upgradedCards.push(`${oldName} → ${newDeck[idx].name}`);
                                }
                            }
                        }
                        if (upgradedCards.length > 0) {
                            message += ` ⬆️ Upgraded: ${upgradedCards.join(', ')}.`;
                        }
                        break;
                    case 'upgrade_card_choice':
                    case 'remove_card_choice':
                    case 'transform_card_choice':
                    case 'exhaust_card_choice':
                        // These are handled specially - require pendingEventChoice
                        pendingChoiceEffect = effect;
                        break;
                    case 'gain_max_hp':
                        newStats.maxHp += effect.value || 0;
                        newStats.hp = Math.min(newStats.hp + (effect.value || 0), newStats.maxHp);
                        message += ` +${effect.value} max Runway.`;
                        break;
                    case 'transform_card':
                        for (let i = 0; i < (effect.value || 1); i++) {
                            if (newDeck.length > 5) {
                                const idx = Math.floor(Math.random() * newDeck.length);
                                const removed = newDeck.splice(idx, 1)[0];
                                const replacement = getRandomRewardCards(1)[0];
                                newDeck.push(replacement);
                                message += ` 🔄 Transformed ${removed.name} → ${replacement.name}.`;
                            }
                        }
                        break;
                    case 'gain_strength':
                        newStats.statuses.strength += effect.value || 0;
                        message += ` Gained ${effect.value} permanent Velocity.`;
                        break;
                    case 'gain_relic':
                        const ownedRelicIds = newRelics.map(pr => pr.id);
                        const availableRelicsForEvent = Object.values(GAME_DATA.relics).filter(r => !ownedRelicIds.includes(r.id));
                        const relicRarityPool = effect.relicRarity
                            ? availableRelicsForEvent.filter(r => r.rarity === effect.relicRarity)
                            : availableRelicsForEvent;
                        const candidates = relicRarityPool.length > 0 ? relicRarityPool : availableRelicsForEvent;
                        if (candidates.length > 0) {
                            const relicChoice = candidates[Math.floor(Math.random() * candidates.length)];
                            newRelics.push(relicChoice);
                            message += ` Gained relic: ${(relicChoice as RelicData).name}.`;
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
                        const chancePercent = effect.chance || 50;
                        if (successRoll < chancePercent) {
                            message += ` 🎲 SUCCESS! (rolled ${Math.floor(successRoll)}/${chancePercent})`;
                            effect.successEffects?.forEach(e => processEffect(e));
                        } else {
                            message += ` 🎲 FAILED! (rolled ${Math.floor(successRoll)}/${chancePercent})`;
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

            // Check for choice-based effects that require card selection
            if (pendingChoiceEffect) {
                // Map effect type to selection action
                const actionMap: Record<string, 'upgrade' | 'exhaust' | 'remove' | 'transform'> = {
                    'upgrade_card_choice': 'upgrade',
                    'remove_card_choice': 'remove',
                    'transform_card_choice': 'transform',
                    'exhaust_card_choice': 'exhaust'
                };
                const action = actionMap[pendingChoiceEffect.type] || 'upgrade';
                const count = pendingChoiceEffect.value || 1;

                const messageMap: Record<string, string> = {
                    'upgrade': 'Select a card to upgrade',
                    'remove': 'Select a card to remove',
                    'transform': 'Select a card to transform',
                    'exhaust': 'Select a card to archive'
                };

                return {
                    ...prev,
                    playerStats: newStats,
                    deck: newDeck,
                    relics: newRelics,
                    status: 'CARD_SELECTION',
                    pendingSelection: {
                        type: action === 'remove' ? 'exhaust' : action, // Map remove to exhaust type
                        context: 'deck' as 'hand' | 'discard_pile' | 'discard' | 'deck',
                        action: action,
                        count: count,
                        message: messageMap[action],
                        eventContext: true // Mark this as event context to return to MAP after
                    },
                    eventResult: {
                        choiceLabel: choice.label,
                        resultMessage: message.trim() || 'Select a card...',
                        success: true
                    },
                    message: messageMap[action]
                };
            }


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

            // Detect if this was a success or failure (for styling)
            const wasSuccess = message.includes('SUCCESS') || message.includes('Gained') || message.includes('Upgraded');

            return {
                ...prev,
                playerStats: newStats,
                deck: newDeck,
                relics: newRelics,
                map: newMap,
                status: 'EVENT',
                eventResult: {
                    choiceLabel: choice.label,
                    resultMessage: message.trim(),
                    success: wasSuccess
                },
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
        resetPostMortemState(); // Clear post-mortem state for new run
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

                    <button onClick={() => devTriggerEvent()} className="flex items-center gap-2 text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20 p-2 rounded transition text-left">
                        <HelpCircle size={14} /> Trigger Random Event
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
                        Archive Pile: {gameState.exhaustPile.length}
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
                            THE NEXT BIG THING
                        </h1>
                        <p className="font-mono text-gray-400 mt-2 tracking-widest uppercase text-sm">Pre-Alpha Build v0.14</p>
                    </div>

                    <p className="max-w-md text-center text-gray-300 font-sans leading-relaxed">
                        A roguelite deckbuilder where your health is your runway. Survive the market, defeat technical debt, and reach the IPO.
                    </p>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => setGameState(prev => ({ ...prev, status: 'CHARACTER_SELECT' }))}
                            className="group relative px-8 py-4 bg-primary text-black font-bold font-mono text-lg uppercase tracking-wider rounded-sm hover:bg-white hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(0,255,136,0.4)]"
                        >
                            Initialize Startup
                            <div className="absolute inset-0 border-2 border-white/20 rounded-sm scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
                        </button>
                        <button
                            onClick={() => setShowCardCompendium(true)}
                            className="group relative px-6 py-3 bg-gray-800 border border-gray-600 text-gray-300 font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-gray-700 hover:text-white hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <BookOpen size={18} />
                            Card Compendium
                        </button>
                        <button
                            onClick={() => setShowEnemyCompendium(true)}
                            className="group relative px-6 py-3 bg-gray-800 border border-gray-600 text-gray-300 font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-gray-700 hover:text-white hover:border-red-500/50 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Skull size={18} />
                            Enemy Compendium
                        </button>
                    </div>
                </div>

                {/* Card Compendium Modal - rendered inside MENU so it shows */}
                {showCardCompendium && (
                    <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <BookOpen size={28} className="text-primary" />
                                <h2 className="text-2xl font-display font-bold text-white">Card Compendium</h2>
                                <span className="text-gray-500 font-mono text-sm">
                                    ({Object.keys(GAME_DATA.cards).length} cards)
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Curate Mode Toggle */}
                                <button
                                    onClick={() => setCurateMode(!curateMode)}
                                    className={`px-4 py-2 rounded-lg font-mono text-sm transition-all flex items-center gap-2 ${curateMode
                                        ? 'bg-primary text-black'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    🎨 Curate Mode {curateMode ? 'ON' : 'OFF'}
                                    {getCuratedCount() > 0 && (
                                        <span className="bg-black/30 px-2 py-0.5 rounded text-xs">
                                            {getCuratedCount()} curated
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowCardCompendium(false)}
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={24} className="text-gray-400 hover:text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Curate Mode Instructions */}
                        {curateMode && (
                            <div className="bg-primary/10 border-b border-primary/30 px-6 py-3 text-center text-primary font-mono text-sm">
                                🎨 Click any card to choose from 12 GIF alternatives
                            </div>
                        )}

                        {/* Scrollable Card Grid */}
                        <div className="flex-1 overflow-auto p-6">
                            {/* Group cards by rarity */}
                            {(['starter', 'common', 'uncommon', 'rare', 'status'] as const).map(rarity => {
                                const cardsOfRarity = Object.values(GAME_DATA.cards).filter(
                                    (c: CardData) => c.rarity === rarity || (rarity === 'status' && c.type === 'status')
                                );
                                if (cardsOfRarity.length === 0) return null;

                                const rarityColors: Record<string, string> = {
                                    starter: 'text-gray-400 border-gray-600',
                                    common: 'text-gray-300 border-gray-500',
                                    uncommon: 'text-blue-400 border-blue-500/50',
                                    rare: 'text-yellow-400 border-yellow-500/50',
                                    status: 'text-red-400 border-red-500/50'
                                };

                                const rarityLabels: Record<string, string> = {
                                    starter: '🎯 Starter Cards',
                                    common: '📦 Common Cards',
                                    uncommon: '💎 Uncommon Cards',
                                    rare: '⭐ Rare Cards',
                                    status: '🐛 Status Cards'
                                };

                                return (
                                    <div key={rarity} className="mb-10">
                                        <h3 className={`text-lg font-display font-bold mb-4 pb-2 border-b ${rarityColors[rarity]}`}>
                                            {rarityLabels[rarity]}
                                            <span className="ml-2 text-sm font-mono text-gray-500">
                                                ({cardsOfRarity.length})
                                            </span>
                                        </h3>
                                        <div className="flex flex-wrap gap-4">
                                            {cardsOfRarity.map((card: CardData) => (
                                                <div
                                                    key={card.id}
                                                    className={`relative transform hover:scale-105 transition-transform ${curateMode ? 'cursor-pointer' : ''
                                                        }`}
                                                    onClick={async () => {
                                                        if (curateMode) {
                                                            setCuratingCard({ cardId: card.id, options: [], loading: true });
                                                            const options = await searchMultipleGifsForCard(card.id, 12);
                                                            setCuratingCard({ cardId: card.id, options, loading: false });
                                                        }
                                                    }}
                                                >
                                                    {/* Curated indicator */}
                                                    {isCardCurated(card.id) && (
                                                        <div className="absolute -top-2 -right-2 z-10 bg-primary text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                            ✓
                                                        </div>
                                                    )}
                                                    <Card
                                                        card={card}
                                                        onDragStart={() => { }}
                                                        disabled={false}
                                                        gifUrl={curatedGifs[card.id] || getCardGifUrl(card.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-700 text-center text-gray-500 text-sm font-mono">
                            {curateMode
                                ? '🎨 Click cards to curate • Selections are saved automatically'
                                : 'Hover over cards to see tooltips • GIFs are fetched from Giphy'
                            }
                        </div>

                        {/* GIF Picker Modal */}
                        {curatingCard && (
                            <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-8">
                                <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col border border-gray-700">
                                    <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-display font-bold text-white">
                                                Choose GIF for: {GAME_DATA.cards[curatingCard.cardId as keyof typeof GAME_DATA.cards]?.name || curatingCard.cardId}
                                            </h3>
                                            <button
                                                onClick={() => setCuratingCard(null)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <X size={20} className="text-gray-400 hover:text-white" />
                                            </button>
                                        </div>
                                        {/* Search Bar */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder={`Search Giphy... (default: ${CARD_GIF_SEARCH_TERMS[curatingCard.cardId] || 'no default'})`}
                                                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-primary"
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        const input = e.currentTarget;
                                                        const term = input.value.trim();
                                                        if (term) {
                                                            setCuratingCard(prev => prev ? { ...prev, loading: true } : null);
                                                            const options = await searchGifsByCustomTerm(term, 12);
                                                            setCuratingCard(prev => prev ? { ...prev, options, loading: false } : null);
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={async () => {
                                                    const input = document.querySelector('input[placeholder^="Search Giphy"]') as HTMLInputElement;
                                                    const term = input?.value.trim();
                                                    if (term) {
                                                        setCuratingCard(prev => prev ? { ...prev, loading: true } : null);
                                                        const options = await searchGifsByCustomTerm(term, 12);
                                                        setCuratingCard(prev => prev ? { ...prev, options, loading: false } : null);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-primary text-black rounded-lg font-mono text-sm hover:bg-primary/80 transition-colors"
                                            >
                                                Search
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4">
                                        {curatingCard.loading ? (
                                            <div className="flex items-center justify-center h-40 text-gray-400">
                                                <RefreshCw className="animate-spin mr-2" size={20} />
                                                Loading GIF options...
                                            </div>
                                        ) : curatingCard.options.length === 0 ? (
                                            <div className="flex items-center justify-center h-40 text-gray-400">
                                                No GIFs found for this card
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                                {curatingCard.options.map((url, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setCuratedCardGif(curatingCard.cardId, url);
                                                            setCuratedGifs(prev => ({ ...prev, [curatingCard.cardId]: url }));
                                                            setCuratingCard(null);
                                                        }}
                                                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:scale-105 bg-gray-800"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Option ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-primary/0 hover:bg-primary/20 transition-colors flex items-center justify-center">
                                                            <span className="opacity-0 hover:opacity-100 text-white font-bold text-2xl drop-shadow-lg">✓</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Enemy Compendium Modal */}
                {showEnemyCompendium && (
                    <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <Skull size={28} className="text-red-500" />
                                <h2 className="text-2xl font-display font-bold text-white">Enemy Compendium</h2>
                                <span className="text-gray-500 font-mono text-sm">
                                    ({Object.keys(GAME_DATA.enemies).length} enemies)
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Curate Mode Toggle */}
                                <button
                                    onClick={() => setCurateMode(!curateMode)}
                                    className={`px-4 py-2 rounded-lg font-mono text-sm transition-all flex items-center gap-2 ${curateMode
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    🎨 Curate Mode {curateMode ? 'ON' : 'OFF'}
                                    {getCuratedEnemyCount() > 0 && (
                                        <span className="bg-black/30 px-2 py-0.5 rounded text-xs">
                                            {getCuratedEnemyCount()} curated
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowEnemyCompendium(false)}
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={24} className="text-gray-400 hover:text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Curate Mode Instructions */}
                        {curateMode && (
                            <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3 text-center text-red-400 font-mono text-sm">
                                🎨 Click any enemy to choose from 12 GIF alternatives
                            </div>
                        )}

                        {/* Scrollable Enemy Grid */}
                        <div className="flex-1 overflow-auto p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {Object.values(GAME_DATA.enemies).map((enemy: EnemyData) => {
                                    const gifUrl = curatedEnemyGifs[enemy.emoji] || (isEnemyCurated(enemy.emoji) ? undefined : undefined);
                                    return (
                                        <div
                                            key={enemy.id}
                                            className={`relative bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500/50 transition-all ${curateMode ? 'cursor-pointer hover:scale-105' : ''
                                                }`}
                                            onClick={async () => {
                                                if (curateMode) {
                                                    setCuratingEnemy({ emoji: enemy.emoji, name: enemy.name, options: [], loading: true });
                                                    const options = await searchMultipleGifsForEnemy(enemy.emoji, 12);
                                                    setCuratingEnemy({ emoji: enemy.emoji, name: enemy.name, options, loading: false });
                                                }
                                            }}
                                        >
                                            {/* Curated indicator */}
                                            {isEnemyCurated(enemy.emoji) && (
                                                <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                    ✓
                                                </div>
                                            )}

                                            {/* GIF/Emoji Display */}
                                            <div className="aspect-square rounded-lg bg-gray-900 mb-3 flex items-center justify-center overflow-hidden">
                                                {curatedEnemyGifs[enemy.emoji] || isEnemyCurated(enemy.emoji) ? (
                                                    <img
                                                        src={curatedEnemyGifs[enemy.emoji] || ''}
                                                        alt={enemy.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            // Fallback to emoji if GIF fails
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <span className={`text-4xl ${(curatedEnemyGifs[enemy.emoji] || isEnemyCurated(enemy.emoji)) ? 'hidden' : ''}`}>
                                                    {enemy.emoji}
                                                </span>
                                            </div>

                                            {/* Enemy Info */}
                                            <div className="text-center">
                                                <div className="text-sm font-bold text-white">{enemy.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">{enemy.emoji}</div>
                                                <div className="text-xs text-gray-500 mt-1">{enemy.type}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-700 text-center text-gray-500 text-sm font-mono">
                            {curateMode
                                ? '🎨 Click enemies to curate • Selections are saved automatically'
                                : 'Enemies grouped by type • GIFs fetched from Giphy'
                            }
                        </div>

                        {/* GIF Picker Modal for Enemies */}
                        {curatingEnemy && (
                            <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-8">
                                <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col border border-gray-700">
                                    <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-display font-bold text-white">
                                                Choose GIF for: {curatingEnemy.name} {curatingEnemy.emoji}
                                            </h3>
                                            <button
                                                onClick={() => setCuratingEnemy(null)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <X size={20} className="text-gray-400 hover:text-white" />
                                            </button>
                                        </div>
                                        {/* Search Bar */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder={`Search Giphy... (default: ${EMOJI_SEARCH_TERMS[curatingEnemy.emoji] || curatingEnemy.emoji})`}
                                                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-red-500"
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        const input = e.currentTarget;
                                                        const term = input.value.trim();
                                                        if (term) {
                                                            setCuratingEnemy(prev => prev ? { ...prev, loading: true } : null);
                                                            const options = await searchGifsByCustomTerm(term, 12);
                                                            setCuratingEnemy(prev => prev ? { ...prev, options, loading: false } : null);
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={async () => {
                                                    const input = document.querySelector('input[placeholder^="Search Giphy"]') as HTMLInputElement;
                                                    const term = input?.value.trim();
                                                    if (term) {
                                                        setCuratingEnemy(prev => prev ? { ...prev, loading: true } : null);
                                                        const options = await searchGifsByCustomTerm(term, 12);
                                                        setCuratingEnemy(prev => prev ? { ...prev, options, loading: false } : null);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-mono text-sm hover:bg-red-400 transition-colors"
                                            >
                                                Search
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4">
                                        {curatingEnemy.loading ? (
                                            <div className="flex items-center justify-center h-40 text-gray-400">
                                                <RefreshCw className="animate-spin mr-2" size={20} />
                                                Loading GIF options...
                                            </div>
                                        ) : curatingEnemy.options.length === 0 ? (
                                            <div className="flex items-center justify-center h-40 text-gray-400">
                                                No GIFs found - try a custom search above
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                                {curatingEnemy.options.map((url, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setCuratedEnemyGif(curatingEnemy.emoji, url);
                                                            setCuratedEnemyGifsState(prev => ({ ...prev, [curatingEnemy.emoji]: url }));
                                                            setCuratingEnemy(null);
                                                        }}
                                                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-red-500 transition-all hover:scale-105 bg-gray-800"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Option ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-red-500/0 hover:bg-red-500/20 transition-colors flex items-center justify-center">
                                                            <span className="opacity-0 hover:opacity-100 text-white font-bold text-2xl drop-shadow-lg">✓</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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

    // --- FRIENDS & FAMILY ROUND (Neow's Blessing) ---

    const handleSelectBlessing = (blessing: NeowBlessing) => {
        setGameState(prev => {
            let newStats = { ...prev.playerStats };
            let newDeck = [...prev.deck];
            let newRelics = [...prev.relics];
            let newDrawPile = [...prev.drawPile];
            let message = `${blessing.giver}: ${blessing.description}`;

            // Track if we need card selection UI
            let needsCardSelection = false;
            let pendingSelection: GameState['pendingSelection'] = undefined;

            // First, process downside if present (downsides apply immediately)
            if (blessing.downside) {
                const { type, value, percent } = blessing.downside;
                if (type === 'max_hp' && percent) {
                    const loss = Math.floor(newStats.maxHp * Math.abs(percent) / 100);
                    newStats.maxHp -= loss;
                    newStats.hp = Math.min(newStats.hp, newStats.maxHp);
                }
                if (type === 'heal' && value && value < 0) {
                    newStats.hp = Math.max(1, newStats.hp + value);
                }
                if (type === 'composite') {
                    // Add burnout curse
                    const burnout = GAME_DATA.cards.status_burnout;
                    if (burnout) {
                        newDeck.push({ ...burnout, id: `burnout_${Date.now()}` });
                        newDrawPile.push({ ...burnout, id: `burnout_${Date.now()}_draw` });
                    }
                }
            }

            // Process blessing effects
            for (const effect of blessing.effects) {
                switch (effect.type) {
                    case 'heal':
                        if (effect.percent) {
                            newStats.hp = Math.min(newStats.maxHp, Math.floor(newStats.maxHp * (effect.percent / 100)));
                        } else if (effect.value) {
                            newStats.hp = Math.min(newStats.maxHp, newStats.hp + effect.value);
                        }
                        break;

                    case 'max_hp':
                        newStats.maxHp += effect.value || 0;
                        newStats.hp += effect.value || 0;
                        break;

                    case 'gold':
                        newStats.capital += effect.value || 0;
                        break;

                    case 'random_card':
                        const cards = getRandomRewardCards(effect.value || 1);
                        newDeck = [...newDeck, ...cards];
                        break;

                    case 'random_relic':
                        const availableRelics = Object.values(GAME_DATA.relics).filter(
                            r => !newRelics.some(nr => nr.id === r.id) && r.rarity !== 'starter'
                        );
                        if (availableRelics.length > 0) {
                            const relic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                            newRelics.push(relic);
                            message += ` Gained ${relic.name}!`;
                        }
                        break;

                    // === CARD SELECTION REQUIRED EFFECTS ===
                    case 'upgrade_card':
                        needsCardSelection = true;
                        pendingSelection = {
                            type: 'upgrade',
                            context: 'deck',
                            action: 'upgrade',
                            count: effect.value || 1,
                            message: 'Select a card to upgrade',
                            eventContext: false // Not an event, but blessing
                        };
                        break;

                    case 'remove_card':
                        needsCardSelection = true;
                        pendingSelection = {
                            type: 'remove',
                            context: 'deck',
                            action: 'remove',
                            count: effect.value || 1,
                            message: 'Select a card to remove',
                            eventContext: false
                        };
                        break;

                    case 'transform_card':
                        needsCardSelection = true;
                        pendingSelection = {
                            type: 'transform',
                            context: 'deck',
                            action: 'transform',
                            count: effect.value || 1,
                            message: 'Select a card to transform',
                            eventContext: false
                        };
                        break;

                    case 'boss_relic':
                        // Swap starter relic for random boss relic
                        const bossRelics = Object.values(GAME_DATA.relics).filter(r => r.rarity === 'boss');
                        if (bossRelics.length > 0) {
                            const bossRelic = bossRelics[Math.floor(Math.random() * bossRelics.length)];
                            newRelics = [bossRelic]; // Replace starter
                            message += ` Swapped for ${bossRelic.name}!`;
                        }
                        break;
                }
            }

            // If card selection is needed, go to CARD_SELECTION status
            if (needsCardSelection && pendingSelection) {
                return {
                    ...prev,
                    playerStats: newStats,
                    deck: newDeck,
                    drawPile: newDrawPile,
                    relics: newRelics,
                    status: 'CARD_SELECTION' as const,
                    pendingSelection: {
                        ...pendingSelection,
                        eventContext: false // After selection, go to MAP
                    },
                    pendingBlessingOptions: undefined,
                    message: pendingSelection.message || message
                };
            }

            // Otherwise, go directly to MAP
            return {
                ...prev,
                playerStats: newStats,
                deck: newDeck,
                drawPile: newDrawPile,
                relics: newRelics,
                status: 'MAP',
                pendingBlessingOptions: undefined,
                message
            };
        });
    };

    // === STARTUP INPUT SCREEN ===
    // Collect startup name and one-liner before starting the run

    const handleStartupSubmit = async () => {
        if (!startupNameInput.trim() || !startupOneLinerInput.trim()) {
            setNarrativeError('Please enter both a startup name and one-liner');
            return;
        }

        // Save API key if provided
        if (apiKeyInput.trim()) {
            setGeminiApiKey(apiKeyInput.trim());
            setProgressiveApiKey(apiKeyInput.trim());
        }

        // Clear previous narrative cache for new run
        clearNarrativeCache();

        const context: StartupContext = {
            name: startupNameInput.trim(),
            oneLiner: startupOneLinerInput.trim()
        };

        // Update game state with startup info
        setGameState(prev => ({
            ...prev,
            startupName: context.name,
            startupOneLiner: context.oneLiner,
            message: 'Generating your startup story...'
        }));

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[PROGRESSIVE] Starting narrative generation');
        console.log('[PROGRESSIVE] Startup:', context.name);
        console.log('[PROGRESSIVE] Using Progressive System:', useProgressiveNarrative);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        setNarrativeLoading(true);
        setNarrativeError(null);

        try {
            // Generate MACRO narrative (fast - just theme, voice, key tweets, floor beats)
            console.log('[PROGRESSIVE] 🎬 Generating MACRO layer...');
            const macro = await generateMacroNarrative(context);
            setMacroNarrative(macro);

            console.log('[PROGRESSIVE] ✅ MACRO generated!');
            console.log('[PROGRESSIVE] Theme:', macro.theme);
            console.log('[PROGRESSIVE] Tone:', macro.startupTone);
            console.log('[PROGRESSIVE] Floor beats:', macro.floorBeats.length);

            // Show intro tweet immediately
            if (macro.introTweet) {
                console.log('[PROGRESSIVE] Showing intro tweet');
                setCurrentTweet(macro.introTweet);
                setTweetHistory([macro.introTweet]);
            }

            // Also set fallback actNarrative for backward compatibility
            const fallback = createFallbackNarrative(context);
            setActNarrative(fallback);

        } catch (err) {
            console.error('[PROGRESSIVE] ❌ MACRO generation failed:', err);
            // Use fallback
            const fallbackMacro = createFallbackMacro(context);
            setMacroNarrative(fallbackMacro);

            const fallback = createFallbackNarrative(context);
            setActNarrative(fallback);

            if (fallbackMacro.introTweet) {
                setCurrentTweet(fallbackMacro.introTweet);
                setTweetHistory([fallbackMacro.introTweet]);
            }
        } finally {
            setNarrativeLoading(false);
        }

        // Proceed to intro tweet screen (then to Neow's blessing)
        setGameState(prev => ({
            ...prev,
            status: 'INTRO_TWEET',
            narrativeGenerated: true
        }));
    };

    const handlePresetSelect = (preset: StartupContext) => {
        setStartupNameInput(preset.name);
        setStartupOneLinerInput(preset.oneLiner);
    };

    if (gameState.status === 'STARTUP_INPUT') {
        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#000000] flex flex-col items-center justify-center p-8 text-white">
                <div className="max-w-2xl w-full">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="text-6xl mb-4">🚀</div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-warning">
                            Name Your Startup
                        </h1>
                        <p className="text-gray-400 mt-4 max-w-lg mx-auto font-sans">
                            Every founder's journey starts with a vision. What will you build?
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-surface border border-gray-700 rounded-xl p-6 mb-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Startup Name
                            </label>
                            <input
                                type="text"
                                value={startupNameInput}
                                onChange={(e) => setStartupNameInput(e.target.value)}
                                placeholder="e.g., Serial Flicks"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                maxLength={30}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                One-Liner (the elevator pitch)
                            </label>
                            <input
                                type="text"
                                value={startupOneLinerInput}
                                onChange={(e) => setStartupOneLinerInput(e.target.value)}
                                placeholder="e.g., Netflix for book serials"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                maxLength={60}
                            />
                        </div>

                        {/* Preset Quick Picks */}
                        <div className="mt-6">
                            <p className="text-xs text-gray-500 mb-3 font-mono">OR PICK A PRESET:</p>
                            <div className="flex flex-wrap gap-2">
                                {STARTUP_PRESETS.slice(0, 6).map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => handlePresetSelect(preset)}
                                        className={`px-3 py-1.5 text-sm border rounded-full transition-all ${startupNameInput === preset.name
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-primary/50'
                                            }`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* API Key (collapsible) */}
                    <details className="bg-surface border border-gray-700 rounded-xl p-4 mb-6">
                        <summary className="cursor-pointer text-sm text-gray-400 font-mono">
                            🔑 Gemini API Key (Optional - for AI narrative)
                        </summary>
                        <div className="mt-4">
                            <input
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder="Paste your Gemini API key here..."
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Get a free key at <span className="text-primary">aistudio.google.com</span>. Without it, you'll get basic narrative.
                            </p>
                        </div>
                    </details>

                    {/* Error Message */}
                    {narrativeError && (
                        <div className="text-danger text-sm text-center mb-4 font-mono">
                            ⚠️ {narrativeError}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleStartupSubmit}
                        disabled={narrativeLoading || !startupNameInput.trim() || !startupOneLinerInput.trim()}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${narrativeLoading || !startupNameInput.trim() || !startupOneLinerInput.trim()
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary to-warning text-black hover:opacity-90'
                            }`}
                    >
                        {narrativeLoading ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                                Generating Your Story...
                            </>
                        ) : (
                            <>
                                <Rocket size={20} />
                                Launch This Startup
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // === INTRO TWEET SCREEN ===
    // Show the founder's first tweet to set the narrative tone before blessing
    if (gameState.status === 'INTRO_TWEET') {
        const introTweet = currentTweet || tweetHistory[0];

        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#000000] flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="z-10 max-w-xl w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                    {/* Header */}
                    <div className="text-center">
                        <div className="text-6xl mb-4">📱</div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-info">
                            The Beginning
                        </h1>
                        <p className="text-gray-400 mt-3 font-sans">
                            You have an idea. You share it with the world...
                        </p>
                    </div>

                    {/* The Tweet - styled like a real tweet */}
                    {introTweet && (
                        <div className="w-full bg-surface border border-gray-700 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: '0.3s' }}>
                            {/* Tweet Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl border-2 border-primary/30">
                                    🚀
                                </div>
                                <div>
                                    <div className="font-bold text-white">
                                        {gameState.startupName || 'Founder'}
                                    </div>
                                    <div className="text-gray-500 text-sm font-mono">
                                        @{(gameState.startupName || 'founder').toLowerCase().replace(/\s+/g, '')}
                                    </div>
                                </div>
                            </div>

                            {/* Tweet Content */}
                            <p className="text-lg text-white leading-relaxed mb-4">
                                {introTweet.content}
                            </p>

                            {/* Tweet Meta */}
                            <div className="flex items-center gap-6 text-gray-500 text-sm border-t border-gray-800 pt-4">
                                <span className="flex items-center gap-1">
                                    💬 0
                                </span>
                                <span className="flex items-center gap-1">
                                    🔄 0
                                </span>
                                <span className="flex items-center gap-1">
                                    ❤️ 1
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Continue button */}
                    <button
                        onClick={() => setGameState(prev => ({ ...prev, status: 'NEOW_BLESSING' }))}
                        className="group px-8 py-4 bg-primary text-black font-bold font-mono text-lg uppercase tracking-wider rounded-lg hover:bg-white hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(0,255,136,0.4)] flex items-center gap-3 animate-in fade-in duration-500"
                        style={{ animationDelay: '0.6s' }}
                    >
                        <span>Your Family Notices</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-gray-600 text-sm font-mono text-center">
                        People who believe in you are about to step forward...
                    </p>
                </div>
            </div>
        );
    }

    if (gameState.status === 'NEOW_BLESSING') {
        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#000000] flex flex-col items-center justify-center p-8 text-white">
                <div className="max-w-4xl w-full">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-warning">
                            Friends & Family Round
                        </h1>
                        <p className="text-gray-400 mt-4 max-w-lg mx-auto font-sans">
                            Before you start your venture, loved ones gather to help you get off the ground. Choose one offer of support.
                        </p>
                    </div>

                    {/* Blessing Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {gameState.pendingBlessingOptions?.map((blessing) => (
                            <button
                                key={blessing.id}
                                onClick={() => handleSelectBlessing(blessing)}
                                className="group p-6 bg-surface border-2 border-gray-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-300 text-left flex flex-col gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">{blessing.icon}</div>
                                    <div>
                                        <div className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                            {blessing.giver}
                                        </div>
                                        <div className="text-xs font-mono text-gray-500 uppercase">
                                            {blessing.category}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-300 font-sans text-sm leading-relaxed">
                                    {blessing.description}
                                </p>
                                {blessing.downside && (
                                    <div className="text-xs text-danger font-mono mt-2 border-t border-gray-800 pt-2">
                                        ⚠️ Has a downside
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Show intro tweet to set the tone */}
                <TweetSidebar
                    tweets={tweetHistory}
                    currentTweet={currentTweet}
                    onDismissCurrent={() => setCurrentTweet(null)}
                    startupName={gameState.startupName}
                />
            </div>
        );
    }

    // --- MAP SCREEN ---

    if (gameState.status === 'MAP') {
        return (
            <div className="min-h-screen bg-background text-white font-sans flex flex-col">
                <header className="h-14 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <h1 className="font-display font-bold text-lg">THE NEXT BIG THING</h1>
                        <div className="h-6 w-px bg-white/10" />
                        <span className="text-sm font-mono text-gray-400">Roadmap View</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono">
                        {/* Deck View Button */}
                        <button
                            onClick={() => setViewingPile('deck')}
                            className="px-3 py-1.5 bg-surface border border-gray-700 rounded-lg hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center gap-2 text-gray-300 hover:text-white"
                        >
                            <Layers size={14} />
                            <span>Deck ({gameState.deck.length})</span>
                        </button>
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

                {/* Deck Viewer Modal */}
                {viewingPile === 'deck' && (
                    <DeckViewer
                        title="Your Deck"
                        cards={gameState.deck}
                        onClose={() => setViewingPile(null)}
                        icon="deck"
                        emptyMessage="No cards in deck"
                    />
                )}

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
                                <Card card={card} onDragStart={() => { }} disabled={card.upgraded} gifUrl={getCardGifUrl(card.id)} />
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
            <div className="min-h-screen bg-black/90 flex flex-col items-center justify-center p-12">
                <div className="w-full max-w-5xl bg-surface border border-gray-800 rounded-2xl p-10 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
                        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                            <Store size={32} className="text-warning" /> Vendor
                        </h2>
                        <div className="flex items-center gap-2 text-warning font-mono text-xl font-bold bg-black/50 px-4 py-2 rounded">
                            <DollarSign /> {gameState.playerStats.capital}k
                        </div>
                    </div>

                    <div className="flex gap-16">
                        {/* Cards Section */}
                        <div className="flex-1">
                            <h3 className="text-gray-400 font-mono text-sm uppercase tracking-wider mb-6">Acquire Assets</h3>
                            <div className="flex flex-wrap gap-6">
                                {gameState.vendorStock?.map(card => {
                                    const canAfford = gameState.playerStats.capital >= cardPrice;
                                    return (
                                        <div key={card.id} className="flex flex-col items-center gap-3">
                                            <Card card={card} onDragStart={() => { }} disabled={!canAfford} gifUrl={getCardGifUrl(card.id)} />
                                            <button
                                                onClick={() => handleBuyCard(card, cardPrice)}
                                                disabled={!canAfford}
                                                className={`px-4 py-2 rounded text-sm font-mono flex items-center gap-1 ${canAfford ? 'bg-primary text-black hover:bg-white' : 'bg-gray-800 text-gray-500'}`}
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
                        <div className="w-72 border-l border-gray-800 pl-10">
                            <h3 className="text-gray-400 font-mono text-sm uppercase tracking-wider mb-6">Services</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-3 bg-black/40 p-5 rounded-lg border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-danger/20 flex items-center justify-center text-danger">
                                            <Trash2 size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">Cut a Feature</div>
                                            <div className="text-xs text-gray-500">Streamline your playbook. Remove one card.</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveCardService(removePrice)}
                                        disabled={gameState.playerStats.capital < removePrice}
                                        className={`w-full px-4 py-2 rounded text-sm font-mono ${gameState.playerStats.capital >= removePrice ? 'bg-danger text-white hover:bg-red-500' : 'bg-gray-800 text-gray-500'}`}
                                    >
                                        ${removePrice}k
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end">
                        <button onClick={handleLeaveNode} className="text-gray-400 hover:text-white flex items-center gap-2 font-mono">
                            Leave Shop <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Card Removal Modal */}
                {viewingPile === 'remove' && (
                    <DeckViewer
                        title="Select Card to Remove"
                        cards={gameState.deck}
                        onClose={() => { setViewingPile(null); setPendingRemovalPrice(0); }}
                        selectable={true}
                        onSelect={handleConfirmCardRemoval}
                        icon="remove"
                        emptyMessage="No cards in deck"
                    />
                )}

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

                    {/* Choices OR Result */}
                    {gameState.eventResult ? (
                        // Result Screen
                        <div className="p-6 space-y-4">
                            <div className={`p-6 rounded-xl border ${gameState.eventResult.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-full ${gameState.eventResult.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                        {gameState.eventResult.success ? (
                                            <CheckCircle2 size={28} className="text-green-400" />
                                        ) : (
                                            <X size={28} className="text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 uppercase tracking-wider">You chose</div>
                                        <div className="text-xl font-bold text-white">{gameState.eventResult.choiceLabel}</div>
                                    </div>
                                </div>

                                {/* Result details */}
                                <div className="space-y-2">
                                    {gameState.eventResult.resultMessage.split('.').filter(s => s.trim()).map((part, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">→</span>
                                            <span className={gameState.eventResult?.success ? 'text-green-300' : 'text-gray-300'}>{part.trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setGameState(prev => ({
                                    ...prev,
                                    status: 'MAP',
                                    currentEvent: undefined,
                                    eventResult: undefined
                                }))}
                                className="w-full py-3 bg-primary text-black font-bold rounded-lg hover:bg-white transition flex items-center justify-center gap-2"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    ) : (
                        // Choices
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
                    )}

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
                    <h1 className="font-display font-bold text-lg tracking-tight">THE NEXT BIG THING</h1>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex items-center gap-2 text-sm font-mono text-gray-300">
                        <span className="text-gray-500">ACT 1</span>
                        <span>The Incubator</span>
                        <span className="text-gray-600 mx-2">|</span>
                        <span className="text-primary">SPRINT {gameState.floor}</span>
                        <span className="text-gray-600 mx-2">|</span>
                        <span className="text-gray-400">TURN {gameState.turn}</span>
                    </div>

                    {/* Perk Bar */}
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2">
                        {gameState.relics.map(relic => (
                            <div key={relic.id} className="group relative w-8 h-8 rounded border border-white/20 bg-black/40 flex items-center justify-center cursor-help hover:border-warning/50 hover:bg-warning/10 transition-colors">
                                <span className="text-lg">{relic.icon}</span>
                                {/* Tooltip */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 border border-warning rounded shadow-xl hidden group-hover:block z-50">
                                    <div className="font-bold text-warning mb-1 flex items-center gap-2">
                                        <span>{relic.name}</span>
                                        <span className="text-[10px] uppercase bg-purple-500/20 px-1 rounded text-purple-300">Perk</span>
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

                    {/* Stash Bar */}
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2">
                        {gameState.potions.map((potion, index) => (
                            <div
                                key={`potion-slot-${index}`}
                                className={`group relative w-8 h-8 rounded border flex items-center justify-center transition-all cursor-pointer
                                    ${potion
                                        ? pendingPotionUse?.slotIndex === index
                                            ? 'border-primary bg-primary/30 ring-2 ring-primary animate-pulse'
                                            : 'border-info/50 bg-info/10 hover:border-info hover:bg-info/20'
                                        : 'border-white/10 bg-black/20'
                                    }
                                    ${gameState.status === 'PLAYING' && potion ? 'cursor-pointer' : 'cursor-default'}
                                `}
                                onClick={() => potion && handlePotionClick(potion, index)}
                                onContextMenu={(e) => potion && handleDiscardPotion(index, e)}
                                title={potion ? `Click to use, Right-click to discard` : 'Empty stash slot'}
                            >
                                {potion ? (
                                    <>
                                        <span className="text-lg">{potion.icon}</span>
                                        {/* Tooltip */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 border border-info rounded shadow-xl hidden group-hover:block z-50 pointer-events-none">
                                            <div className="font-bold text-info mb-1 flex items-center gap-2">
                                                <span>{potion.name}</span>
                                                <span className={`text-[10px] uppercase px-1 rounded ${potion.rarity === 'rare' ? 'bg-warning/20 text-warning' :
                                                    potion.rarity === 'uncommon' ? 'bg-info/20 text-info' :
                                                        'bg-white/10 text-gray-400'
                                                    }`}>{potion.rarity}</span>
                                            </div>
                                            <div className="text-xs text-white mb-2">{potion.description}</div>
                                            {potion.tooltip && (
                                                <div className="border-t border-gray-700 pt-2 mt-2">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{potion.tooltip.term}</div>
                                                    <div className="text-[10px] text-gray-500 italic">{potion.tooltip.definition}</div>
                                                </div>
                                            )}
                                            <div className="text-[10px] text-gray-500 mt-2 border-t border-gray-700 pt-2">
                                                <span className="text-info">Click</span> to use • <span className="text-danger">Right-click</span> to discard
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-gray-600 text-xs">○</span>
                                )}
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

            <main className="flex-1 relative flex flex-col items-center justify-end pt-32 pb-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#000000]">

                <div className="w-full max-w-7xl flex justify-between items-end px-4 mt-auto">

                    {/* Player Column */}
                    <div className="flex flex-col items-center">
                        {/* Founder Tweet Bubble - rendered above player */}
                        {founderTweet && gameState.status !== 'GAME_OVER' && (
                            <div className="flex flex-row justify-center mb-4">
                                <FounderTweetBubble
                                    tweet={founderTweet}
                                    onDismiss={() => setFounderTweet(null)}
                                />
                            </div>
                        )}

                        {/* Player Unit */}
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

                            {/* Terminal Log */}
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
                    </div>

                    <div className="flex flex-col items-center gap-2 opacity-20 select-none">
                        <div className="w-px h-12 bg-white"></div>
                        <span className="font-display font-bold text-2xl">VS</span>
                        <div className="w-px h-12 bg-white"></div>
                    </div>

                    {/* Enemies Container with Stacked Tweets */}
                    <div className="flex flex-col items-center">
                        {/* Stacked Tweet Bubbles - rendered above all enemies */}
                        {(() => {
                            const activeTweets = gameState.enemies
                                .filter(enemy => enemy.hp > 0 && gameState.status !== 'GAME_OVER' && enemyTweets[enemy.id])
                                .map(enemy => ({ enemyId: enemy.id, tweet: enemyTweets[enemy.id] }));

                            if (activeTweets.length === 0) return null;

                            return (
                                <div className="flex flex-row flex-wrap justify-center gap-3 mb-4 max-w-[700px]">
                                    {activeTweets.map(({ enemyId, tweet }) => (
                                        <div key={enemyId} className="relative" style={{ position: 'relative' }}>
                                            <EnemyTweetBubble
                                                tweet={tweet}
                                                onDismiss={() => setEnemyTweets(prev => {
                                                    const next = { ...prev };
                                                    delete next[enemyId];
                                                    return next;
                                                })}
                                                position="above"
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Enemies Row */}
                        <div className={`
                            flex flex-row flex-nowrap justify-center items-end gap-2 w-full transition-all duration-300
                            ${gameState.enemies.length > 3 ? 'scale-90' : ''}
                            ${gameState.enemies.length > 4 ? 'scale-75' : ''}
                        `}>
                            {gameState.enemies.map((enemy, index) => (
                                <div key={enemy.id} className="relative">
                                    <Unit
                                        name={enemy.name}
                                        currentHp={enemy.hp}
                                        maxHp={enemy.maxHp}
                                        emoji={enemy.emoji}
                                        gifUrl={enemyGifUrls[enemy.id]}
                                        isEnemy
                                        intent={enemy.currentIntent}
                                        statuses={enemy.statuses}
                                        description={enemy.description}
                                        onDrop={(card) => handleEnemyDrop(card, enemy.id)}
                                        isTargetable={gameState.status === 'PLAYING' || !!pendingPotionUse}
                                        isSelected={gameState.selectedEnemyId === enemy.id || (pendingPotionUse !== null)}
                                        onClick={() => {
                                            if (pendingPotionUse) {
                                                // Using potion targeting mode
                                                handlePotionTargetEnemy(enemy.id);
                                            } else {
                                                setGameState(prev => ({ ...prev, selectedEnemyId: enemy.id }));
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stash Targeting Overlay */}
                {pendingPotionUse && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-info/20 border border-info px-6 py-3 rounded-lg backdrop-blur-sm animate-pulse">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">{pendingPotionUse.potion.icon}</span>
                            <div>
                                <div className="font-bold text-info">{pendingPotionUse.potion.name}</div>
                                <div className="text-sm text-gray-300">Select a target enemy</div>
                            </div>
                            <button
                                onClick={cancelPotionTargeting}
                                className="ml-4 text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

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
                                    <Card card={card} onDragStart={() => { }} disabled={false} selectable gifUrl={getCardGifUrl(card.id)} />
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

                {/* Deck Card Selection Modal (for events) */}
                {gameState.status === 'CARD_SELECTION' && gameState.pendingSelection?.context === 'deck' && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                        <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-2">
                            {gameState.pendingSelection.action === 'upgrade' && <><Hammer className="text-warning" /> Select Card to Upgrade</>}
                            {gameState.pendingSelection.action === 'remove' && <><Trash2 className="text-danger" /> Select Card to Remove</>}
                            {gameState.pendingSelection.action === 'transform' && <><Shuffle className="text-primary" /> Select Card to Transform</>}
                        </h2>
                        <p className="text-gray-400 font-mono text-sm mb-8">{gameState.pendingSelection.message || gameState.message}</p>

                        <div className="flex flex-wrap justify-center gap-4 max-w-5xl max-h-[60vh] overflow-y-auto p-4">
                            {gameState.deck.filter(card => {
                                // For upgrade, only show non-upgraded cards (cards without '+' in name)
                                if (gameState.pendingSelection?.action === 'upgrade') {
                                    return !card.name.endsWith('+');
                                }
                                return true; // Show all for remove/transform
                            }).map((card) => (

                                <div
                                    key={card.id}
                                    onClick={() => handleCardSelection(card)}
                                    className="cursor-pointer hover:scale-105 transition-transform duration-150"
                                >
                                    <Card card={card} onDragStart={() => { }} disabled={false} selectable gifUrl={getCardGifUrl(card.id)} />
                                </div>
                            ))}
                            {gameState.deck.length === 0 && (
                                <div className="text-gray-500 italic">Deck is empty.</div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                // Cancel returns to MAP and marks node complete
                                setGameState(prev => {
                                    let newMap = [...prev.map];
                                    if (prev.pendingSelection?.eventContext && prev.currentMapPosition) {
                                        const { floor, nodeId } = prev.currentMapPosition;
                                        newMap[floor - 1] = newMap[floor - 1].map(n => n.id === nodeId ? { ...n, completed: true } : n);
                                    }
                                    return {
                                        ...prev,
                                        status: prev.pendingSelection?.eventContext ? 'MAP' : 'PLAYING',
                                        map: newMap,
                                        pendingSelection: undefined,
                                        currentEvent: undefined,
                                        message: 'Selection cancelled.'
                                    };
                                });
                            }}
                            className="mt-8 text-gray-400 hover:text-white font-mono text-sm flex items-center gap-2 border border-transparent hover:border-white/20 px-4 py-2 rounded transition-all"
                        >
                            <X size={14} /> Skip
                        </button>
                    </div>
                )}


                {/* === APPROACH OVERLAY - Combat Start === */}
                {/* Full-screen display at the beginning of each battle - shows immediately, populates when MESO ready */}
                {showApproachOverlay && gameState.status === 'PLAYING' && (
                    <ApproachTweetOverlay
                        tweet={currentMeso?.approachTweet || null}
                        startupName={gameState.startupName || 'Startup'}
                        startupEmoji={macroNarrative?.startupEmoji}
                        startupHandle={macroNarrative?.startupHandle}
                        storyPhase={macroNarrative?.floorBeats?.[gameState.floor - 1]?.storyPhase}
                        floorNumber={gameState.floor}
                        onContinue={() => setShowApproachOverlay(false)}
                    />
                )}

                {/* === VICTORY SCREEN - Split into 2 phases === */}
                {/* Phase 1: "SHIPPED!" with victory tweet + Collect Rewards button */}
                {/* Phase 2: Rewards screen + Next Challenge button */}
                {gameState.status === 'VICTORY' && (
                    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-primary/5 via-black to-black flex items-center justify-center animate-in fade-in duration-500">
                        <div className="max-w-2xl w-full p-8 flex flex-col items-center">

                            {/* ========== PHASE 1: SHIPPED + TWEET ========== */}
                            {victoryPhase === 'tweet' && (
                                <>
                                    {/* Victory celebration */}
                                    <div className="text-6xl mb-4 animate-bounce">🚀</div>
                                    <h2 className="text-3xl font-display font-bold text-primary mb-2">Shipped!</h2>
                                    <p className="text-gray-400 mb-6 text-center">Another challenge crushed. Your startup lives to fight another day.</p>

                                    {/* Tweet Display */}
                                    {currentMeso?.victoryTweet && (
                                        <div className="w-full bg-surface border border-primary/30 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(0,255,136,0.1)]">
                                            <div className="flex items-start gap-4">
                                                <div className="text-3xl bg-primary/20 rounded-full p-2">
                                                    {macroNarrative?.startupEmoji || '🚀'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-white">{gameState.startupName || 'Startup'}</span>
                                                        <span className="text-gray-500 text-sm">{macroNarrative?.startupHandle || '@startup'}</span>
                                                    </div>
                                                    <p className="text-white text-lg leading-relaxed">{currentMeso.victoryTweet.content}</p>
                                                    <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm">
                                                        <span>❤️ {currentMeso.victoryTweet.likes || 42}</span>
                                                        <span>🔁 {currentMeso.victoryTweet.retweets || 8}</span>
                                                        <span>💬 {currentMeso.victoryTweet.replies || 3}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Collect Rewards Button */}
                                    <button
                                        onClick={() => setVictoryPhase('rewards')}
                                        className="group bg-primary text-black font-bold py-4 px-10 rounded-lg hover:bg-white transition-all duration-200 font-mono text-sm uppercase tracking-wider flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                                    >
                                        <Gift size={18} />
                                        <span>Collect Rewards</span>
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <p className="text-gray-600 text-xs mt-4 font-mono">Keep building. Keep shipping. 🚀</p>
                                </>
                            )}

                            {/* ========== PHASE 2: REWARDS ========== */}
                            {victoryPhase === 'rewards' && (
                                <>
                                    {/* Rewards Header */}
                                    <div className="text-4xl mb-4">🎁</div>
                                    <h2 className="text-2xl font-display font-bold text-white mb-2">Rewards</h2>
                                    <p className="text-gray-500 mb-6 text-center text-sm">Choose what to take with you</p>

                                    {/* Rewards Section */}
                                    {gameState.lastVictoryReward && (
                                        <div className="w-full space-y-3 mb-6">
                                            {/* Gold Reward */}
                                            <div className={`bg-black/40 p-4 rounded-lg flex items-center justify-between ${gameState.lastVictoryReward.goldCollected ? 'opacity-50' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <DollarSign size={24} className="text-warning" />
                                                    <div className="text-left">
                                                        <div className="text-warning font-mono font-bold text-lg">${gameState.lastVictoryReward.capital}k Capital</div>
                                                        <div className="text-xs text-gray-500">Revenue from shipping</div>
                                                    </div>
                                                </div>
                                                {!gameState.lastVictoryReward.goldCollected ? (
                                                    <button
                                                        onClick={handleTakeGold}
                                                        className="bg-warning/20 border border-warning text-warning px-4 py-2 rounded font-mono text-sm hover:bg-warning hover:text-black transition-colors"
                                                    >
                                                        Collect
                                                    </button>
                                                ) : (
                                                    <span className="text-primary font-mono text-sm">✓ Collected</span>
                                                )}
                                            </div>

                                            {/* Card Reward */}
                                            {gameState.lastVictoryReward.cardRewards.length > 0 && (
                                                <div className={`bg-black/40 p-4 rounded-lg ${gameState.lastVictoryReward.cardCollected ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Gift size={20} className="text-primary" />
                                                        <span className="text-white font-mono">New Feature Unlocked</span>
                                                        {gameState.lastVictoryReward.cardCollected && (
                                                            <span className="text-primary font-mono text-sm ml-auto">✓ Added</span>
                                                        )}
                                                    </div>
                                                    {!gameState.lastVictoryReward.cardCollected ? (
                                                        <>
                                                            <div className="flex gap-4 justify-center mb-3">
                                                                {gameState.lastVictoryReward.cardRewards.map((card) => (
                                                                    <div
                                                                        key={card.id}
                                                                        onClick={() => handleTakeCard(card)}
                                                                        className="cursor-pointer hover:scale-105 transition-transform duration-150"
                                                                    >
                                                                        <Card card={card} onDragStart={() => { }} disabled={false} gifUrl={getCardGifUrl(card.id)} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button
                                                                onClick={handleSkipCard}
                                                                className="text-gray-500 hover:text-white font-mono text-xs flex items-center gap-1 mx-auto"
                                                            >
                                                                Skip <ArrowRight size={12} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="text-gray-500 text-sm italic">Feature added to deck</div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Perk Reward */}
                                            {gameState.lastVictoryReward.relic && (
                                                <div
                                                    onClick={!gameState.lastVictoryReward.relicCollected ? handleTakeRelic : undefined}
                                                    className={`
                                                        bg-gradient-to-r from-purple-900/40 to-purple-800/20 border border-purple-500/50 p-4 rounded-lg 
                                                        ${gameState.lastVictoryReward.relicCollected ? 'opacity-50' : 'cursor-pointer hover:border-purple-400 hover:from-purple-900/60 hover:to-purple-800/40 transition-all'}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-3xl bg-purple-900/50 p-2.5 rounded-lg border border-purple-500/30">
                                                            {gameState.lastVictoryReward.relic.icon}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className="text-purple-200 font-bold flex items-center gap-2">
                                                                {gameState.lastVictoryReward.relic.name}
                                                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Perk</span>
                                                            </div>
                                                            <div className="text-sm text-gray-400">{gameState.lastVictoryReward.relic.description}</div>
                                                        </div>
                                                        {gameState.lastVictoryReward.relicCollected ? (
                                                            <span className="text-primary font-mono text-sm">✓ Unlocked</span>
                                                        ) : (
                                                            <span className="text-purple-400 text-sm font-mono">Click to unlock</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Stash Reward */}
                                            {gameState.pendingPotionReward && (
                                                <div className="bg-gradient-to-r from-info/20 to-info/5 border border-info/50 p-4 rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-3xl bg-info/20 p-2.5 rounded-lg border border-info/30">
                                                            {gameState.pendingPotionReward.icon}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className="text-info font-bold flex items-center gap-2">
                                                                {gameState.pendingPotionReward.name}
                                                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${gameState.pendingPotionReward.rarity === 'rare' ? 'bg-warning/20 text-warning' :
                                                                    gameState.pendingPotionReward.rarity === 'uncommon' ? 'bg-info/20 text-info' :
                                                                        'bg-white/10 text-gray-400'
                                                                    }`}>{gameState.pendingPotionReward.rarity}</span>
                                                            </div>
                                                            <div className="text-sm text-gray-400">{gameState.pendingPotionReward.description}</div>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={handleTakePotion}
                                                                disabled={!canAcquirePotion(gameState.potions)}
                                                                className={`px-4 py-2 rounded font-mono text-sm transition-colors ${canAcquirePotion(gameState.potions)
                                                                    ? 'bg-info/20 border border-info text-info hover:bg-info hover:text-black'
                                                                    : 'bg-gray-800 border border-gray-600 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {canAcquirePotion(gameState.potions) ? 'Take' : 'Full'}
                                                            </button>
                                                            <button
                                                                onClick={handleSkipPotion}
                                                                className="text-gray-500 hover:text-white font-mono text-xs"
                                                            >
                                                                Skip
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Next Challenge Button */}
                                    <button
                                        onClick={handleVictoryProceed}
                                        className="group bg-primary text-black font-bold py-4 px-10 rounded-lg hover:bg-white transition-all duration-200 font-mono text-sm uppercase tracking-wider flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                                    >
                                        <span>Next Challenge</span>
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <p className="text-gray-600 text-xs mt-4 font-mono">Keep building. Keep shipping. 🚀</p>
                                </>
                            )}
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
                                    <Card card={card} onDragStart={() => { }} disabled={false} gifUrl={getCardGifUrl(card.id)} />
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
                    <PostMortemModal
                        analysis={postMortemAnalysis}
                        isLoading={postMortemLoading}
                        startupName={gameState.startupName || 'Startup'}
                        floor={gameState.floor}
                        onRestart={handleRestart}
                    />
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

                    <div
                        className="flex items-end justify-center min-h-[240px] px-4"
                        style={{ maxWidth: '900px', margin: '0 auto' }}
                    >
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

                            // Calculate overlap based on hand size
                            const handSize = gameState.hand.length;
                            const overlapAmount = handSize > 5 ? Math.min(60, (handSize - 5) * 12) : 0;

                            return (
                                <div
                                    key={card.id}
                                    className="animate-draw-card origin-bottom transition-all duration-150 hover:!z-[100] hover:-translate-y-4 hover:scale-105"
                                    style={{
                                        transform: `translateY(${index % 2 === 0 ? '0px' : '4px'}) rotate(${(index - handSize / 2) * 2}deg)`,
                                        zIndex: index,
                                        animationDelay: `${index * 30}ms`,
                                        marginLeft: index === 0 ? '0' : `-${overlapAmount}px`
                                    }}
                                    onClick={() => handleCardClick(card)}
                                >
                                    <Card
                                        card={card}
                                        onDragStart={handleDragStart}
                                        disabled={isDisabled && !isSelectionMode}
                                        selectable={gameState.status === 'DISCARD_SELECTION' || isSelectionMode}
                                        gifUrl={getCardGifUrl(card.id)}
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
                    {/* Draw Pile - Clickable */}
                    <button
                        onClick={() => setViewingPile('draw')}
                        className="flex items-center gap-3 text-xs font-mono text-gray-500 group relative hover:text-white transition-colors"
                    >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Draw Pile</span>
                        <div className="w-16 h-20 border border-gray-700 bg-gray-900 rounded flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors cursor-pointer">
                            <Layers size={20} />
                            <span className="font-bold text-white text-lg">{gameState.drawPile.length}</span>
                        </div>
                    </button>

                    {/* Discard Pile - Clickable */}
                    <button
                        onClick={() => setViewingPile('discard')}
                        className="flex items-center gap-3 text-xs font-mono text-gray-500 group relative hover:text-white transition-colors"
                    >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Discard</span>
                        <div className="w-16 h-20 border border-gray-700 bg-gray-900 rounded flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-gray-500 group-hover:bg-gray-800/50 transition-colors cursor-pointer">
                            <Archive size={20} />
                            <span className="font-bold text-white text-lg">{gameState.discardPile.length}</span>
                        </div>
                    </button>

                    {/* Exhaust Pile - Clickable */}
                    <button
                        onClick={() => setViewingPile('exhaust')}
                        className="flex items-center gap-3 text-xs font-mono text-gray-500 group relative hover:text-white transition-colors"
                    >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Archive</span>
                        <div className="w-12 h-14 border border-gray-800 bg-black/60 rounded flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-purple-500/50 group-hover:bg-purple-900/20 transition-colors cursor-pointer">
                            <Ghost size={16} />
                            <span className="font-bold text-gray-400 text-sm">{gameState.exhaustPile.length}</span>
                        </div>
                    </button>

                    {/* Deck View Button */}
                    <button
                        onClick={() => setViewingPile('deck')}
                        className="mt-2 px-3 py-1.5 text-xs font-mono bg-surface border border-gray-700 rounded hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center gap-2 text-gray-400 hover:text-white"
                    >
                        <Briefcase size={12} />
                        Deck ({gameState.deck.length})
                    </button>
                </div>
            </footer>

            {/* Pile Viewer Modals */}
            {viewingPile === 'draw' && (
                <DeckViewer
                    title="Draw Pile"
                    cards={gameState.drawPile}
                    onClose={() => setViewingPile(null)}
                    icon="draw"
                    emptyMessage="Draw pile is empty"
                />
            )}
            {viewingPile === 'discard' && (
                <DeckViewer
                    title="Discard Pile"
                    cards={gameState.discardPile}
                    onClose={() => setViewingPile(null)}
                    icon="discard"
                    emptyMessage="Discard pile is empty"
                />
            )}
            {viewingPile === 'exhaust' && (
                <DeckViewer
                    title="Exhaust (Archive) Pile"
                    cards={gameState.exhaustPile}
                    onClose={() => setViewingPile(null)}
                    icon="exhaust"
                    emptyMessage="No exhausted cards"
                />
            )}
            {viewingPile === 'deck' && (
                <DeckViewer
                    title="Your Deck"
                    cards={gameState.deck}
                    onClose={() => setViewingPile(null)}
                    icon="deck"
                    emptyMessage="No cards in deck"
                />
            )}

            {/* Secret Weapon Card Selection Modal */}
            {pendingSecretWeaponRelic && (
                <DeckViewer
                    title="Secret Weapon: Choose a Skill Card"
                    cards={gameState.deck.filter(c => c.type === 'skill')}
                    onClose={() => setPendingSecretWeaponRelic(null)}
                    icon="deck"
                    emptyMessage="No skill cards in deck"
                    selectable={true}
                    onSelect={handleSecretWeaponCardSelect}
                />
            )}

            {/* === NARRATIVE SYSTEM UI === */}
            {/* Tweet Sidebar - collapsible timeline on the right (hidden during VICTORY and GAME_OVER) */}
            {gameState.status !== 'VICTORY' && gameState.status !== 'GAME_OVER' && (
                <TweetSidebar
                    tweets={tweetHistory}
                    currentTweet={currentTweet}
                    onDismissCurrent={() => setCurrentTweet(null)}
                    startupName={gameState.startupName}
                />
            )}

            {/* === CARD COMPENDIUM MODAL === */}
            {showCardCompendium && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <BookOpen size={28} className="text-primary" />
                            <h2 className="text-2xl font-display font-bold text-white">Card Compendium</h2>
                            <span className="text-gray-500 font-mono text-sm">
                                ({Object.keys(GAME_DATA.cards).length} cards)
                            </span>
                        </div>
                        <button
                            onClick={() => setShowCardCompendium(false)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-gray-400 hover:text-white" />
                        </button>
                    </div>

                    {/* Scrollable Card Grid */}
                    <div className="flex-1 overflow-auto p-6">
                        {/* Group cards by rarity */}
                        {(['starter', 'common', 'uncommon', 'rare', 'status'] as const).map(rarity => {
                            const cardsOfRarity = Object.values(GAME_DATA.cards).filter(
                                (c: CardData) => c.rarity === rarity || (rarity === 'status' && c.type === 'status')
                            );
                            if (cardsOfRarity.length === 0) return null;

                            const rarityColors: Record<string, string> = {
                                starter: 'text-gray-400 border-gray-600',
                                common: 'text-gray-300 border-gray-500',
                                uncommon: 'text-blue-400 border-blue-500/50',
                                rare: 'text-yellow-400 border-yellow-500/50',
                                status: 'text-red-400 border-red-500/50'
                            };

                            const rarityLabels: Record<string, string> = {
                                starter: '🎯 Starter Cards',
                                common: '📦 Common Cards',
                                uncommon: '💎 Uncommon Cards',
                                rare: '⭐ Rare Cards',
                                status: '🐛 Status Cards'
                            };

                            return (
                                <div key={rarity} className="mb-10">
                                    <h3 className={`text-lg font-display font-bold mb-4 pb-2 border-b ${rarityColors[rarity]}`}>
                                        {rarityLabels[rarity]}
                                        <span className="ml-2 text-sm font-mono text-gray-500">
                                            ({cardsOfRarity.length})
                                        </span>
                                    </h3>
                                    <div className="flex flex-wrap gap-4">
                                        {cardsOfRarity.map((card: CardData) => (
                                            <div key={card.id} className="transform hover:scale-105 transition-transform">
                                                <Card
                                                    card={card}
                                                    onDragStart={() => { }}
                                                    disabled={false}
                                                    gifUrl={getCardGifUrl(card.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700 text-center text-gray-500 text-sm font-mono">
                        Hover over cards to see tooltips • GIFs are fetched from Giphy
                    </div>
                </div>
            )}

            <DevConsole />
        </div>
    );
};

export default App;
