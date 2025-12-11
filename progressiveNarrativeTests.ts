import {
    generateMacroNarrative,
    generateMesoNarrative,
    getEnemyDefeatTweetProgressive,
    getEnemyIntentTweet,
    getPathPreview,
    clearNarrativeCache,
    createFallbackMacro
} from './progressiveNarrativeService.ts';
import type { StartupContext, NarrativeTweet } from './narrativeTypes.ts';
import type { MesoNarrative } from './progressiveNarrativeTypes.ts';

let passed = 0;
let failed = 0;

const context: StartupContext = {
    name: 'Test Startup',
    oneLiner: 'Ship fast, break none'
};

const assert = (condition: boolean, message: string) => {
    if (condition) {
        console.log(`✅ ${message}`);
        passed++;
    } else {
        console.error(`❌ ${message}`);
        failed++;
    }
};

const section = (title: string) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📌 ${title}`);
    console.log(`${'='.repeat(70)}`);
};

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); }
    };
};

const installMockEnv = (fetchImpl: (url: any, init?: any) => Promise<any>) => {
    const originalFetch = globalThis.fetch;
    const originalWindow = (globalThis as any).window;
    const originalLocalStorage = (globalThis as any).localStorage;

    const localStorage = createLocalStorageMock();
    (globalThis as any).window = { localStorage };
    (globalThis as any).localStorage = localStorage;
    localStorage.setItem('gemini_api_key', 'test-key');

    (globalThis as any).fetch = fetchImpl;

    return () => {
        (globalThis as any).fetch = originalFetch;
        (globalThis as any).window = originalWindow;
        (globalThis as any).localStorage = originalLocalStorage;
    };
};

const makeTweet = (content: string, author: NarrativeTweet['author'] = 'startup'): NarrativeTweet => ({
    id: `tweet_${Math.random()}`,
    author,
    handle: author === 'enemy' ? '@enemy' : '@test_startup',
    displayName: author === 'enemy' ? 'Enemy' : 'Test Startup',
    avatarEmoji: author === 'enemy' ? '😈' : '🚀',
    content,
    timestamp: 'now',
    likes: 1,
    retweets: 0,
    replies: 0
});

const buildMeso = (): MesoNarrative => ({
    nodeId: 'node_1',
    floor: 1,
    nodeType: 'problem',
    approachTweet: makeTweet('Approach'),
    victoryTweet: makeTweet('Victory'),
    enemyIntentTweets: {
        critical_bug: {
            attack: [makeTweet('attack A', 'enemy'), makeTweet('attack B', 'enemy')],
            buff: [makeTweet('buff A', 'enemy')],
            debuff: [makeTweet('debuff A', 'enemy')],
            defeat: makeTweet('defeat', 'enemy'),
            attackIndex: 0,
            buffIndex: 0,
            debuffIndex: 0
        }
    },
    cardPlayTweets: {
        attack: [makeTweet('card attack')],
        skill: [makeTweet('card skill')],
        power: [makeTweet('card power')],
        attackIndex: 0,
        skillIndex: 0,
        powerIndex: 0
    },
    pathPreviews: [
        { nodeId: 'next_1', teaser: 'Next node teaser', decisionHint: 'Choose carefully' }
    ]
});

const createGeminiResponse = (payload: any) => ({
    ok: true,
    status: 200,
    async json() {
        return {
            candidates: [{
                content: { parts: [{ text: JSON.stringify(payload) }] }
            }]
        };
    }
});

const testModelSwitchAndTimingLogs = async () => {
    section('Model switch + timing logs');
    clearNarrativeCache();

    const macroPayload = {
        theme: 'Speed Run',
        startupHandle: '@speedrun',
        startupEmoji: '⚡',
        startupTone: 'scrappy',
        introTweet: makeTweet('intro'),
        defeatTweet: makeTweet('defeat'),
        bossVictoryTweet: makeTweet('boss win'),
        floorBeats: [{ floor: 1, storyBeat: 'beat', narrativeHook: 'hook', storyPhase: 'hope' }]
    };

    let requestedUrl = '';
    const fetchMock = async (url: any) => {
        requestedUrl = String(url);
        return createGeminiResponse(macroPayload);
    };

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
        logs.push(args.join(' '));
        originalLog(...args);
    };

    const restoreEnv = installMockEnv(fetchMock);
    try {
        await generateMacroNarrative(context);
        assert(requestedUrl.includes('gemini-flash-lite-latest'), 'Uses gemini-flash-lite-latest endpoint');
        assert(logs.some(l => l.includes('Time to first byte')), 'Logs TTFB');
        assert(logs.some(l => l.includes('Response complete')), 'Logs total/parse timing');
    } finally {
        restoreEnv();
        console.log = originalLog;
    }
};

const testMesoCacheDuringPregen = async () => {
    section('Blessing pre-gen cache hit');
    clearNarrativeCache();
    const macro = createFallbackMacro(context);

    const mesoPayload = {
        approachTweet: makeTweet('approach'),
        victoryTweet: makeTweet('victory'),
        enemyIntentTweets: [{
            enemyId: 'minor_bug',
            attackTweets: [makeTweet('attack', 'enemy')],
            buffTweets: [makeTweet('buff', 'enemy')],
            debuffTweets: [makeTweet('debuff', 'enemy')],
            defeatTweet: makeTweet('defeat', 'enemy')
        }],
        cardPlayTweets: {
            attackTweets: [makeTweet('card attack')],
            skillTweets: [makeTweet('card skill')],
            powerTweets: [makeTweet('card power')]
        },
        pathPreviews: [{ nodeId: 'next', teaser: 't', decisionHint: 'h' }]
    };

    let fetchCalls = 0;
    const fetchMock = async () => {
        fetchCalls++;
        return createGeminiResponse(mesoPayload);
    };

    const restoreEnv = installMockEnv(fetchMock);
    try {
        const nodeId = 'pregen_node';
        const enemies = [{ id: 'minor_bug', name: 'Bug', type: 'enemy' }];
        const nextNodes = [{ id: 'next', type: 'enemy' }];

        await generateMesoNarrative(context, macro, nodeId, 1, 'problem', enemies, nextNodes);
        const cached = await generateMesoNarrative(context, macro, nodeId, 1, 'problem', enemies, nextNodes);

        assert(fetchCalls === 1, 'Second MESO generation reused cache (no extra fetch)');
        assert(cached.nodeId === nodeId, 'Cache returns MESO for the same node');
        assert(cached.victoryTweet.content === 'victory', 'Victory tweet available for post-combat stall');
    } finally {
        restoreEnv();
    }
};

const testEnemyIdNormalizationAndCycling = () => {
    section('Enemy ID normalization + cycling');
    const meso = buildMeso();

    const t1 = getEnemyIntentTweet(meso, 'critical_bug_1700000000000_0', 'attack');
    const t2 = getEnemyIntentTweet(meso, 'critical_bug_1700000000000_1', 'attack');
    const t3 = getEnemyIntentTweet(meso, 'critical_bug_1700000000000_2', 'attack');
    const defeat = getEnemyDefeatTweetProgressive(meso, 'critical_bug_1700000000000');

    assert(t1?.content === 'attack A', 'First normalized attack tweet served');
    assert(t2?.content === 'attack B', 'Second normalized attack tweet served');
    assert(t3?.content === 'attack A', 'Attack tweets cycle after exhausting pool');
    assert(defeat?.content === 'defeat', 'Defeat tweet returned for timestamped enemy id');
};

const testPathPreviewLookup = () => {
    section('Path preview lookup');
    const meso = buildMeso();
    const preview = getPathPreview(meso, 'next_1');
    const missing = getPathPreview(meso, 'unknown');

    assert(preview?.nodeId === 'next_1', 'Returns path preview for existing node');
    assert(missing === null, 'Returns null when preview is missing');
};

const testFallbackOnApiFailure = async () => {
    section('API failure fallback without cache pollution');
    clearNarrativeCache();
    const macro = createFallbackMacro(context);

    let fetchCalls = 0;
    const fetchMock = async () => {
        fetchCalls++;
        throw new Error('network down');
    };

    const restoreEnv = installMockEnv(fetchMock);
    try {
        const nodeId = 'failed_node';
        const enemies = [{ id: 'enemy_one', name: 'Enemy', type: 'enemy' }];
        const nextNodes = [{ id: 'next', type: 'enemy' }];

        const meso = await generateMesoNarrative(context, macro, nodeId, 1, 'problem', enemies, nextNodes);

        assert(fetchCalls === 1, 'Attempts API call once before fallback');
        assert(meso.enemyIntentTweets['enemy_one'] !== undefined, 'Fallback MESO includes enemy tweets');
        assert(getPathPreview(meso, 'next') === null, 'Fallback MESO has no path previews by default');
    } finally {
        restoreEnv();
    }
};

const run = async () => {
    await testModelSwitchAndTimingLogs();
    await testMesoCacheDuringPregen();
    testEnemyIdNormalizationAndCycling();
    testPathPreviewLookup();
    await testFallbackOnApiFailure();

    console.log(`\nTests complete: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exitCode = 1;
    }
};

run();
