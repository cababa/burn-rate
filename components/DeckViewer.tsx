/**
 * DeckViewer Component
 * 
 * A modal overlay that displays cards in a grid.
 * Used for viewing deck, draw pile, discard pile, exhaust pile,
 * and for selecting cards (removal, upgrade, etc.)
 */

import React from 'react';
import { CardData } from '../types';
import { Card } from './Card';
import { X, Layers, Archive, Ghost, Trash2 } from 'lucide-react';

interface DeckViewerProps {
    title: string;
    cards: CardData[];
    onClose: () => void;
    selectable?: boolean;
    onSelect?: (card: CardData) => void;
    disabledFilter?: (card: CardData) => boolean;
    emptyMessage?: string;
    icon?: 'deck' | 'draw' | 'discard' | 'exhaust' | 'remove';
}

export const DeckViewer: React.FC<DeckViewerProps> = ({
    title,
    cards,
    onClose,
    selectable = false,
    onSelect,
    disabledFilter,
    emptyMessage = "No cards",
    icon = 'deck'
}) => {
    const getIcon = () => {
        switch (icon) {
            case 'draw': return <Layers size={24} className="text-primary" />;
            case 'discard': return <Archive size={24} className="text-gray-400" />;
            case 'exhaust': return <Ghost size={24} className="text-purple-400" />;
            case 'remove': return <Trash2 size={24} className="text-danger" />;
            default: return <Layers size={24} className="text-primary" />;
        }
    };

    const getIconColor = () => {
        switch (icon) {
            case 'draw': return 'border-primary/30';
            case 'discard': return 'border-gray-600';
            case 'exhaust': return 'border-purple-500/30';
            case 'remove': return 'border-danger/30';
            default: return 'border-primary/30';
        }
    };

    // Sort cards by type, then by name for consistent display
    const sortedCards = [...cards].sort((a, b) => {
        // Sort by type first (attack, skill, power)
        const typeOrder = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 };
        const typeA = typeOrder[a.type as keyof typeof typeOrder] ?? 5;
        const typeB = typeOrder[b.type as keyof typeof typeOrder] ?? 5;
        if (typeA !== typeB) return typeA - typeB;
        // Then by name
        return a.name.localeCompare(b.name);
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`relative w-[90vw] max-w-6xl max-h-[85vh] bg-surface border-2 ${getIconColor()} rounded-xl shadow-2xl overflow-hidden flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black/50">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
                        <span className="text-sm font-mono text-gray-500">({cards.length} cards)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Card Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {cards.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-gray-500 font-mono italic">
                            {emptyMessage}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
                            {sortedCards.map((card, index) => {
                                const isDisabled = disabledFilter ? disabledFilter(card) : false;
                                const isClickable = selectable && !isDisabled && onSelect;

                                return (
                                    <div
                                        key={`${card.id}-${index}`}
                                        onClick={() => isClickable && onSelect(card)}
                                        className={`
                                            transition-all duration-150
                                            ${isClickable ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' : ''}
                                            ${isDisabled ? 'opacity-40 grayscale' : ''}
                                            ${selectable && !isDisabled ? 'ring-2 ring-transparent hover:ring-primary/50 rounded-xl' : ''}
                                        `}
                                    >
                                        <Card
                                            card={card}
                                            onDragStart={() => { }}
                                            disabled={!isClickable}
                                            selectable={selectable && !isDisabled}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {selectable && (
                    <div className="px-6 py-3 border-t border-gray-800 bg-black/50 text-center">
                        <span className="text-sm text-gray-400 font-mono">
                            Click a card to select it
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
