import React from 'react';
import { NarrativeTweet } from '../narrativeTypes';

interface ApproachTweetOverlayProps {
    tweet: NarrativeTweet | null;  // Can be null while MESO is loading
    startupName: string;
    startupEmoji?: string;
    startupHandle?: string;
    storyPhase?: string;
    floorNumber?: number;
    onContinue: () => void;
}

/**
 * Full-screen overlay displayed at the start of each combat.
 * Shows immediately when combat starts, populates with tweet when MESO is ready.
 */
export const ApproachTweetOverlay: React.FC<ApproachTweetOverlayProps> = ({
    tweet,
    startupName,
    startupEmoji = '🚀',
    startupHandle = '@startup',
    storyPhase,
    floorNumber,
    onContinue
}) => {
    // Phase-specific styling - fully opaque backgrounds to hide battle
    const phaseStyles: Record<string, { gradient: string; verb: string; emoji: string }> = {
        hope: { gradient: 'from-blue-950 via-black to-black', verb: 'Building', emoji: '💡' },
        grind: { gradient: 'from-orange-950 via-black to-black', verb: 'Grinding', emoji: '⚡' },
        doubt: { gradient: 'from-purple-950 via-black to-black', verb: 'Pushing through', emoji: '💪' },
        breakthrough: { gradient: 'from-green-950 via-black to-black', verb: 'Breaking through', emoji: '🚀' },
        climax: { gradient: 'from-yellow-950 via-black to-black', verb: 'All in', emoji: '🎯' }
    };

    const style = phaseStyles[storyPhase || 'hope'] || phaseStyles.hope;
    const isLoading = !tweet;

    return (
        <div className={`fixed inset-0 z-[100] bg-gradient-to-b ${style.gradient} flex items-center justify-center animate-in fade-in duration-500`}>
            <div className="max-w-2xl w-full p-8 flex flex-col items-center">
                {/* Phase indicator */}
                <div className={`text-5xl mb-4 ${isLoading ? 'animate-pulse' : 'animate-bounce'}`}>{style.emoji}</div>

                {/* Header */}
                <h2 className="text-2xl font-display font-bold text-white/90 mb-2">
                    {style.verb}...
                </h2>
                {floorNumber && (
                    <p className="text-gray-500 text-sm mb-6">Sprint {floorNumber}</p>
                )}

                {/* Tweet Display - or loading state */}
                <div className="w-full bg-surface border border-white/10 rounded-2xl p-6 mb-8 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl bg-primary/20 rounded-full p-2">
                            {startupEmoji}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white">{startupName}</span>
                                <span className="text-gray-500 text-sm">{startupHandle}</span>
                            </div>
                            {isLoading ? (
                                <>
                                    {/* Loading skeleton */}
                                    <div className="space-y-2">
                                        <div className="h-5 bg-white/10 rounded animate-pulse w-3/4"></div>
                                        <div className="h-5 bg-white/10 rounded animate-pulse w-1/2"></div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 text-gray-600 text-sm">
                                        <span>❤️ --</span>
                                        <span>🔁 --</span>
                                        <span>💬 --</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-white text-lg leading-relaxed">{tweet.content}</p>
                                    <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm">
                                        <span>❤️ {tweet.likes || 12}</span>
                                        <span>🔁 {tweet.retweets || 3}</span>
                                        <span>💬 {tweet.replies || 1}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Continue Button - disabled while loading */}
                <button
                    onClick={onContinue}
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-lg font-mono text-lg transition-all duration-300 flex items-center gap-2
                        ${isLoading
                            ? 'bg-gray-800 border border-gray-600 text-gray-500 cursor-wait'
                            : 'bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-black'
                        }`}
                >
                    {isLoading ? (
                        <>Preparing... <span className="text-xl animate-pulse">⏳</span></>
                    ) : (
                        <>Let's Go <span className="text-xl">→</span></>
                    )}
                </button>
            </div>
        </div>
    );
};
