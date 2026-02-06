

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
        border: 'rgba(156, 163, 175, 0.5)',
        glow: 'transparent',
        orbBg: 'linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 100%)',
        orbGlow: 'none',
        text: 'text-gray-400',
        accent: '#9CA3AF',
      };
    }

    switch (card.type) {
      case 'attack':
        return {
          border: card.upgraded ? 'rgba(221, 107, 32, 0.6)' : 'rgba(229, 62, 62, 0.5)',
          glow: card.upgraded ? 'rgba(221, 107, 32, 0.15)' : 'rgba(229, 62, 62, 0.1)',
          orbBg: card.upgraded
            ? 'linear-gradient(135deg, #F6AD55 0%, #DD6B20 100%)'
            : 'linear-gradient(135deg, #FC8181 0%, #E53E3E 100%)',
          orbGlow: card.upgraded
            ? '0 2px 8px rgba(221, 107, 32, 0.4)'
            : '0 2px 8px rgba(229, 62, 62, 0.3)',
          text: card.upgraded ? 'text-orange-600' : 'text-red-600',
          accent: card.upgraded ? '#DD6B20' : '#E53E3E',
        };
      case 'skill':
        return {
          border: card.upgraded ? 'rgba(221, 107, 32, 0.6)' : 'rgba(49, 130, 206, 0.5)',
          glow: card.upgraded ? 'rgba(221, 107, 32, 0.15)' : 'rgba(49, 130, 206, 0.1)',
          orbBg: card.upgraded
            ? 'linear-gradient(135deg, #F6AD55 0%, #DD6B20 100%)'
            : 'linear-gradient(135deg, #63B3ED 0%, #3182CE 100%)',
          orbGlow: card.upgraded
            ? '0 2px 8px rgba(221, 107, 32, 0.4)'
            : '0 2px 8px rgba(49, 130, 206, 0.3)',
          text: card.upgraded ? 'text-orange-600' : 'text-blue-600',
          accent: card.upgraded ? '#DD6B20' : '#3182CE',
        };
      case 'power':
        return {
          border: 'rgba(221, 107, 32, 0.5)',
          glow: 'rgba(221, 107, 32, 0.1)',
          orbBg: 'linear-gradient(135deg, #F6AD55 0%, #DD6B20 100%)',
          orbGlow: '0 2px 8px rgba(221, 107, 32, 0.4)',
          text: 'text-amber-600',
          accent: '#DD6B20',
        };
      case 'status':
        return {
          border: 'rgba(156, 163, 175, 0.5)',
          glow: 'transparent',
          orbBg: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
          orbGlow: 'none',
          text: 'text-gray-500',
          accent: '#6B7280',
        };
      default:
        return {
          border: 'rgba(156, 163, 175, 0.3)',
          glow: 'transparent',
          orbBg: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E0 100%)',
          orbGlow: 'none',
          text: 'text-gray-700',
          accent: '#718096',
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
        relative group select-none transition-all duration-200 ease-out anim-card-draw
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
      {/* Card Frame with Neomorphism */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #F5F7FA 0%, #E8ECEF 100%)',
          border: `2px solid ${typeColors.border}`,
          boxShadow: isPlayable
            ? `8px 8px 16px #C8CED3, -8px -8px 16px #FFFFFF, 0 0 20px ${typeColors.glow}`
            : '4px 4px 8px #C8CED3, -4px -4px 8px #FFFFFF',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      />

      {/* Hover Glow Effect */}
      {isPlayable && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            boxShadow: `12px 12px 24px #C8CED3, -12px -12px 24px #FFFFFF, 0 0 30px ${typeColors.glow}`,
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
            background: 'linear-gradient(180deg, rgba(200,210,220,0.4) 0%, rgba(180,190,200,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: 'inset 2px 2px 4px rgba(200,206,211,0.5), inset -2px -2px 4px rgba(255,255,255,0.8)',
          }}
        >
          {gifUrl ? (
            <img
              src={gifUrl}
              alt={card.name}
              className={`w-full h-full object-cover transition-transform duration-200 ${isPlayable && 'group-hover:scale-110'}`}
              loading="lazy"
              draggable="false"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-5xl transition-transform duration-200 ${isPlayable && 'group-hover:scale-110'}`}>
              {card.icon}
            </div>
          )}

          {/* Exhaust badge */}
          {card.exhaust && (
            <div className="absolute bottom-1 right-1 bg-gray-700/90 text-[8px] uppercase font-bold text-gray-100 px-1.5 py-0.5 rounded border border-gray-600 flex items-center gap-0.5 shadow-sm">
              <Archive size={8} /> Archive
            </div>
          )}

          {/* Ethereal badge */}
          {card.ethereal && (
            <div className="absolute top-1 right-1 bg-blue-500/90 text-[8px] uppercase font-bold text-white px-1.5 py-0.5 rounded border border-blue-400 flex items-center gap-0.5 shadow-sm">
              <Ghost size={8} /> Fleeting
            </div>
          )}

          {/* Retain badge */}
          {card.retain && (
            <div className="absolute top-1 left-1 bg-amber-500/90 text-[8px] uppercase font-bold text-white px-1.5 py-0.5 rounded border border-amber-400 flex items-center gap-0.5 shadow-sm">
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
          {card.upgraded && <span className="text-orange-500 ml-1">+</span>}
        </h3>

        {/* Type Badge - Subtle, below name */}
        <div className="flex justify-center mb-1.5">
          <div
            className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide flex items-center gap-1"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: `1px solid ${typeColors.border}`,
              color: typeColors.accent,
              boxShadow: 'inset 1px 1px 2px rgba(200,206,211,0.3), inset -1px -1px 2px rgba(255,255,255,0.5)',
            }}
          >
            <span>{getCardTypeIcon()}</span>
            <span>{getCardTypeName()}</span>
          </div>
        </div>

        {/* Description */}
        <div
          className="flex-1 text-[10px] text-gray-600 leading-tight text-center px-1"
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        >
          {formatDescription(card.description)}
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64 bg-white border border-gray-200 p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {card.tooltip && (
          <div className={keywordsInCard.length > 0 ? "border-b border-gray-200 pb-2 mb-2" : ""}>
            <div className="text-xs font-bold text-amber-600 mb-0.5">{card.tooltip.term}</div>
            <div className="text-[10px] text-gray-600 leading-tight">{card.tooltip.definition}</div>
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
                  <span className="text-gray-400 mx-1">—</span>
                  <span className="text-gray-600">{def.description}</span>
                </div>
              );
            })}
          </div>
        )}

        {!card.tooltip && keywordsInCard.length === 0 && (
          <div className="text-[10px] text-gray-400 italic">No additional info</div>
        )}
      </div>
    </div>
  );
};