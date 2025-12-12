

import React from 'react';
import { CardData } from '../types';
import { Zap, Ghost, Archive } from 'lucide-react';
import { KEYWORD_GLOSSARY } from '../constants';

interface CardProps {
  card: CardData;
  onDragStart: (e: React.DragEvent, card: CardData) => void;
  disabled?: boolean;
  selectable?: boolean;
  gifUrl?: string | null;
}

export const Card: React.FC<CardProps> = ({ card, onDragStart, disabled, selectable, gifUrl }) => {
  const isPlayable = (!card.unplayable || selectable) && !disabled;

  // Get type-specific colors for the card
  const getTypeColors = () => {
    if (card.unplayable && !selectable) {
      return {
        border: 'rgba(55, 65, 81, 0.5)',
        glow: 'transparent',
        orbBg: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
        orbGlow: 'none',
        text: 'text-gray-500',
        accent: '#6b7280',
      };
    }

    switch (card.type) {
      case 'attack':
        return {
          border: card.upgraded ? 'rgba(255, 170, 0, 0.6)' : 'rgba(239, 68, 68, 0.5)',
          glow: card.upgraded ? 'rgba(255, 170, 0, 0.3)' : 'rgba(239, 68, 68, 0.25)',
          orbBg: card.upgraded
            ? 'linear-gradient(135deg, #ffd700 0%, #ff9500 100%)'
            : 'linear-gradient(135deg, #ff6b6b 0%, #dc2626 100%)',
          orbGlow: card.upgraded
            ? '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 170, 0, 0.3)'
            : '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.2)',
          text: card.upgraded ? 'text-warning' : 'text-red-400',
          accent: card.upgraded ? '#ffd700' : '#ef4444',
        };
      case 'skill':
        return {
          border: card.upgraded ? 'rgba(255, 170, 0, 0.6)' : 'rgba(59, 130, 246, 0.5)',
          glow: card.upgraded ? 'rgba(255, 170, 0, 0.3)' : 'rgba(59, 130, 246, 0.25)',
          orbBg: card.upgraded
            ? 'linear-gradient(135deg, #ffd700 0%, #ff9500 100%)'
            : 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
          orbGlow: card.upgraded
            ? '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 170, 0, 0.3)'
            : '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)',
          text: card.upgraded ? 'text-warning' : 'text-blue-400',
          accent: card.upgraded ? '#ffd700' : '#3b82f6',
        };
      case 'power':
        return {
          border: 'rgba(245, 158, 11, 0.5)',
          glow: 'rgba(245, 158, 11, 0.25)',
          orbBg: 'linear-gradient(135deg, #fcd34d 0%, #d97706 100%)',
          orbGlow: '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.2)',
          text: 'text-amber-400',
          accent: '#f59e0b',
        };
      case 'status':
        return {
          border: 'rgba(107, 114, 128, 0.5)',
          glow: 'transparent',
          orbBg: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
          orbGlow: 'none',
          text: 'text-gray-400',
          accent: '#6b7280',
        };
      default:
        return {
          border: 'rgba(255, 255, 255, 0.2)',
          glow: 'transparent',
          orbBg: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
          orbGlow: 'none',
          text: 'text-white',
          accent: '#ffffff',
        };
    }
  };

  const typeColors = getTypeColors();

  const getCardTypeIcon = () => {
    switch (card.type) {
      case 'attack': return '🚀';
      case 'skill': return '🛠️';
      case 'power': return '📈';
      case 'status': return '🐛';
      default: return '📋';
    }
  };

  const getCardTypeName = () => {
    switch (card.type) {
      case 'attack': return 'Attack';
      case 'skill': return 'Skill';
      case 'power': return 'Power';
      case 'status': return 'Status';
      default: return 'Card';
    }
  };

  // Format description with keyword highlighting
  const formatDescription = (text: string) => {
    const keywordPattern = Object.keys(KEYWORD_GLOSSARY).join('|');
    const regex = new RegExp(`(\\b(?:${keywordPattern})\\b)`, 'g');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const keyword = KEYWORD_GLOSSARY[part];
      if (keyword) {
        return <span key={i} className={`${keyword.color} font-semibold`}>{part}</span>;
      }
      return part;
    });
  };

  // Get keywords for tooltip
  const getKeywordsInDescription = (): string[] => {
    const found: string[] = [];
    const text = card.description;

    Object.keys(KEYWORD_GLOSSARY).forEach(keyword => {
      if (text.includes(keyword)) {
        found.push(keyword);
      }
    });

    if (card.exhaust && !found.includes('Archive')) found.push('Archive');
    if (card.ethereal && !found.includes('Fleeting')) found.push('Fleeting');
    if (card.retain && !found.includes('Retain')) found.push('Retain');

    return found;
  };

  const keywordsInCard = getKeywordsInDescription();

  // Get rarity indicator
  const getRarityStars = () => {
    switch (card.rarity) {
      case 'uncommon': return '⭐';
      case 'rare': return '⭐⭐';
      default: return null;
    }
  };

  const rarityStars = getRarityStars();

  return (
    <div
      draggable={isPlayable}
      onDragStart={(e) => {
        if (isPlayable) onDragStart(e, card);
      }}
      className={`
        relative group select-none transition-all duration-200 ease-out
        ${!isPlayable
          ? 'opacity-50 grayscale cursor-not-allowed'
          : `${selectable ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} hover:-translate-y-3 hover:scale-105 z-0 hover:z-20`
        }
      `}
      style={{
        width: '160px',
        height: '240px',
      }}
    >
      {/* Card Frame with Glassmorphism */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(30, 30, 40, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${typeColors.border}`,
          boxShadow: isPlayable
            ? `0 4px 20px rgba(0,0,0,0.4), 0 0 30px ${typeColors.glow}`
            : 'none',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      />

      {/* Hover Glow Effect */}
      {isPlayable && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            boxShadow: `0 0 40px ${typeColors.glow}, 0 0 60px ${typeColors.glow}`,
          }}
        />
      )}

      {/* Content Container */}
      <div className="relative h-full flex flex-col p-3 pt-6">

        {/* Large Cost Orb - Positioned top-left, overlapping edge */}
        <div
          className="absolute -top-2 -left-2 flex items-center justify-center z-10"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: isPlayable ? typeColors.orbBg : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
            boxShadow: isPlayable ? typeColors.orbGlow : 'none',
            border: '3px solid rgba(255,255,255,0.15)',
          }}
        >
          {card.cost >= 0 ? (
            <div className="flex flex-col items-center">
              <Zap size={12} className="text-white/80 -mb-0.5" fill="currentColor" />
              <span className="text-white font-bold text-lg leading-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {card.cost}
              </span>
            </div>
          ) : card.cost === -1 ? (
            <div className="flex flex-col items-center">
              <Zap size={12} className="text-white/80 -mb-0.5" fill="currentColor" />
              <span className="text-white font-bold text-lg leading-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                X
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-xl">⊘</span>
          )}
        </div>

        {/* Rarity Stars - Top right */}
        {rarityStars && (
          <div className="absolute top-1 right-2 text-xs z-10">
            {rarityStars}
          </div>
        )}

        {/* Art Area - 60% of card */}
        <div
          className="relative rounded-lg overflow-hidden mb-2 flex-shrink-0"
          style={{
            height: '120px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {gifUrl ? (
            <img
              src={gifUrl}
              alt={card.name}
              className={`w-full h-full object-cover transition-transform duration-200 ${isPlayable && 'group-hover:scale-110'}`}
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-5xl transition-transform duration-200 ${isPlayable && 'group-hover:scale-110'}`}>
              {card.icon}
            </div>
          )}

          {/* Exhaust badge */}
          {card.exhaust && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] uppercase font-bold text-gray-300 px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-0.5">
              <Archive size={8} /> Archive
            </div>
          )}

          {/* Ethereal badge */}
          {card.ethereal && (
            <div className="absolute top-1 right-1 bg-blue-900/80 text-[8px] uppercase font-bold text-blue-200 px-1.5 py-0.5 rounded border border-blue-400/20 flex items-center gap-0.5">
              <Ghost size={8} /> Fleeting
            </div>
          )}

          {/* Retain badge */}
          {card.retain && (
            <div className="absolute top-1 left-1 bg-yellow-900/80 text-[8px] uppercase font-bold text-yellow-200 px-1.5 py-0.5 rounded border border-yellow-400/20 flex items-center gap-0.5">
              <Archive size={8} /> Retain
            </div>
          )}
        </div>

        {/* Card Name */}
        <h3
          className={`font-semibold text-sm text-center leading-tight mb-1 ${typeColors.text}`}
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        >
          {card.name}
          {card.upgraded && <span className="text-amber-400 ml-1">+</span>}
        </h3>

        {/* Type Badge - Subtle, below name */}
        <div className="flex justify-center mb-1.5">
          <div
            className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide flex items-center gap-1"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${typeColors.border}`,
              color: typeColors.accent,
            }}
          >
            <span>{getCardTypeIcon()}</span>
            <span>{getCardTypeName()}</span>
          </div>
        </div>

        {/* Description */}
        <div
          className="flex-1 text-[10px] text-gray-400 leading-tight text-center px-1"
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        >
          {formatDescription(card.description)}
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64 bg-gray-900/95 border border-gray-700 p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
        {card.tooltip && (
          <div className={keywordsInCard.length > 0 ? "border-b border-gray-700 pb-2 mb-2" : ""}>
            <div className="text-xs font-bold text-amber-400 mb-0.5">{card.tooltip.term}</div>
            <div className="text-[10px] text-gray-300 leading-tight">{card.tooltip.definition}</div>
          </div>
        )}

        {keywordsInCard.length > 0 && (
          <div className="space-y-1">
            {keywordsInCard.map(keyword => {
              const def = KEYWORD_GLOSSARY[keyword];
              return (
                <div key={keyword} className="text-[10px] leading-tight">
                  <span className="mr-1">{def.icon}</span>
                  <span className={`font-bold ${def.color}`}>{keyword}</span>
                  <span className="text-gray-500 mx-1">—</span>
                  <span className="text-gray-400">{def.description}</span>
                </div>
              );
            })}
          </div>
        )}

        {!card.tooltip && keywordsInCard.length === 0 && (
          <div className="text-[10px] text-gray-500 italic">No additional info</div>
        )}
      </div>
    </div>
  );
};