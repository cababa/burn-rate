// ============================================
// SETTINGS SERVICE
// ============================================
// Centralized settings management with localStorage persistence
// Provides API key, model selection, and future settings

// ============================================
// TYPES
// ============================================

export interface GameSettings {
    // API Configuration
    geminiApiKey: string;

    // Model Selection - Dual Model System
    reasoningModel: TextModelOption;  // Heavy model for MACRO + Post-Mortem
    fastModel: TextModelOption;        // Fast model for MESO (per-floor)
    imageModel: ImageModelOption;

    // Display Preferences
    enableNarrativeLogging: boolean;
    autoSkipTweets: boolean;
}

export interface ModelOption {
    id: string;
    name: string;
    description: string;
    tier: 'free' | 'standard' | 'premium';
}

export type TextModelOption =
    | 'gemini-3-flash-preview'   // Newest Flash preview model (Dec 2025)
    | 'gemini-3-pro-preview'     // Newest Pro preview model (Dec 2025)
    | 'gemini-2.5-pro'           // State-of-the-art thinking model
    | 'gemini-2.5-flash'         // Best price-performance, stable
    | 'gemini-2.5-flash-lite'    // Fastest, cost-efficient
    | 'gemini-2.0-flash';        // Previous generation

export type ImageModelOption =
    | 'gemini-3-pro-image-preview'  // Gemini 3 image generation
    | 'gemini-2.5-flash-image'      // Stable image generation
    | 'imagen-3.0-generate-001';    // Imagen 3 photorealistic

// ============================================
// AVAILABLE MODELS
// ============================================

export const TEXT_MODELS: Record<TextModelOption, ModelOption> = {
    'gemini-3-flash-preview': {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash (Preview)',
        description: 'Newest and most capable Flash model (Preview)',
        tier: 'standard'
    },
    'gemini-3-pro-preview': {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro (Preview)',
        description: 'Most powerful model with advanced reasoning (Preview)',
        tier: 'premium'
    },
    'gemini-2.5-pro': {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'State-of-the-art thinking for complex problems',
        tier: 'premium'
    },
    'gemini-2.5-flash': {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Best price-performance, fast and capable',
        tier: 'standard'
    },
    'gemini-2.5-flash-lite': {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Fastest and most cost-efficient',
        tier: 'free'
    },
    'gemini-2.0-flash': {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Previous generation stable model',
        tier: 'standard'
    }
};

export const IMAGE_MODELS: Record<ImageModelOption, ModelOption> = {
    'gemini-3-pro-image-preview': {
        id: 'gemini-3-pro-image-preview',
        name: 'Gemini 3 Pro Image (Preview)',
        description: 'Latest image generation with text rendering',
        tier: 'premium'
    },
    'gemini-2.5-flash-image': {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash Image',
        description: 'Stable image generation and editing',
        tier: 'standard'
    },
    'imagen-3.0-generate-001': {
        id: 'imagen-3.0-generate-001',
        name: 'Imagen 3',
        description: 'High-fidelity photorealistic images',
        tier: 'premium'
    }
};

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_SETTINGS: GameSettings = {
    geminiApiKey: '',
    reasoningModel: 'gemini-3-flash-preview',      // Heavy for MACRO + Post-Mortem
    fastModel: 'gemini-3-flash-preview',     // Fast for MESO per-floor
    imageModel: 'gemini-2.5-flash-image',
    enableNarrativeLogging: false,
    autoSkipTweets: false
};

const STORAGE_KEY = 'game_settings';

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Load settings from localStorage
 */
export function loadSettings(): GameSettings {
    try {
        if (typeof window === 'undefined' || !window.localStorage) {
            return DEFAULT_SETTINGS;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return DEFAULT_SETTINGS;
        }

        const parsed = JSON.parse(stored);

        // Merge with defaults to handle new fields
        return {
            ...DEFAULT_SETTINGS,
            ...parsed
        };
    } catch (err) {
        console.warn('[Settings] Failed to load settings:', err);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: GameSettings): void {
    try {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        console.log('[Settings] ✅ Settings saved');
    } catch (err) {
        console.error('[Settings] Failed to save settings:', err);
    }
}

/**
 * Update a single setting
 */
export function updateSetting<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
): GameSettings {
    const current = loadSettings();
    const updated = { ...current, [key]: value };
    saveSettings(updated);
    return updated;
}

/**
 * Get the API key (also checks legacy storage location)
 */
export function getApiKey(): string {
    const settings = loadSettings();

    // First check new settings location
    if (settings.geminiApiKey) {
        return settings.geminiApiKey;
    }

    // Fallback to legacy location for backwards compatibility
    try {
        const legacy = localStorage.getItem('gemini_api_key');
        if (legacy) {
            // Migrate to new location
            updateSetting('geminiApiKey', legacy);
            localStorage.removeItem('gemini_api_key');
            console.log('[Settings] Migrated API key from legacy storage');
            return legacy;
        }
    } catch (err) {
        // Ignore
    }

    return '';
}

/**
 * Set the API key
 */
export function setApiKey(key: string): void {
    updateSetting('geminiApiKey', key);
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
    return getApiKey().length > 0;
}

/**
 * Get the reasoning model (heavy - for MACRO + Post-Mortem)
 */
export function getReasoningModel(): TextModelOption {
    return loadSettings().reasoningModel;
}

/**
 * Get the fast model (light - for MESO per-floor)
 */
export function getFastModel(): TextModelOption {
    return loadSettings().fastModel;
}

/**
 * Get the current text model (legacy - defaults to fast)
 * @deprecated Use getReasoningModel() or getFastModel() instead
 */
export function getTextModel(): TextModelOption {
    return loadSettings().fastModel;
}

/**
 * Get the current image model  
 */
export function getImageModel(): ImageModelOption {
    return loadSettings().imageModel;
}

/**
 * Get the Gemini API URL for the current text model
 */
export function getTextModelApiUrl(): string {
    const model = getTextModel();
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/**
 * Get the Gemini API URL for the current image model
 */
export function getImageModelApiUrl(): string {
    const model = getImageModel();
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/**
 * Reset all settings to defaults
 */
export function resetSettings(): GameSettings {
    saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey || apiKey.length < 10) {
        return { valid: false, error: 'API key is too short' };
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        );

        if (response.ok) {
            return { valid: true };
        }

        if (response.status === 401 || response.status === 403) {
            return { valid: false, error: 'Invalid API key' };
        }

        return { valid: false, error: `API error: ${response.status}` };
    } catch (err) {
        return { valid: false, error: 'Network error - check your connection' };
    }
}

/**
 * Fetch available models from API (for dynamic model list)
 */
export async function fetchAvailableModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            console.warn('[Settings] Failed to fetch models:', response.status);
            return [];
        }

        const data = await response.json();
        const models = (data.models || [])
            .map((m: any) => m.name?.replace('models/', '') || '')
            .filter((name: string) => name.includes('gemini') || name.includes('imagen'));

        console.log('[Settings] Available models:', models);
        return models;
    } catch (err) {
        console.warn('[Settings] Failed to fetch models:', err);
        return [];
    }
}
