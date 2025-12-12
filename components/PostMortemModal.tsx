import React from 'react';
import { AlertOctagon, RefreshCw, Lightbulb, TrendingDown, Quote, ArrowRight, Skull, BookOpen } from 'lucide-react';
import { PostMortemAnalysis } from '../postMortemService';

interface PostMortemModalProps {
    analysis: PostMortemAnalysis | null;
    isLoading: boolean;
    startupName: string;
    floor: number;
    onRestart: () => void;
}

export const PostMortemModal: React.FC<PostMortemModalProps> = ({
    analysis,
    isLoading,
    startupName,
    floor,
    onRestart
}) => {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto py-8">
            <div className="bg-[#0d0d0d] border border-danger/50 p-8 rounded-2xl flex flex-col items-center text-center max-w-2xl w-full mx-4 shadow-[0_0_80px_rgba(255,68,68,0.1)]">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <Skull size={32} className="text-danger" />
                    <h2 className="text-2xl font-display font-bold text-white">Startup Autopsy</h2>
                    <Skull size={32} className="text-danger" />
                </div>
                <p className="text-danger/70 font-mono text-xs mb-6 uppercase tracking-widest">
                    {startupName} • Sprint {floor} • Runway Depleted
                </p>

                {isLoading ? (
                    /* Loading State */
                    <div className="py-12 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 font-mono text-sm">Analyzing what went wrong...</p>
                        <p className="text-gray-500 text-xs">Learning from your mistakes...</p>
                    </div>
                ) : analysis ? (
                    /* Analysis Content */
                    <div className="w-full space-y-5 text-left">

                        {/* Headline */}
                        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-center">
                            <h3 className="text-xl font-display font-bold text-danger mb-2">
                                "{analysis.headline}"
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {analysis.whatHappened}
                            </p>
                        </div>

                        {/* Key Mistakes */}
                        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingDown size={16} className="text-warning" />
                                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Key Mistakes</span>
                            </div>
                            <div className="space-y-3">
                                {analysis.keyMistakes.slice(0, 3).map((mistake, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-danger/20 flex items-center justify-center">
                                            <span className="text-danger text-xs font-bold">{i + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-300 text-sm">
                                                <span className="text-gray-500 font-mono text-xs">Sprint {mistake.floor} • </span>
                                                {mistake.mistake}
                                            </p>
                                            <p className="text-primary/80 text-xs mt-1 flex items-center gap-1">
                                                <Lightbulb size={10} />
                                                {mistake.lesson}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Real Startup Comparison */}
                        <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen size={16} className="text-orange-400" />
                                <span className="text-xs font-mono text-orange-400/80 uppercase tracking-wider">
                                    Real Startup That Failed Like This
                                </span>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    <span className="text-2xl">💀</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-bold text-white">{analysis.realStartupComparison.name}</span>
                                        <span className="text-gray-500 text-xs">({analysis.realStartupComparison.yearFailed})</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-1">
                                        {analysis.realStartupComparison.similarity}
                                    </p>
                                    <p className="text-danger text-xs font-mono">
                                        📉 {analysis.realStartupComparison.outcome}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Founder Advice */}
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Quote size={16} className="text-primary" />
                                <span className="text-xs font-mono text-primary/60 uppercase tracking-wider">Mentor's Advice</span>
                            </div>
                            <p className="text-gray-300 text-sm italic leading-relaxed">
                                "{analysis.founderAdvice}"
                            </p>
                        </div>

                        {/* Retry Tip */}
                        <div className="bg-info/10 border border-info/30 rounded-lg p-3 flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-info/20 flex items-center justify-center">
                                <ArrowRight size={16} className="text-info" />
                            </div>
                            <div>
                                <span className="text-xs font-mono text-info/60 uppercase">Next Run Tip</span>
                                <p className="text-gray-300 text-sm">{analysis.retryTip}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Fallback simple view */
                    <div className="bg-black/40 p-4 rounded w-full mb-6 border border-white/5 text-left space-y-2">
                        <div className="text-xs text-gray-500 font-mono">POSTMORTEM</div>
                        <div className="text-sm text-gray-300">You ran out of cash before finding Product-Market Fit.</div>
                        <div className="text-sm text-gray-400">Reached Sprint: {floor}</div>
                    </div>
                )}

                {/* Restart Button */}
                <button
                    onClick={onRestart}
                    disabled={isLoading}
                    className={`mt-6 font-bold py-3 px-8 rounded transition-colors font-mono text-sm uppercase tracking-wider flex items-center gap-2 ${isLoading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-danger text-white hover:bg-red-400'
                        }`}
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'Analyzing...' : 'Start New Run'}
                </button>
            </div>
        </div>
    );
};
