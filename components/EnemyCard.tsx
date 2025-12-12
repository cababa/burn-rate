// ============================================
// ENEMY CARD - Card-style Enemy Display Component
// ============================================
// Displays enemies in a card-game aesthetic with neomorphism styling
// Status effects stack in top-left, intent and HP shown on card body

import React from 'react';
import { Shield, Zap, Target, TrendingUp, HelpCircle } from 'lucide-react';
import { EnemyIntent, EnemyStatuses } from '../types';
import { STATUS_CONFIG, INTENT_ICONS } from '../constants';

interface EnemyCardProps {
    name: string;
    currentHp: number;
    maxHp: number;
    emoji: string;
    gifUrl?: string | null;
    intent?: EnemyIntent;
    statuses?: EnemyStatuses;
    mitigation?: number;
    description?: string;
    onDrop?: (e: React.DragEvent) => void;
    isTargetable?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
}

// Compact status badge for the card
const StatusBadge: React.FC<{
    config: typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];
    value: number;
}> = ({ config, value }) => {
    const getColors = (label: string, val: number) => {
        if (label === 'Exposed') return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' };
        if (label === 'Drained') return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' };
        if (label === 'Execution Power') return { bg: val > 0 ? 'bg-amber-100' : 'bg-blue-100', text: val > 0 ? 'text-amber-600' : 'text-blue-600', border: val > 0 ? 'border-amber-300' : 'border-blue-300' };
        if (label === 'Fragile') return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' };
        if (label === 'Auto-Mitigation') return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' };
        if (label === 'Counterattack') return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' };
        if (label === 'Buffer') return { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-300' };
        if (label === 'Antifragile') return { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' };
        if (label === 'Momentum') return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' };
        if (label === 'Adaptive') return { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-300' };
        if (label === 'Flow State Lock') return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' };
        if (label === 'Growth') return { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-300' };
        if (label === 'Curl Up') return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' };
        if (label === 'Malleable') return { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-300' };
        if (label === 'Asleep') return { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-300' };
        return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
    };

    const colors = getColors(config.label, value);

    return (
        <div
            className={`group/status relative flex items-center gap-0.5 ${colors.bg} ${colors.text} ${colors.border} border px-1.5 py-0.5 rounded-full text-[10px] font-semibold shadow-sm cursor-help`}
            title={config.description}
        >
            <span className="text-xs">{config.icon}</span>
            <span>{value}</span>

            {/* Tooltip */}
            <div className={`absolute bottom-full left-0 mb-2 w-48 p-2 bg-white border ${colors.border} rounded-lg text-xs text-left shadow-lg hidden group-hover/status:block z-[100] whitespace-normal break-words`}>
                <div className={`${colors.text} font-bold mb-0.5 uppercase tracking-wider text-[10px]`}>{config.label}</div>
                <div className="text-gray-600">{config.description.replace('{0}', Math.abs(value).toString())}</div>
            </div>
        </div>
    );
};

export const EnemyCard: React.FC<EnemyCardProps> = ({
    name,
    currentHp,
    maxHp,
    emoji,
    gifUrl,
    intent,
    statuses,
    mitigation = 0,
    description,
    onDrop,
    isTargetable,
    isSelected,
    onClick
}) => {
    const hpPercent = Math.max(0, (currentHp / maxHp) * 100);
    const isDead = currentHp <= 0;

    const handleDragOver = (e: React.DragEvent) => {
        if (isTargetable) {
            e.preventDefault();
        }
    };

    // Helper to safely access enemy-specific statuses
    const getStatus = (key: keyof EnemyStatuses) => {
        if (statuses && key in statuses) return statuses[key];
        return 0;
    };

    // Calculate displayed intent damage
    const calculateIntentDamage = () => {
        if (!intent || intent.type !== 'attack' || !statuses) return intent?.value || 0;
        let dmg = intent.value + (statuses.strength || 0);
        if (statuses.weak > 0) {
            dmg = Math.floor(dmg * 0.75);
        }
        const finalDmg = Math.max(0, dmg);
        const multiHitMatch = intent.description.match(/\(x(\d+)\)/);
        if (multiHitMatch) {
            return `${finalDmg}x${multiHitMatch[1]}`;
        }
        return finalDmg;
    };

    const intentConfig = intent ? (INTENT_ICONS[intent.type as keyof typeof INTENT_ICONS] || INTENT_ICONS.unknown) : INTENT_ICONS.unknown;

    // Collect active statuses for display
    const activeStatuses: { key: string; config: typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]; value: number }[] = [];
    if (statuses) {
        if (statuses.vulnerable > 0) activeStatuses.push({ key: 'vulnerable', config: STATUS_CONFIG.vulnerable, value: statuses.vulnerable });
        if (statuses.weak > 0) activeStatuses.push({ key: 'weak', config: STATUS_CONFIG.weak, value: statuses.weak });
        if (statuses.frail > 0) activeStatuses.push({ key: 'frail', config: STATUS_CONFIG.frail, value: statuses.frail });
        if (statuses.strength !== 0) activeStatuses.push({ key: 'strength', config: STATUS_CONFIG.strength, value: statuses.strength });
        if (statuses.metallicize > 0) activeStatuses.push({ key: 'metallicize', config: STATUS_CONFIG.metallicize, value: statuses.metallicize });
        if (statuses.thorns > 0) activeStatuses.push({ key: 'thorns', config: STATUS_CONFIG.thorns, value: statuses.thorns });
        if (statuses.artifact > 0) activeStatuses.push({ key: 'artifact', config: STATUS_CONFIG.artifact, value: statuses.artifact });
        if (getStatus('growth') > 0) activeStatuses.push({ key: 'growth', config: STATUS_CONFIG.growth, value: getStatus('growth') });
        if (getStatus('curlUp') > 0) activeStatuses.push({ key: 'curlUp', config: STATUS_CONFIG.curlUp, value: getStatus('curlUp') });
        if (getStatus('malleable') > 0) activeStatuses.push({ key: 'malleable', config: STATUS_CONFIG.malleable, value: getStatus('malleable') });
        if (getStatus('asleep') > 0) activeStatuses.push({ key: 'asleep', config: STATUS_CONFIG.asleep, value: 0 });
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={onDrop}
            onClick={onClick}
            className={`
                relative group select-none transition-all duration-200 ease-out
                ${isTargetable ? 'cursor-crosshair' : 'cursor-default'}
                ${isSelected ? 'scale-105' : ''}
                ${isDead ? 'opacity-40 grayscale' : ''}
            `}
            style={{ width: '180px' }}
        >
            {/* Card Frame - Neomorphism Light Style */}
            <div
                className={`
                    relative rounded-2xl overflow-hidden
                    transition-all duration-200
                    ${isTargetable ? 'hover:scale-[1.03]' : ''}
                    ${isSelected ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-background' : ''}
                    ${statuses?.vulnerable ? 'ring-2 ring-red-400 animate-pulse' : ''}
                `}
                style={{
                    background: 'linear-gradient(145deg, #F5F7FA 0%, #E8ECEF 100%)',
                    boxShadow: isTargetable
                        ? '8px 8px 20px #C8CED3, -8px -8px 20px #FFFFFF, inset 0 1px 0 rgba(255,255,255,0.8)'
                        : '6px 6px 16px #C8CED3, -6px -6px 16px #FFFFFF, inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.5)',
                }}
            >
                {/* Mitigation Badge - Top Right */}
                {mitigation > 0 && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        <Shield size={12} className="fill-current" />
                        <span>{mitigation}</span>
                    </div>
                )}

                {/* Status Effects Row - Top Left */}
                {activeStatuses.length > 0 && (
                    <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1 max-w-[120px]">
                        {activeStatuses.map(({ key, config, value }) => (
                            <StatusBadge key={key} config={config} value={value} />
                        ))}
                    </div>
                )}

                {/* Art Area */}
                <div
                    className="relative w-full h-28 flex items-center justify-center overflow-hidden"
                    style={{
                        background: 'linear-gradient(180deg, rgba(200,210,220,0.3) 0%, rgba(180,190,200,0.2) 100%)',
                    }}
                >
                    {isDead ? (
                        <span className="text-6xl opacity-60">💀</span>
                    ) : gifUrl ? (
                        <img
                            src={gifUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <span className="text-6xl">{emoji}</span>
                    )}
                </div>

                {/* Card Body */}
                <div className="p-3 pt-2">
                    {/* Name */}
                    <h3
                        className="font-bold text-gray-800 text-sm text-center leading-tight mb-1 group/name relative cursor-help"
                        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
                    >
                        {name}
                        {/* Description Tooltip */}
                        {description && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-white border border-gray-200 rounded-lg text-xs text-left shadow-xl hidden group-hover/name:block z-[100] text-gray-600 font-normal">
                                {description}
                            </div>
                        )}
                    </h3>

                    {/* Intent Display */}
                    {intent && !isDead && (
                        <div
                            className={`
                                group/intent relative flex items-center justify-center gap-1.5 mb-2 px-2 py-1 rounded-lg text-xs font-semibold
                                ${intent.type === 'attack' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    intent.type === 'buff' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                        intent.type === 'debuff' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                            'bg-gray-100 text-gray-600 border border-gray-200'}
                            `}
                        >
                            <span className="text-sm">{intentConfig.icon}</span>
                            <span className="font-bold">{intent.type === 'attack' ? calculateIntentDamage() : (intent.value > 0 ? intent.value : '')}</span>
                            <span className="opacity-80 truncate max-w-[80px]">{intent.description || 'Unknown'}</span>

                            {/* Intent Tooltip */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-white border border-gray-200 rounded-lg text-xs text-left shadow-xl hidden group-hover/intent:block z-[100] font-normal">
                                <div className="font-bold text-gray-800 mb-1 border-b border-gray-100 pb-1">
                                    Forecast: {intentConfig.label}
                                </div>
                                {intent.type === 'attack' && (
                                    <p className="text-gray-600">
                                        Intends to deal <span className="font-bold text-red-600">⚔️ {calculateIntentDamage()}</span> damage.
                                    </p>
                                )}
                                {intent.type === 'buff' && (
                                    <p className="text-gray-600">Enemy is powering up: {intent.description}</p>
                                )}
                                {intent.type === 'debuff' && (
                                    <p className="text-gray-600">Will apply negative effects: {intent.description}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* HP Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-red-600 font-semibold uppercase tracking-wide">Complexity</span>
                            <span className="text-gray-700 font-bold">{currentHp}/{maxHp}</span>
                        </div>
                        <div
                            className="h-2.5 w-full rounded-full overflow-hidden"
                            style={{
                                background: 'linear-gradient(inset, #D1D9E0 0%, #E8ECEF 100%)',
                                boxShadow: 'inset 2px 2px 4px #C8CED3, inset -2px -2px 4px #FFFFFF',
                            }}
                        >
                            <div
                                className="h-full rounded-full transition-all duration-300 ease-out"
                                style={{
                                    width: `${hpPercent}%`,
                                    background: 'linear-gradient(90deg, #E53E3E 0%, #FC8181 100%)',
                                    boxShadow: '0 0 8px rgba(229, 62, 62, 0.4)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnemyCard;
