// ============================================
// TWEET SIDEBAR - Collapsible Timeline Panel
// ============================================
// Shows accumulated tweets on the right side

import React, { useState, useEffect } from 'react';
import { NarrativeTweet } from '../narrativeTypes.ts';
import { Heart, Repeat2, MessageCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TweetSidebarProps {
    tweets: NarrativeTweet[];
    currentTweet: NarrativeTweet | null;
    onDismissCurrent: () => void;
    startupName?: string;
}

/**
 * Collapsible sidebar showing tweet timeline during combat
 * Most recent tweets appear at the top
 */
export const TweetSidebar: React.FC<TweetSidebarProps> = ({
    tweets,
    currentTweet,
    onDismissCurrent,
    startupName
}) => {
    const [isExpanded, setIsExpanded] = useState(false); // Default collapsed
    const [autoDismissTimer, setAutoDismissTimer] = useState<number | null>(null);

    // Auto-dismiss current tweet after 4 seconds
    useEffect(() => {
        if (currentTweet) {
            // Clear any existing timer
            if (autoDismissTimer) {
                clearTimeout(autoDismissTimer);
            }
            // Set new timer
            const timer = window.setTimeout(() => {
                onDismissCurrent();
            }, 4000);
            setAutoDismissTimer(timer);

            return () => clearTimeout(timer);
        }
    }, [currentTweet?.id]);

    // No tweets yet - show collapsed minimal state
    if (tweets.length === 0 && !currentTweet) {
        return null;
    }

    return (
        <div className={`
      fixed right-0 top-14 bottom-0 z-40
      transition-all duration-300 ease-in-out
      flex
    `}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
          h-12 w-8 self-start mt-4
          bg-gray-800/90 border border-gray-700 border-r-0
          rounded-l-lg flex items-center justify-center
          hover:bg-gray-700 transition-colors
          ${tweets.length > 0 ? 'text-blue-400' : 'text-gray-500'}
        `}
                title={isExpanded ? 'Hide Timeline' : 'Show Timeline'}
            >
                {isExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {!isExpanded && tweets.length > 0 && (
                    <span className="absolute -left-2 -top-1 w-5 h-5 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                        {tweets.length}
                    </span>
                )}
            </button>

            {/* Sidebar Panel */}
            <div className={`
        bg-gray-900/95 backdrop-blur-md border-l border-gray-700
        transition-all duration-300 overflow-hidden
        ${isExpanded ? 'w-80' : 'w-0'}
      `}>
                {isExpanded && (
                    <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-white text-sm">Timeline</h3>
                                <p className="text-xs text-gray-500">{startupName || 'Your Journey'}</p>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                                {tweets.length} tweet{tweets.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Current Tweet Highlight */}
                        {currentTweet && (
                            <div className="border-b-2 border-blue-500 animate-pulse">
                                <div className="p-3 bg-blue-900/20 relative">
                                    <button
                                        onClick={onDismissCurrent}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-700 transition-colors"
                                        title="Dismiss"
                                    >
                                        <X size={14} className="text-gray-400" />
                                    </button>
                                    <CompactTweet tweet={currentTweet} isHighlighted />
                                </div>
                            </div>
                        )}

                        {/* Tweet List */}
                        <div className="flex-1 overflow-y-auto">
                            {tweets.slice().reverse().map((tweet, idx) => (
                                <div
                                    key={tweet.id || idx}
                                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="p-3">
                                        <CompactTweet tweet={tweet} />
                                    </div>
                                </div>
                            ))}

                            {tweets.length === 0 && !currentTweet && (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    <p>No tweets yet...</p>
                                    <p className="text-xs mt-1">Your story unfolds in combat!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Compact tweet display for sidebar
 */
const CompactTweet: React.FC<{ tweet: NarrativeTweet; isHighlighted?: boolean }> = ({
    tweet,
    isHighlighted
}) => {
    const borderClass = tweet.isVictory
        ? 'border-l-green-500'
        : tweet.isDefeat
            ? 'border-l-red-500'
            : tweet.author === 'enemy'
                ? 'border-l-orange-500'
                : 'border-l-blue-500';

    return (
        <div className={`border-l-2 pl-3 ${borderClass}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{tweet.avatarEmoji}</span>
                <div className="flex-1 min-w-0">
                    <span className={`font-bold text-sm truncate ${isHighlighted ? 'text-blue-300' : 'text-white'}`}>
                        {tweet.displayName}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{tweet.handle}</span>
                </div>
            </div>

            {/* Content */}
            <p className={`text-sm leading-snug ${isHighlighted ? 'text-white' : 'text-gray-300'}`}>
                {tweet.content}
            </p>

            {/* Compact Engagement */}
            <div className="flex items-center gap-3 mt-2 text-gray-500 text-[10px]">
                <span className="flex items-center gap-1">
                    <MessageCircle size={10} /> {tweet.replies}
                </span>
                <span className="flex items-center gap-1">
                    <Repeat2 size={10} /> {tweet.retweets}
                </span>
                <span className="flex items-center gap-1">
                    <Heart size={10} /> {tweet.likes}
                </span>
            </div>
        </div>
    );
};

export default TweetSidebar;
