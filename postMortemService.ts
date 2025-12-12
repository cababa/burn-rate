// ============================================
// POST-MORTEM SERVICE - AI Startup Autopsy
// ============================================
// Generates educational post-mortem analysis when player's startup fails
// Uses Gemini to analyze game log and provide insights with real startup comparisons

import { getGeminiApiKey } from './narrativeService';

// ============================================
// TYPES
// ============================================

export interface KeyMistake {
    turn: number;
    floor: number;
    mistake: string;
    lesson: string;
}

export interface RealStartupComparison {
    name: string;
    similarity: string;
    outcome: string;
    yearFailed: number;
}

export interface PostMortemAnalysis {
    headline: string;           // "Too Much, Too Fast" - catchy title
    whatHappened: string;       // Simple 2-3 sentence explanation
    keyMistakes: KeyMistake[];  // 2-3 key mistakes from gameplay
    realStartupComparison: RealStartupComparison;
    founderAdvice: string;      // In-character advice from a "mentor"
    retryTip: string;           // Specific actionable tip for next run
}

// ============================================
// REAL STARTUP FAILURES DATABASE
// ============================================
// For fallback and enrichment - real stories that are educational

const REAL_STARTUP_FAILURES = [
    {
        name: "Quibi",
        yearFailed: 2020,
        raised: "$1.75 billion",
        whatHappened: "Made short videos for phones, but forgot people watch videos at home too",
        lesson: "Test with real users before spending big money",
        keywords: ["speed", "assumptions", "market fit"]
    },
    {
        name: "Theranos",
        yearFailed: 2018,
        raised: "$700 million",
        whatHappened: "Promised amazing blood tests but the technology didn't actually work",
        lesson: "Your product has to actually do what you say it does",
        keywords: ["hype", "promises", "foundation"]
    },
    {
        name: "WeWork",
        yearFailed: 2019,
        raised: "$12 billion",
        whatHappened: "Rented office space but spent money like they invented teleportation",
        lesson: "Growing fast means nothing if you're losing money faster",
        keywords: ["burn rate", "growth", "sustainability"]
    },
    {
        name: "Juicero",
        yearFailed: 2017,
        raised: "$120 million",
        whatHappened: "Made a $400 juice machine that squeezed bags you could squeeze by hand",
        lesson: "Sometimes the simple solution is better than the fancy one",
        keywords: ["over-engineering", "complexity", "simple"]
    },
    {
        name: "Pets.com",
        yearFailed: 2000,
        raised: "$300 million",
        whatHappened: "Sold pet food online but shipping was so expensive they lost money on every order",
        lesson: "Revenue isn't profit - you have to make more than you spend",
        keywords: ["economics", "margins", "fundamentals"]
    },
    {
        name: "MoviePass",
        yearFailed: 2019,
        raised: "$68 million",
        whatHappened: "Let people watch unlimited movies for $10/month, lost $20+ per customer",
        lesson: "A deal that's too good to be true probably can't last",
        keywords: ["unsustainable", "pricing", "economics"]
    },
    {
        name: "Jawbone",
        yearFailed: 2017,
        raised: "$930 million",
        whatHappened: "Made fitness trackers but couldn't keep up with Apple and Fitbit",
        lesson: "Being early doesn't mean you'll win - execution matters more",
        keywords: ["competition", "execution", "market"]
    },
    {
        name: "Vine",
        yearFailed: 2016,
        raised: "Acquired for $30M, shut down",
        whatHappened: "Invented short videos before TikTok but Twitter didn't invest in it",
        lesson: "A good idea needs support and resources to grow",
        keywords: ["support", "growth", "investment"]
    }
];

// ============================================
// GEMINI API CONFIGURATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';

const POST_MORTEM_SCHEMA = {
    type: "object",
    properties: {
        headline: {
            type: "string",
            description: "A catchy 3-5 word title for this failure, like a newspaper headline. Examples: 'Too Much, Too Fast', 'The Burnout Spiral', 'Death by Feature Creep'"
        },
        whatHappened: {
            type: "string",
            description: "2-3 simple sentences explaining what went wrong. Write like you're explaining to a smart 12-year-old. No jargon."
        },
        keyMistakes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    turn: { type: "number", description: "Which turn/round this happened" },
                    floor: { type: "number", description: "Which sprint/floor this happened" },
                    mistake: { type: "string", description: "What went wrong, in simple words" },
                    lesson: { type: "string", description: "What to do differently next time" }
                },
                required: ["turn", "floor", "mistake", "lesson"]
            },
            description: "2-3 specific mistakes from the game log"
        },
        realStartupComparison: {
            type: "object",
            properties: {
                name: { type: "string", description: "Name of a real startup that failed similarly" },
                similarity: { type: "string", description: "How this failure is similar, in simple terms" },
                outcome: { type: "string", description: "What happened to the real startup (e.g., 'Lost $1.75 billion')" },
                yearFailed: { type: "number", description: "Year the startup failed" }
            },
            required: ["name", "similarity", "outcome", "yearFailed"]
        },
        founderAdvice: {
            type: "string",
            description: "2-3 sentences of advice as if from a wise mentor who's been there. Warm but real."
        },
        retryTip: {
            type: "string",
            description: "One specific, actionable tip for the next run based on what went wrong"
        }
    },
    required: ["headline", "whatHappened", "keyMistakes", "realStartupComparison", "founderAdvice", "retryTip"]
};

// ============================================
// PROMPT ENGINEERING
// ============================================

function buildSystemPrompt(): string {
    return `You are a wise startup mentor writing a "post-mortem" analysis after a founder's startup failed.

YOUR VOICE:
- Warm but honest - like a mentor who cares but won't sugarcoat
- Use simple words a 12-year-old would understand
- But include insights that make experienced founders go "huh, that's actually true"
- No jargon: "ran out of money" not "depleted runway", "nobody wanted it" not "failed to achieve PMF"

YOUR GOAL:
Turn this game failure into a LEARNING MOMENT. Every failed run should teach something real about startups.

REAL STARTUP FAILURES TO REFERENCE:
${REAL_STARTUP_FAILURES.map(s => `- ${s.name} (${s.yearFailed}): ${s.whatHappened}. Lesson: ${s.lesson}`).join('\n')}

Pick the real startup that BEST matches how this player failed. Don't force it - find the genuine parallel.

KEY RULES:
1. Be SPECIFIC about what went wrong - reference actual turns and events from the log
2. Make the comparison to real startups INSIGHTFUL, not surface-level
3. The "lesson" should be something a real founder would find valuable
4. Keep everything SHORT and punchy - this is a game, not an essay
5. The headline should be memorable - something you'd see in a business magazine

EXAMPLE GOOD OUTPUT:
{
  "headline": "The Burnout Spiral",
  "whatHappened": "You pushed too hard in the early days and ran out of energy when it mattered most. By turn 8, you were taking damage faster than you could heal, and the final boss found an exhausted team.",
  "keyMistakes": [
    { "turn": 3, "floor": 2, "mistake": "Played 4 attack cards without any defense", "lesson": "Balance offense and defense - you can't ship if you're burned out" },
    { "turn": 8, "floor": 4, "mistake": "Took 25 damage with no block cards in hand", "lesson": "Always keep some safety net for surprises" }
  ],
  "realStartupComparison": {
    "name": "WeWork",
    "similarity": "Both grew fast without building sustainable foundations",
    "outcome": "Lost $40 billion in valuation in 6 weeks",
    "yearFailed": 2019
  },
  "founderAdvice": "Speed is great, but burnout is real. The founders who make it aren't the ones who work hardest - they're the ones who work longest. Pace yourself.",
  "retryTip": "Next run, try keeping at least one Skill card in hand before ending your turn - it's your safety net."
}`;
}

function buildUserPrompt(
    gameHistory: string,
    startupName: string,
    floor: number,
    oneLiner: string
): string {
    return `Analyze this startup failure:

STARTUP: ${startupName}
WHAT THEY BUILT: ${oneLiner}
REACHED SPRINT: ${floor}

GAME LOG:
${gameHistory}

Generate a post-mortem analysis. Find the KEY MOMENTS where things went wrong.
Match this failure to the MOST SIMILAR real startup failure.
Make it educational but not preachy. This should feel like wisdom, not a lecture.`;
}

// ============================================
// API CALL
// ============================================

export async function generatePostMortem(
    gameHistory: string,
    startupName: string,
    floor: number,
    oneLiner: string = 'Building something amazing'
): Promise<PostMortemAnalysis> {
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
        console.log('[PostMortem] No API key, using fallback');
        return createFallbackPostMortem(startupName, floor, gameHistory);
    }

    try {
        console.log('[PostMortem] Generating AI analysis for', startupName);

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: buildSystemPrompt() + '\n\n' + buildUserPrompt(gameHistory, startupName, floor, oneLiner) }]
                    }
                ],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: POST_MORTEM_SCHEMA,
                    temperature: 0.8,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response text from Gemini');
        }

        const analysis = JSON.parse(text) as PostMortemAnalysis;
        console.log('[PostMortem] ✅ Generated:', analysis.headline);
        return analysis;

    } catch (error) {
        console.error('[PostMortem] Generation failed:', error);
        return createFallbackPostMortem(startupName, floor, gameHistory);
    }
}

// ============================================
// FALLBACK POST-MORTEM
// ============================================

function analyzeGameHistory(gameHistory: string): { damageTaken: number; cardsPlayed: number; enemiesDefeated: number; turnsPlayed: number } {
    const lines = gameHistory.split('\n');
    let damageTaken = 0;
    let cardsPlayed = 0;
    let enemiesDefeated = 0;
    let turnsPlayed = 0;

    for (const line of lines) {
        if (line.includes('[DAMAGE_TAKEN]')) damageTaken++;
        if (line.includes('[CARD_PLAY]')) cardsPlayed++;
        if (line.includes('[ENEMY_DEATH]') || line.includes('[COMBAT_VICTORY]')) enemiesDefeated++;
        if (line.includes('[TURN_START]') || line.includes('=== TURN')) turnsPlayed++;
    }

    return { damageTaken, cardsPlayed, enemiesDefeated, turnsPlayed };
}

function createFallbackPostMortem(
    startupName: string,
    floor: number,
    gameHistory: string
): PostMortemAnalysis {
    const stats = analyzeGameHistory(gameHistory);

    // Pick a failure pattern based on simple heuristics
    let failurePattern: 'aggressive' | 'passive' | 'unlucky' = 'unlucky';

    if (stats.damageTaken > stats.turnsPlayed * 2) {
        failurePattern = 'aggressive';
    } else if (stats.cardsPlayed < stats.turnsPlayed * 2) {
        failurePattern = 'passive';
    }

    const patterns = {
        aggressive: {
            headline: "The Burnout Spiral",
            startup: REAL_STARTUP_FAILURES.find(s => s.name === "WeWork")!,
            whatHappened: `${startupName} pushed too hard, too fast. You took a lot of hits without protecting yourself, and by Sprint ${floor}, there was nothing left in the tank.`,
            advice: "Speed kills - not your competitors, but you. The founders who make it aren't the fastest; they're the ones still standing after everyone else burned out.",
            tip: "Next run, try keeping at least one defense card ready before ending your turn."
        },
        passive: {
            headline: "Death by Hesitation",
            startup: REAL_STARTUP_FAILURES.find(s => s.name === "Vine")!,
            whatHappened: `${startupName} played it safe - maybe too safe. Without enough action, the challenges piled up faster than you could handle them.`,
            advice: "Startups die more often from inaction than from wrong action. Sometimes you just have to ship it and see what happens.",
            tip: "Next run, try playing more cards each turn - even imperfect progress beats standing still."
        },
        unlucky: {
            headline: "Wrong Place, Wrong Time",
            startup: REAL_STARTUP_FAILURES.find(s => s.name === "Pets.com")!,
            whatHappened: `${startupName} ran into challenges that were just too tough for where you were in the journey. Sometimes the market isn't ready.`,
            advice: "Not every failure is your fault. Sometimes you're just early, or unlucky, or both. The best founders fail, learn, and try again.",
            tip: "Next run, focus on building a stronger deck before taking on elite challenges."
        }
    };

    const pattern = patterns[failurePattern];

    return {
        headline: pattern.headline,
        whatHappened: pattern.whatHappened,
        keyMistakes: [
            {
                turn: Math.max(1, stats.turnsPlayed - 2),
                floor: Math.max(1, floor - 1),
                mistake: "Took too much damage without recovery",
                lesson: "Always have a backup plan for when things go wrong"
            },
            {
                turn: stats.turnsPlayed,
                floor: floor,
                mistake: "Final push wasn't enough",
                lesson: "Build momentum early so you're strong for the hard parts"
            }
        ],
        realStartupComparison: {
            name: pattern.startup.name,
            similarity: pattern.startup.whatHappened,
            outcome: `Raised ${pattern.startup.raised}, then shut down`,
            yearFailed: pattern.startup.yearFailed
        },
        founderAdvice: pattern.advice,
        retryTip: pattern.tip
    };
}
