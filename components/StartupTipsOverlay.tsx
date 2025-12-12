import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, Loader2, Rocket } from 'lucide-react';

interface StartupTipsOverlayProps {
    isVisible: boolean;
    streamedText: string;
    isComplete: boolean;
    onDismiss?: () => void;
}

// Simple markdown renderer - handles **bold** and *italic*
const renderMarkdown = (text: string): React.ReactNode => {
    // Split by bold markers first
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);

    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-primary font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
            return <em key={i} className="text-amber-600">{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

export const StartupTipsOverlay: React.FC<StartupTipsOverlayProps> = ({
    isVisible,
    streamedText,
    isComplete,
    onDismiss
}) => {
    const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
    const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in');

    // Split streamed text into paragraphs
    const paragraphs = useMemo(() => {
        if (!streamedText) return [];
        return streamedText
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }, [streamedText]);

    // Animate through paragraphs
    useEffect(() => {
        if (paragraphs.length === 0) return;

        // Start with fade in
        setFadeState('in');

        const fadeInTimer = setTimeout(() => {
            setFadeState('visible');
        }, 500);

        // After visible duration, fade out (unless it's the last paragraph and we're complete)
        const visibleDuration = 12000; // Show each paragraph for 12 seconds

        const fadeOutTimer = setTimeout(() => {
            // If we have more paragraphs to show, fade out current one
            if (currentParagraphIndex < paragraphs.length - 1) {
                setFadeState('out');
            } else if (!isComplete) {
                // On last paragraph but more coming, stay visible
                setFadeState('visible');
            }
        }, visibleDuration);

        // Move to next paragraph after fade out
        const nextTimer = setTimeout(() => {
            if (currentParagraphIndex < paragraphs.length - 1) {
                setCurrentParagraphIndex(prev => prev + 1);
            }
        }, visibleDuration + 500);

        return () => {
            clearTimeout(fadeInTimer);
            clearTimeout(fadeOutTimer);
            clearTimeout(nextTimer);
        };
    }, [currentParagraphIndex, paragraphs.length]);

    // Reset when new paragraphs arrive and we're on the last one
    useEffect(() => {
        if (paragraphs.length > 0 && currentParagraphIndex < paragraphs.length - 1) {
            // New paragraph arrived, ensure we advance
        }
    }, [paragraphs.length]);

    if (!isVisible) return null;

    const currentParagraph = paragraphs[Math.min(currentParagraphIndex, paragraphs.length - 1)] || '';

    // Fade animation classes
    const fadeClasses = {
        'in': 'opacity-0 translate-y-4',
        'visible': 'opacity-100 translate-y-0',
        'out': 'opacity-0 -translate-y-4'
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-md"
            style={{ background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F5F7FA 40%, #E8ECEF 100%)' }}
        >
            <div className="max-w-2xl w-full mx-8">
                {/* Header */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="p-3 bg-amber-100 rounded-full border border-amber-300">
                        <Lightbulb size={28} className="text-amber-500" />
                    </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 text-center mb-2">
                    Others Have Walked This Path...
                </h2>
                <p className="text-sm text-gray-500 font-mono text-center mb-10">
                    Learn from those who came before
                </p>

                {/* Streaming Content - Single paragraph with fade animation */}
                <div
                    className="min-h-[160px] flex items-center justify-center px-6 py-8 bg-white rounded-2xl border border-gray-200 mx-4"
                    style={{ boxShadow: '8px 8px 16px #C8CED3, -8px -8px 16px #FFFFFF' }}
                >
                    {currentParagraph ? (
                        <p
                            key={currentParagraphIndex}
                            className={`text-xl md:text-2xl text-gray-700 leading-relaxed font-sans text-center max-w-xl transition-all duration-500 ease-out ${fadeClasses[fadeState]}`}
                        >
                            {renderMarkdown(currentParagraph)}
                        </p>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                            <Loader2 className="animate-spin" size={32} />
                            <span className="font-mono text-sm">Loading startup wisdom...</span>
                        </div>
                    )}
                </div>

                {/* Progress dots */}
                {paragraphs.length > 1 && (
                    <div className="flex justify-center gap-2 mt-8 mb-8">
                        {paragraphs.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentParagraphIndex
                                    ? 'bg-primary scale-125'
                                    : idx < currentParagraphIndex
                                        ? 'bg-gray-400'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Begin Adventure button */}
                <div className="flex flex-col items-center gap-4 mt-10">
                    <button
                        onClick={onDismiss}
                        disabled={!isComplete}
                        className={`px-8 py-4 rounded-xl font-bold text-lg font-mono transition-all duration-300 flex items-center gap-3 ${isComplete
                            ? 'bg-primary text-white hover:bg-green-600 hover:scale-105 cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        style={isComplete ? { boxShadow: '8px 8px 16px #C8CED3, -8px -8px 16px #FFFFFF, 0 0 20px rgba(0,214,126,0.3)' } : {}}
                    >
                        <Rocket size={20} className={isComplete ? 'animate-bounce' : ''} />
                        {isComplete ? 'Begin Adventure' : 'Preparing your journey...'}
                    </button>

                    {!isComplete && (
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-mono">
                            <Loader2 className="animate-spin" size={14} />
                            <span>Building your startup story...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StartupTipsOverlay;
