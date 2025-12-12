// ============================================
// STARTUP TIPS STREAMING SERVICE
// ============================================
// Streams educational startup history lessons using Gemini Flash Lite
// to entertain users while the main narrative generates

import { getApiKey, getFastModel } from './settingsService';

// ============================================
// TYPES
// ============================================

export interface StreamingTipsCallbacks {
    onChunk: (text: string) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
}

export interface StartupContext {
    name: string;
    oneLiner: string;
}

// ============================================
// PROMPT BUILDING
// ============================================

function buildTipsPrompt(context: StartupContext): string {
    return `You are a wise startup mentor sharing brief, encouraging lessons from startup history.

The user is about to start building a startup called "${context.name}" - "${context.oneLiner}".

Share 2-3 quick, fascinating stories about OTHER startups that attempted something similar. Include:
- One story of a startup that SUCCEEDED despite similar challenges
- One story of a startup that FAILED but taught the industry valuable lessons
- Optionally, a surprising twist or lesser-known fact

TONE GUIDELINES:
- Simple enough for a 12-year-old to understand
- Yet insightful enough for a startup veteran to appreciate
- Encouraging and inspiring, NOT discouraging
- Frame failures as "brave attempts that paved the way"
- Frame successes as "proof it can be done"

FORMAT:
- Start with a hook like "You're not alone in this journey..."
- Keep each story to 2-3 sentences max
- Use specific company names and years when possible
- End with an encouraging phrase

Keep the TOTAL response under 200 words. Be concise but memorable.`;
}

// ============================================
// STREAMING API CALL
// ============================================

export async function streamStartupTips(
    context: StartupContext,
    callbacks: StreamingTipsCallbacks
): Promise<void> {
    const apiKey = getApiKey();

    if (!apiKey) {
        console.log('[StreamingTips] No API key available, skipping tips');
        callbacks.onComplete();
        return;
    }

    const model = getFastModel();
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    console.log('[StreamingTips] 🚀 Starting stream with model:', model);

    const requestBody = {
        contents: [{
            parts: [{ text: buildTipsPrompt(context) }]
        }],
        generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 512
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('No response body for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        console.log('[StreamingTips] 📡 Stream connected, reading chunks...');

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                console.log('[StreamingTips] ✅ Stream complete');
                callbacks.onComplete();
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            // Process SSE format: "data: {...}\n\n"
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr && jsonStr !== '[DONE]') {
                        try {
                            const data = JSON.parse(jsonStr);
                            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                console.log('[StreamingTips] 📝 Chunk:', text.substring(0, 50) + '...');
                                callbacks.onChunk(text);
                            }
                        } catch (parseError) {
                            // Skip malformed JSON chunks
                            console.warn('[StreamingTips] Skipping malformed chunk');
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('[StreamingTips] ❌ Stream error:', error);
        callbacks.onError(error as Error);
    }
}

// ============================================
// FALLBACK TIPS (offline)
// ============================================

export function getFallbackTips(): string[] {
    return [
        "You're not alone in this journey...",
        "Slack started as a gaming company called Glitch that failed spectacularly. But their internal chat tool? That became a $27 billion company.",
        "Webvan tried grocery delivery in 2001 and burned through $800M. Twenty years later, Instacart proved the timing just wasn't right back then.",
        "Every startup stands on the shoulders of brave builders who came before. Your turn now! 🚀"
    ];
}
