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
    getGifUrl?: (cardId: string) => string | undefined;
}

export const DeckViewer: React.FC<DeckViewerProps> = ({
    title,
    cards,
    onClose,
    selectable = false,
    onSelect,
    disabledFilter,
    emptyMessage = "No cards",
    icon = 'deck',
    getGifUrl
}) => {
    const getIcon = () => {
        switch (icon) {
            case 'draw': return <Layers size={24} className="text-primary" />;
            case 'discard': return <Archive size={24} className="text-gray-500" />;
            case 'exhaust': return <Ghost size={24} className="text-purple-500" />;
            case 'remove': return <Trash2 size={24} className="text-red-500" />;
            default: return <Layers size={24} className="text-primary" />;
        }
    };

    const getIconColor = () => {
        switch (icon) {
            case 'draw': return 'border-primary/30';
            case 'discard': return 'border-gray-300';
            case 'exhaust': return 'border-purple-300';
            case 'remove': return 'border-red-300';
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`relative w-[90vw] max-w-6xl max-h-[85vh] bg-white border-2 ${getIconColor()} rounded-2xl overflow-hidden flex flex-col`}
                style={{ boxShadow: '12px 12px 24px #C8CED3, -12px -12px 24px #FFFFFF' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <h2 className="text-xl font-display font-bold text-gray-800">{title}</h2>
                        <span className="text-sm font-mono text-gray-400">({cards.length} cards)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Card Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {cards.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-gray-400 font-mono italic">
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
                                            gifUrl={getGifUrl ? getGifUrl(card.id) : undefined}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {selectable && (
                    <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-center">
                        <span className="text-sm text-gray-500 font-mono">
                            Click a card to select it
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
