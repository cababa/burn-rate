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
    // Phase-specific styling - light backgrounds for neomorphic look
    const phaseStyles: Record<string, { gradient: string; verb: string; emoji: string }> = {
        hope: { gradient: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F0F4FF 40%, #E8ECEF 100%)', verb: 'Building', emoji: '💡' },
        grind: { gradient: 'radial-gradient(ellipse at center, #FFFFFF 0%, #FFF4EC 40%, #E8ECEF 100%)', verb: 'Grinding', emoji: '⚡' },
        doubt: { gradient: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F4F0FF 40%, #E8ECEF 100%)', verb: 'Pushing through', emoji: '💪' },
        breakthrough: { gradient: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F0FFF4 40%, #E8ECEF 100%)', verb: 'Breaking through', emoji: '🚀' },
        climax: { gradient: 'radial-gradient(ellipse at center, #FFFFFF 0%, #FFFEF0 40%, #E8ECEF 100%)', verb: 'All in', emoji: '🎯' }
    };

    const style = phaseStyles[storyPhase || 'hope'] || phaseStyles.hope;
    const isLoading = !tweet;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-500"
            style={{ background: style.gradient }}
        >
            <div className="max-w-2xl w-full p-8 flex flex-col items-center">
                {/* Phase indicator */}
                <div className={`text-5xl mb-4 ${isLoading ? 'animate-pulse' : 'animate-bounce'}`}>{style.emoji}</div>

                {/* Header */}
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">
                    {style.verb}...
                </h2>
                {floorNumber && (
                    <p className="text-gray-500 text-sm mb-6">Sprint {floorNumber}</p>
                )}

                {/* Tweet Display - or loading state */}
                <div
                    className="w-full bg-white border border-gray-200 rounded-2xl p-6 mb-8"
                    style={{ boxShadow: '8px 8px 16px #C8CED3, -8px -8px 16px #FFFFFF' }}
                >
                    <div className="flex items-start gap-4">
                        <div className="text-3xl bg-green-100 rounded-full p-2">
                            {startupEmoji}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-800">{startupName}</span>
                                <span className="text-gray-400 text-sm">{startupHandle}</span>
                            </div>
                            {isLoading ? (
                                <>
                                    {/* Loading skeleton - subtle animation */}
                                    <div className="space-y-2">
                                        <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4"></div>
                                        <div className="h-5 bg-gray-100 rounded animate-pulse w-1/2"></div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 text-gray-400 text-sm">
                                        <span>❤️ --</span>
                                        <span>🔁 --</span>
                                        <span>💬 --</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-800 text-lg leading-relaxed">{tweet.content}</p>
                                    <div className="flex items-center gap-6 mt-4 text-gray-400 text-sm">
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
                    className={`px-8 py-3 rounded-xl font-mono text-lg transition-all duration-300 flex items-center gap-2
                        ${isLoading
                            ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-wait'
                            : 'bg-primary text-white hover:bg-green-600'
                        }`}
                    style={!isLoading ? { boxShadow: '6px 6px 12px #C8CED3, -6px -6px 12px #FFFFFF' } : {}}
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
