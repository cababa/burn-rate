// ============================================
// TIMELINE MODAL - Tweet History Viewer
// ============================================
// Shows all tweets from the current run

import React from 'react';
import { NarrativeTweet } from '../narrativeTypes.ts';
import { X, Heart, Repeat2, MessageCircle } from 'lucide-react';

interface TimelineModalProps {
    tweets: NarrativeTweet[];
    isOpen: boolean;
    onClose: () => void;
    startupName?: string;
}

/**
 * Modal displaying the timeline of all narrative tweets
 * Accessible from game header during run
 */
export const TimelineModal: React.FC<TimelineModalProps> = ({
    tweets,
    isOpen,
    onClose,
    startupName = 'Your Startup'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            {/* Modal Container */}
            <div
                className="w-full max-w-xl max-h-[80vh] mx-4 bg-white rounded-2xl overflow-hidden flex flex-col"
                style={{ boxShadow: '12px 12px 24px #C8CED3, -12px -12px 24px #FFFFFF' }}
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Timeline</h2>
                        <p className="text-sm text-gray-500">{startupName}'s Journey</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tweet List */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {tweets.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <p>No tweets yet...</p>
                            <p className="text-sm mt-2">Your story will unfold as you progress!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {tweets.map((tweet, index) => (
                                <TweetRow key={tweet.id || index} tweet={tweet} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 text-center text-xs text-gray-400 bg-gray-50">
                    {tweets.length} tweet{tweets.length !== 1 ? 's' : ''} in your journey
                </div>
            </div>
        </div>
    );
};

/**
 * Individual tweet row in timeline
 */
const TweetRow: React.FC<{ tweet: NarrativeTweet }> = ({ tweet }) => {
    const borderClass = tweet.isVictory
        ? 'border-l-green-500'
        : tweet.isDefeat
            ? 'border-l-red-500'
            : tweet.author === 'enemy'
                ? 'border-l-orange-500'
                : 'border-l-transparent';

    return (
        <div className={`p-4 hover:bg-gray-50 transition-colors border-l-2 ${borderClass}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {tweet.avatarEmoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-1 text-sm">
                        <span className="font-bold text-gray-800 truncate">
                            {tweet.displayName}
                        </span>
                        <span className="text-gray-400 truncate">
                            {tweet.handle}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">
                            {tweet.timestamp}
                        </span>
                    </div>

                    {/* Content */}
                    <p className="mt-1 text-gray-700 text-sm whitespace-pre-wrap">
                        {tweet.content}
                    </p>

                    {/* Engagement */}
                    <div className="flex items-center gap-4 mt-2 text-gray-400 text-xs">
                        <span className="flex items-center gap-1">
                            <MessageCircle size={12} />
                            {tweet.replies}
                        </span>
                        <span className="flex items-center gap-1">
                            <Repeat2 size={12} />
                            {tweet.retweets}
                        </span>
                        <span className="flex items-center gap-1">
                            <Heart size={12} />
                            {tweet.likes}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineModal;
