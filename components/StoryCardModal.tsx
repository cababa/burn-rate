import React, { useState } from 'react';
import { Trophy, Share2, Copy, Check, Twitter, ArrowRight, Sparkles, Clock, Target, Hash, Rocket } from 'lucide-react';
import { StartupStoryCard, formatShareableText, formatCompactShare } from '../startupStoryCard';

interface StoryCardModalProps {
    card: StartupStoryCard;
    onContinue: () => void;
    onRestart: () => void;
}

export const StoryCardModal: React.FC<StoryCardModalProps> = ({
    card,
    onContinue,
    onRestart
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = formatShareableText(card);
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShareTwitter = () => {
        const text = encodeURIComponent(formatCompactShare(card));
        const url = `https://twitter.com/intent/tweet?text=${text}`;
        window.open(url, '_blank', 'width=550,height=420');
    };

    const isVictory = card.outcome === 'victory';
    const themeColor = isVictory ? 'primary' : 'danger';
    const outcomeEmoji = isVictory ? '🎉' : '💀';
    const outcomeText = isVictory ? 'Seed Funded!' : 'Ran Out of Runway';

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`
                bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] 
                border ${isVictory ? 'border-primary/50' : 'border-danger/50'}
                p-6 rounded-2xl flex flex-col items-center 
                max-w-md w-full mx-4 
                shadow-[0_0_80px_rgba(${isVictory ? '99,102,241' : '255,68,68'},0.15)]
            `}>
                {/* Startup Header */}
                <div className="w-full text-center mb-4">
                    <div className="text-4xl mb-2">{card.emoji}</div>
                    <h1 className="text-2xl font-display font-bold text-white mb-1">
                        {card.startupName}
                    </h1>
                    <p className="text-gray-400 text-sm italic">
                        "{card.oneLiner}"
                    </p>
                </div>

                {/* Outcome Badge */}
                <div className={`
                    w-full py-3 px-4 rounded-lg mb-4 text-center
                    ${isVictory
                        ? 'bg-gradient-to-r from-green-900/40 to-primary/40 border border-green-500/30'
                        : 'bg-gradient-to-r from-orange-900/40 to-danger/40 border border-danger/30'
                    }
                `}>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{outcomeEmoji}</span>
                        <span className={`text-xl font-bold ${isVictory ? 'text-green-400' : 'text-danger'}`}>
                            {outcomeText}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="w-full grid grid-cols-2 gap-3 mb-4">
                    {/* Floor Progress */}
                    <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Target size={12} />
                            <span>Progress</span>
                        </div>
                        <div className="text-white font-bold">
                            Floor {card.floorsReached}/{card.maxFloors}
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isVictory ? 'bg-primary' : 'bg-danger'}`}
                                style={{ width: `${(card.floorsReached / card.maxFloors) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Run Duration */}
                    <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Clock size={12} />
                            <span>Time</span>
                        </div>
                        <div className="text-white font-bold">{card.runDuration}</div>
                    </div>

                    {/* Best Moment */}
                    <div className="col-span-2 bg-black/40 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Sparkles size={12} />
                            <span>Best Moment</span>
                        </div>
                        <div className="text-gray-300 text-sm line-clamp-2">{card.bestMoment}</div>
                    </div>

                    {/* Key Strategy */}
                    <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Rocket size={12} />
                            <span>Key Strategy</span>
                        </div>
                        <div className="text-white font-mono text-sm">{card.pivotalChoice}</div>
                    </div>

                    {/* Seed Code */}
                    <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Hash size={12} />
                            <span>Seed</span>
                        </div>
                        <div className="text-primary font-mono text-sm font-bold">{card.seedCode}</div>
                    </div>
                </div>

                {/* Share Buttons */}
                <div className="w-full flex gap-2 mb-4">
                    <button
                        onClick={handleCopy}
                        className={`
                            flex-1 py-2.5 px-4 rounded-lg font-mono text-sm uppercase tracking-wider
                            flex items-center justify-center gap-2 transition-all
                            ${copied
                                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                : 'bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30'
                            }
                        `}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handleShareTwitter}
                        className="flex-1 py-2.5 px-4 rounded-lg font-mono text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-[#1DA1F2]/20 border border-[#1DA1F2]/50 text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition-all"
                    >
                        <Twitter size={16} />
                        Share
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="w-full flex gap-2">
                    {isVictory ? (
                        <button
                            onClick={onContinue}
                            className="flex-1 py-3 px-6 rounded-lg font-bold font-mono text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/80 transition-colors"
                        >
                            <Trophy size={16} />
                            Continue Journey
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onRestart}
                                className="flex-1 py-3 px-6 rounded-lg font-bold font-mono text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-danger text-white hover:bg-red-400 transition-colors"
                            >
                                <ArrowRight size={16} />
                                Try Again
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-gray-600 text-xs mt-4 font-mono">
                    THE NEXT BIG THING
                </p>
            </div>
        </div>
    );
};
