

import React from 'react';
import { CardData } from '../types';
import { Zap, Ban, Ghost, Archive } from 'lucide-react';

interface CardProps {
  card: CardData;
  onDragStart: (e: React.DragEvent, card: CardData) => void;
  disabled?: boolean;
  selectable?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onDragStart, disabled, selectable }) => {

  // If selectable, treat as interactive even if unplayable (e.g. for discard selection)
  const isPlayable = (!card.unplayable || selectable) && !disabled;

  const getBorderColor = () => {
    if (card.unplayable && !selectable) return 'border-gray-700 bg-gray-900/50';
    if (card.upgraded) return 'border-warning shadow-[0_0_10px_rgba(255,170,0,0.2)] hover:border-warning hover:shadow-[0_0_15px_rgba(255,170,0,0.4)]';

    switch (card.type) {
      case 'attack': return 'border-danger/50 hover:border-danger';
      case 'skill': return 'border-info/50 hover:border-info';
      case 'power': return 'border-warning/50 hover:border-warning';
      case 'status': return 'border-gray-600 hover:border-gray-500';
      default: return 'border-border';
    }
  };

  const getTextColor = () => {
    if (card.unplayable && !selectable) return 'text-gray-500';
    if (card.upgraded) return 'text-warning';

    switch (card.type) {
      case 'attack': return 'text-danger';
      case 'skill': return 'text-info';
      case 'power': return 'text-warning';
      case 'status': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getCardTypeBadge = () => {
    switch (card.type) {
      case 'attack':
        return <div className="flex items-center gap-1 text-danger font-bold tracking-wider">⚔️ Attack</div>;
      case 'skill':
        return <div className="flex items-center gap-1 text-info font-bold tracking-wider">🛡️ Skill</div>;
      case 'power':
        return <div className="flex items-center gap-1 text-warning font-bold tracking-wider">⚡ Power</div>;
      case 'status':
        return <div className="flex items-center gap-1 text-gray-400 font-bold tracking-wider">💀 Status</div>;
      default:
        return <div>Card</div>;
    }
  };

  // Helper to colorize keywords in description
  const formatDescription = (text: string) => {
    const parts = text.split(/(\bExecution\b|\bMitigation\b|\bVulnerable\b|\bBurn\b|\bExhaust\b|\bUnplayable\b|\bEthereal\b|\bRetain\b)/g);
    return parts.map((part, i) => {
      if (part === 'Execution' || part === 'Burn') return <span key={i} className="text-danger font-bold">{part}</span>;
      if (part === 'Mitigation') return <span key={i} className="text-info font-bold">{part}</span>;
      if (part === 'Vulnerable') return <span key={i} className="text-danger font-bold underline decoration-dashed underline-offset-2">{part}</span>;
      if (part === 'Exhaust') return <span key={i} className="text-gray-400 font-bold border-b border-gray-500">{part}</span>;
      if (part === 'Unplayable') return <span key={i} className="text-gray-500 font-bold italic">{part}</span>;
      if (part === 'Ethereal') return <span key={i} className="text-blue-300 font-bold italic">{part}</span>;
      if (part === 'Retain') return <span key={i} className="text-yellow-200 font-bold italic">{part}</span>;
      return part;
    });
  };

  return (
    <div
      draggable={isPlayable}
      onDragStart={(e) => {
        if (isPlayable) onDragStart(e, card);
      }}
      className={`
        relative group w-40 h-56 
        bg-surface border-2 rounded-lg 
        flex flex-col p-3 select-none transition-all duration-150 ease-out
        ${!isPlayable
          ? 'opacity-60 grayscale cursor-not-allowed border-gray-800 bg-gray-950'
          : `${selectable ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} hover:-translate-y-4 hover:shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:scale-105 z-0 hover:z-10 ${getBorderColor()}`
        }
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1">
          <div className={`h-4 px-2 rounded-full border flex items-center justify-center text-[9px] font-mono uppercase ${!isPlayable ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-black/60 border-white/10'}`}>
            {getCardTypeBadge()}
          </div>
        </div>

        {/* Cost Badge */}
        {card.cost >= 0 ? (
          <div className={`
                flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono shadow-sm border
                ${!isPlayable ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-black/40 text-primary border-primary/20'}
            `}>
            <Zap size={10} className="fill-current" />
            <span>{card.cost}</span>
          </div>
        ) : card.cost === -1 ? (
          <div className={`
                flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono shadow-sm border
                ${!isPlayable ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-black/40 text-primary border-primary/20'}
            `}>
            <Zap size={10} className="fill-current" />
            <span>X</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono shadow-sm border bg-gray-800 text-gray-500 border-gray-700">
            <Ban size={10} />
          </div>
        )}
      </div>

      {/* Art / Icon Area */}
      <div className={`
        flex-1 flex items-center justify-center rounded border mb-3 overflow-hidden shadow-inner transition-colors duration-150 relative
        ${!isPlayable ? 'bg-black/10 border-white/5' : 'bg-black/20 border-white/5 group-hover:bg-black/30'}
      `}>
        <div className={`text-5xl transform transition-transform duration-150 drop-shadow-lg ${isPlayable && 'group-hover:scale-110'}`}>
          {card.icon}
        </div>
        {card.exhaust && (
          <div className="absolute bottom-0 right-0 bg-black/80 text-[8px] uppercase font-bold text-gray-400 px-1 py-0.5 rounded-tl border-t border-l border-white/10">
            Exhaust
          </div>
        )}
        {card.ethereal && (
          <div className="absolute top-0 right-0 bg-blue-900/80 text-[8px] uppercase font-bold text-blue-200 px-1 py-0.5 rounded-bl border-b border-l border-white/10 flex items-center gap-0.5">
            <Ghost size={8} /> Ethereal
          </div>
        )}
        {card.retain && (
          <div className="absolute top-0 left-0 bg-yellow-900/80 text-[8px] uppercase font-bold text-yellow-200 px-1 py-0.5 rounded-br border-b border-r border-white/10 flex items-center gap-0.5">
            <Archive size={8} /> Retain
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className={`font-display font-bold text-sm tracking-tight flex items-center gap-2 ${getTextColor()}`}>
          {card.name} {card.upgraded && <span className="text-warning">+</span>}
        </h3>
        <div className="h-px w-full bg-white/10" />
        <p className={`text-[10px] font-mono leading-tight min-h-[2.5em] ${!isPlayable ? 'text-gray-600' : 'text-gray-400'}`}>
          {formatDescription(card.description)}
        </p>
      </div>
      {/* Tooltip */}
      {card.tooltip && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 bg-gray-900 border border-gray-700 p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="text-xs font-bold text-warning mb-1">{card.tooltip.term}</div>
          <div className="text-[10px] text-gray-300 leading-tight">{card.tooltip.definition}</div>
        </div>
      )}
    </div>
  );
};