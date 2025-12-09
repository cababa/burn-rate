// ============================================
// TWEET OVERLAY - Twitter-style Tweet Display
// ============================================
// Displays narrative tweets during combat

import React from 'react';
import { NarrativeTweet } from '../narrativeTypes.ts';
import { Heart, Repeat2, MessageCircle, Share } from 'lucide-react';

interface TweetOverlayProps {
    tweet: NarrativeTweet | null;
    onDismiss?: () => void;
}

/**
 * Twitter-accurate tweet display that overlays during gameplay
 * Shows enemy attacks, story beats, and victory moments
 */
export const TweetOverlay: React.FC<TweetOverlayProps> = ({ tweet, onDismiss }) => {
    if (!tweet) return null;

    // Determine tweet border color based on type
    const borderColor = tweet.isVictory
        ? 'border-green-500'
        : tweet.isDefeat
            ? 'border-red-500'
            : tweet.author === 'enemy'
                ? 'border-orange-500'
                : 'border-blue-500';

    const bgGradient = tweet.isVictory
        ? 'from-green-900/30 to-gray-900'
        : tweet.isDefeat
            ? 'from-red-900/30 to-gray-900'
            : 'from-gray-900 to-gray-800';

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 pointer-events-none"
            style={{ animation: 'slideInFromTop 0.3s ease-out' }}
        >
            <div
                className={`
          pointer-events-auto
          w-full max-w-lg mx-4
          bg-gradient-to-b ${bgGradient}
          border-l-4 ${borderColor}
          rounded-xl shadow-2xl
          overflow-hidden
          transition-all duration-300
        `}
                onClick={onDismiss}
                style={{ cursor: onDismiss ? 'pointer' : 'default' }}
            >
                {/* Tweet Container */}
                <div className="p-4">
                    {/* Header Row: Avatar + Name + Handle + Time */}
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
                            {tweet.avatarEmoji}
                        </div>

                        {/* Content Container */}
                        <div className="flex-1 min-w-0">
                            {/* Name Row */}
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-white truncate">
                                    {tweet.displayName}
                                </span>
                                {tweet.isVictory && (
                                    <span className="text-green-400 text-xs">✓</span>
                                )}
                                <span className="text-gray-500 truncate">
                                    {tweet.handle}
                                </span>
                                <span className="text-gray-600">·</span>
                                <span className="text-gray-500 text-sm">
                                    {tweet.timestamp}
                                </span>
                            </div>

                            {/* Tweet Content */}
                            <div className="mt-1 text-white text-base leading-relaxed whitespace-pre-wrap">
                                {tweet.content}
                            </div>

                            {/* Engagement Row */}
                            <div className="flex items-center justify-between mt-3 max-w-xs text-gray-500">
                                <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                    <MessageCircle size={16} />
                                    <span className="text-sm">{formatCount(tweet.replies)}</span>
                                </button>
                                <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
                                    <Repeat2 size={16} />
                                    <span className="text-sm">{formatCount(tweet.retweets)}</span>
                                </button>
                                <button className="flex items-center gap-1 hover:text-pink-400 transition-colors">
                                    <Heart size={16} />
                                    <span className="text-sm">{formatCount(tweet.likes)}</span>
                                </button>
                                <button className="hover:text-blue-400 transition-colors">
                                    <Share size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Victory/Defeat Banner */}
                {(tweet.isVictory || tweet.isDefeat) && (
                    <div className={`
            px-4 py-2 text-center text-sm font-medium
            ${tweet.isVictory ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}
          `}>
                        {tweet.isVictory ? '🎉 Problem Overcome!' : '💔 End of the Road'}
                    </div>
                )}
            </div>

            {/* CSS Animation */}
            <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

/**
 * Format large numbers (1234 -> 1.2K)
 */
function formatCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}

export default TweetOverlay;
