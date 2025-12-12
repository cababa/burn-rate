// ============================================
// FOUNDER TWEET BUBBLE - Speech Bubble Component
// ============================================
// Displays a tweet bubble near the player unit during enemy turn

import React from 'react';
import { NarrativeTweet } from '../narrativeTypes.ts';
import { Heart, Repeat2, MessageCircle, X } from 'lucide-react';

interface FounderTweetBubbleProps {
    tweet: NarrativeTweet | null;
    onDismiss?: () => void;
}

/**
 * Compact tweet bubble that appears near the player during enemy turn
 * Shows what the startup is "tweeting" while facing challenges
 */
export const FounderTweetBubble: React.FC<FounderTweetBubbleProps> = ({
    tweet,
    onDismiss
}) => {
    if (!tweet) return null;

    return (
        <div
            className={`
                z-40 w-64
                animate-founderBounceIn
                flex-shrink-0
            `}
        >
            {/* Tweet Bubble */}
            <div
                className="bg-white border-2 border-blue-300 rounded-xl p-3 backdrop-blur-md cursor-pointer hover:scale-[1.02] transition-all duration-200"
                style={{ boxShadow: '6px 6px 12px #C8CED3, -6px -6px 12px #FFFFFF' }}
                onClick={onDismiss}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg border border-blue-200">
                        {tweet.avatarEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-xs truncate">
                            {tweet.displayName}
                        </div>
                        <div className="text-[10px] text-gray-400">{tweet.handle}</div>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            title="Dismiss"
                        >
                            <X size={12} className="text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <p className="text-gray-800 text-xs leading-relaxed mb-2">
                    {tweet.content}
                </p>

                {/* Engagement Row */}
                <div className="flex items-center gap-3 text-gray-400 text-[10px] border-t border-gray-200 pt-2">
                    <span className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                        <MessageCircle size={10} /> {tweet.replies}
                    </span>
                    <span className="flex items-center gap-1 hover:text-green-500 transition-colors cursor-pointer">
                        <Repeat2 size={10} /> {tweet.retweets}
                    </span>
                    <span className="flex items-center gap-1 hover:text-pink-500 transition-colors cursor-pointer">
                        <Heart size={10} /> {tweet.likes}
                    </span>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes founderBounceIn {
                    0% {
                        opacity: 0;
                        transform: translateY(10px) scale(0.95);
                    }
                    60% {
                        transform: translateY(-3px) scale(1.02);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-founderBounceIn {
                    animation: founderBounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
};

export default FounderTweetBubble;
