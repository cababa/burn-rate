import React, { useState, useEffect } from 'react';
import { Settings, Key, Cpu, Image, Check, AlertCircle, X, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import {
    GameSettings,
    TextModelOption,
    ImageModelOption,
    TEXT_MODELS,
    IMAGE_MODELS,
    loadSettings,
    saveSettings,
    validateApiKey,
    fetchAvailableModels
} from '../settingsService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<GameSettings>(loadSettings());
    const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [dirty, setDirty] = useState(false);

    // Load settings on mount
    useEffect(() => {
        if (isOpen) {
            const loaded = loadSettings();
            setSettings(loaded);
            setApiKeyInput(loaded.geminiApiKey);
            setValidationResult(null);
            setDirty(false);
        }
    }, [isOpen]);

    // Fetch available models when API key changes
    useEffect(() => {
        if (settings.geminiApiKey && validationResult?.valid) {
            fetchAvailableModels(settings.geminiApiKey).then(setAvailableModels);
        }
    }, [settings.geminiApiKey, validationResult]);

    const handleValidateApiKey = async () => {
        setValidating(true);
        const result = await validateApiKey(apiKeyInput);
        setValidationResult(result);
        setValidating(false);

        if (result.valid) {
            setSettings(prev => ({ ...prev, geminiApiKey: apiKeyInput }));
            setDirty(true);
        }
    };

    const handleSave = () => {
        saveSettings(settings);
        setDirty(false);
        onClose();
    };

    const handleModelChange = (type: 'reasoning' | 'fast' | 'image', modelId: string) => {
        if (type === 'reasoning') {
            setSettings(prev => ({ ...prev, reasoningModel: modelId as TextModelOption }));
        } else if (type === 'fast') {
            setSettings(prev => ({ ...prev, fastModel: modelId as TextModelOption }));
        } else {
            setSettings(prev => ({ ...prev, imageModel: modelId as ImageModelOption }));
        }
        setDirty(true);
    };

    const getTierBadge = (tier: 'free' | 'standard' | 'premium') => {
        const colors = {
            free: 'bg-green-100 text-green-600 border-green-200',
            standard: 'bg-blue-100 text-blue-600 border-blue-200',
            premium: 'bg-purple-100 text-purple-600 border-purple-200'
        };
        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[tier]} uppercase font-mono`}>
                {tier}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg mx-4"
                style={{ boxShadow: '12px 12px 24px #C8CED3, -12px -12px 24px #FFFFFF' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Settings size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-display font-bold text-gray-800">Settings</h2>
                            <p className="text-xs text-gray-500">Configure AI models and preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto bg-white">

                    {/* API Key Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Key size={16} className="text-amber-500" />
                            <span className="text-sm font-medium text-gray-800">Gemini API Key</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => {
                                    setApiKeyInput(e.target.value);
                                    setValidationResult(null);
                                }}
                                placeholder="Enter your Gemini API key..."
                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary/50 font-mono"
                            />
                            <button
                                onClick={handleValidateApiKey}
                                disabled={validating || !apiKeyInput}
                                className={`px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-2 transition-all ${validating || !apiKeyInput
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-100 text-primary hover:bg-green-200 border border-green-300'
                                    }`}
                            >
                                {validating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Validate
                            </button>
                        </div>
                        {validationResult && (
                            <div className={`flex items-center gap-2 text-sm ${validationResult.valid ? 'text-green-600' : 'text-red-500'}`}>
                                {validationResult.valid ? <Check size={14} /> : <AlertCircle size={14} />}
                                {validationResult.valid ? 'API key is valid!' : validationResult.error}
                            </div>
                        )}
                        <p className="text-xs text-gray-500">
                            Get your free API key from{' '}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                Google AI Studio
                            </a>
                        </p>
                    </div>

                    {/* Reasoning Model Selection (Heavy - for MACRO + Post-Mortem) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Cpu size={16} className="text-purple-500" />
                            <span className="text-sm font-medium text-gray-800">Reasoning Model</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 border border-purple-200 font-mono">HEAVY</span>
                        </div>
                        <p className="text-xs text-gray-500 -mt-1">Used for story arc generation (MACRO) and post-mortems</p>
                        <div className="space-y-2">
                            {Object.entries(TEXT_MODELS).map(([id, model]) => (
                                <button
                                    key={id}
                                    onClick={() => handleModelChange('reasoning', id)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all ${settings.reasoningModel === id
                                        ? 'bg-purple-50 border-purple-300'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                    style={{ boxShadow: settings.reasoningModel === id ? '4px 4px 8px #C8CED3, -4px -4px 8px #FFFFFF' : 'none' }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-medium text-sm ${settings.reasoningModel === id ? 'text-purple-600' : 'text-gray-800'}`}>
                                            {model.name}
                                        </span>
                                        {getTierBadge(model.tier)}
                                    </div>
                                    <p className="text-xs text-gray-500">{model.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fast Model Selection (Light - for MESO per-floor) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-500" />
                            <span className="text-sm font-medium text-gray-800">Fast Model</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 border border-blue-200 font-mono">QUICK</span>
                        </div>
                        <p className="text-xs text-gray-500 -mt-1">Used for per-floor tweet generation (MESO) during gameplay</p>
                        <div className="space-y-2">
                            {Object.entries(TEXT_MODELS).map(([id, model]) => (
                                <button
                                    key={id}
                                    onClick={() => handleModelChange('fast', id)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all ${settings.fastModel === id
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                    style={{ boxShadow: settings.fastModel === id ? '4px 4px 8px #C8CED3, -4px -4px 8px #FFFFFF' : 'none' }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-medium text-sm ${settings.fastModel === id ? 'text-blue-600' : 'text-gray-800'}`}>
                                            {model.name}
                                        </span>
                                        {getTierBadge(model.tier)}
                                    </div>
                                    <p className="text-xs text-gray-500">{model.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Model Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Image size={16} className="text-green-500" />
                            <span className="text-sm font-medium text-gray-800">Image Model</span>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(IMAGE_MODELS).map(([id, model]) => (
                                <button
                                    key={id}
                                    onClick={() => handleModelChange('image', id)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all ${settings.imageModel === id
                                        ? 'bg-green-50 border-green-300'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                    style={{ boxShadow: settings.imageModel === id ? '4px 4px 8px #C8CED3, -4px -4px 8px #FFFFFF' : 'none' }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-medium text-sm ${settings.imageModel === id ? 'text-green-600' : 'text-gray-800'}`}>
                                            {model.name}
                                        </span>
                                        {getTierBadge(model.tier)}
                                    </div>
                                    <p className="text-xs text-gray-500">{model.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Available Models Info */}
                    {availableModels.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-blue-500" />
                                <span className="text-xs font-mono text-blue-600">
                                    {availableModels.length} models available with your API key
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-500 hover:text-gray-800 font-mono text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty}
                        className={`px-6 py-2 rounded-xl font-mono text-sm flex items-center gap-2 transition-all ${dirty
                            ? 'bg-primary text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        style={dirty ? { boxShadow: '4px 4px 8px #C8CED3, -4px -4px 8px #FFFFFF' } : {}}
                    >
                        <Check size={14} />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
