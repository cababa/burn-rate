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
            : 'border-orange-500';

    const bgColor = tweet.isVictory
        ? 'bg-green-950/95'
        : tweet.isDefeat
            ? 'bg-red-950/95'
            : 'bg-gray-900/98';

    const glowColor = tweet.isVictory
        ? 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'
        : tweet.isDefeat
            ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
            : 'shadow-[0_0_25px_rgba(249,115,22,0.25)]';

    return (
        <div
            className={`
                absolute z-40 w-72
                ${position === 'above' ? 'bottom-full mb-3' : 'top-full mt-3'}
                left-1/2 -translate-x-1/2
                animate-tweetBounceIn
            `}
        >
            {/* Tweet Bubble */}
            <div
                className={`
                    ${bgColor}
                    border-2 ${borderColor}
                    rounded-xl p-4 
                    ${glowColor}
                    backdrop-blur-md
                    cursor-pointer 
                    hover:scale-[1.02] 
                    transition-all duration-200
                `}
                onClick={onDismiss}
            >
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-xl border border-gray-700">
                        {tweet.avatarEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">
                            {tweet.displayName}
                        </div>
                        <div className="text-xs text-gray-500">{tweet.handle}</div>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                            title="Dismiss"
                        >
                            <X size={14} className="text-gray-400 hover:text-white" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <p className="text-white text-sm leading-relaxed mb-3">
                    {tweet.content}
                </p>

                {/* Engagement Row */}
                <div className="flex items-center gap-4 text-gray-500 text-xs border-t border-gray-800 pt-2">
                    <span className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                        <MessageCircle size={12} /> {tweet.replies}
                    </span>
                    <span className="flex items-center gap-1 hover:text-green-400 transition-colors cursor-pointer">
                        <Repeat2 size={12} /> {tweet.retweets}
                    </span>
                    <span className="flex items-center gap-1 hover:text-pink-400 transition-colors cursor-pointer">
                        <Heart size={12} /> {tweet.likes}
                    </span>
                    <span className="ml-auto text-gray-600 text-[10px]">
                        Click to dismiss
                    </span>
                </div>
            </div>

            {/* Arrow pointer */}
            <div className={`
                absolute left-1/2 -translate-x-1/2 w-0 h-0
                ${position === 'above'
                    ? 'top-full border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-gray-900/98'
                    : 'bottom-full border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-gray-900/98'
                }
            `} />

            {/* CSS Animation */}
            <style>{`
                @keyframes tweetBounceIn {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px) scale(0.9);
                    }
                    60% {
                        transform: translateX(-50%) translateY(-5px) scale(1.02);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }
                .animate-tweetBounceIn {
                    animation: tweetBounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
};

export default EnemyTweetBubble;
