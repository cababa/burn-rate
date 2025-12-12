// ============================================
// ENEMY TWEET BUBBLE - Speech Bubble Component
// ============================================
// Displays a tweet bubble above/near an enemy unit

import React from 'react';
import { NarrativeTweet } from '../narrativeTypes.ts';
import { Heart, Repeat2, MessageCircle, X } from 'lucide-react';

interface EnemyTweetBubbleProps {
    tweet: NarrativeTweet | null;
    onDismiss?: () => void;
    position?: 'above' | 'below';
}

/**
 * Compact tweet bubble that appears above enemies during combat
 * Shows what the enemy is "saying" about your startup
 */
export const EnemyTweetBubble: React.FC<EnemyTweetBubbleProps> = ({
    tweet,
    onDismiss,
    position = 'above'
}) => {
    if (!tweet) return null;

    const borderColor = tweet.isVictory
        ? 'border-green-500'
        : tweet.isDefeat
            ? 'border-red-500'
            : 'border-amber-500';

    const bgColor = tweet.isVictory
        ? 'bg-green-50'
        : tweet.isDefeat
            ? 'bg-red-50'
            : 'bg-white';

    const glowColor = tweet.isVictory
        ? 'shadow-[8px_8px_16px_#C8CED3,-8px_-8px_16px_#FFFFFF,0_0_15px_rgba(34,197,94,0.2)]'
        : tweet.isDefeat
            ? 'shadow-[8px_8px_16px_#C8CED3,-8px_-8px_16px_#FFFFFF,0_0_15px_rgba(239,68,68,0.2)]'
            : 'shadow-[8px_8px_16px_#C8CED3,-8px_-8px_16px_#FFFFFF]';

    return (
        <div
            className={`
                z-40 w-64
                animate-tweetBounceIn
                flex-shrink-0
            `}
        >
            {/* Tweet Bubble */}
            <div
                className={`
                    ${bgColor}
                    border-2 ${borderColor}
                    rounded-xl p-3 
                    ${glowColor}
                    backdrop-blur-md
                    cursor-pointer 
                    hover:scale-[1.02] 
                    transition-all duration-200
                `}
                onClick={onDismiss}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg border border-gray-200 shadow-sm">
                        {tweet.avatarEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-xs truncate">
                            {tweet.displayName}
                        </div>
                        <div className="text-[10px] text-gray-500">{tweet.handle}</div>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            title="Dismiss"
                        >
                            <X size={12} className="text-gray-400 hover:text-gray-700" />
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
                    <span className="ml-auto text-gray-400 text-[9px]">
                        Click to dismiss
                    </span>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes tweetBounceIn {
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
                .animate-tweetBounceIn {
                    animation: tweetBounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
};

export default EnemyTweetBubble;
