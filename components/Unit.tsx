
import React from 'react';
import { Terminal, Sword, TrendingUp, ShieldAlert, HelpCircle, Shield, AlertTriangle, Zap, BarChart3, TrendingDown, ArrowUpCircle, ShieldOff, Moon, Layers, Hexagon, Sprout, Ban, RefreshCw, Heart } from 'lucide-react';
import { EnemyIntent, EntityStatus, EnemyStatuses } from '../types';
import { STATUS_CONFIG, INTENT_ICONS } from '../constants';

interface UnitProps {
  name: string;
  currentHp: number;
  maxHp: number;
  emoji: string;
  isEnemy?: boolean;
  intent?: EnemyIntent;
  statuses?: EntityStatus | EnemyStatuses;
  mitigation?: number;
  description?: string;
  onDrop?: (e: React.DragEvent) => void;
  isTargetable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const StatusIcon: React.FC<{
  config: typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];
  value: number;
  subtext?: string;
}> = ({ config, value, subtext }) => {
  // Determine description
  let desc = config.description;
  if ('descPositive' in config && value > 0) desc = config.descPositive;
  if ('descNegative' in config && value < 0) desc = config.descNegative;

  // Replace placeholder {0} with value
  const formattedDesc = desc.replace('{0}', Math.abs(value).toString());

  // Determine color (default to text-gray-300 if not specified involved logic)
  // For simplicity, we mapped colors in constants or we infer here. 
  // To keep it clean, let's map some common colors based on label or add color to config later.
  // For now, we'll keep the styles here or map them dynamically.

  const getColors = (label: string, val: number) => {
    if (label === 'Exposed') return { text: 'text-danger', border: 'border-danger/50' };
    if (label === 'Drained') return { text: 'text-purple-400', border: 'border-purple-500/50' };
    if (label === 'Execution Power') return { text: val > 0 ? 'text-warning' : 'text-blue-400', border: val > 0 ? 'border-warning/50' : 'border-blue-400/50' };
    if (label === 'Fragile') return { text: 'text-orange-400', border: 'border-orange-500/50' };
    if (label === 'Auto-Mitigation') return { text: 'text-gray-300', border: 'border-gray-400/50' };
    if (label === 'Counterattack') return { text: 'text-green-400', border: 'border-green-500/50' };
    if (label === 'Buffer') return { text: 'text-cyan-400', border: 'border-cyan-500/50' };
    if (label === 'Antifragile') return { text: 'text-pink-400', border: 'border-pink-500/50' };
    if (label === 'Momentum') return { text: 'text-info', border: 'border-info/50' };
    if (label === 'Adaptive') return { text: 'text-indigo-400', border: 'border-indigo-500/50' };
    if (label === 'Flow State Lock') return { text: 'text-red-500', border: 'border-red-500/50' };
    return { text: 'text-gray-300', border: 'border-gray-500/50' };
  };

  const colors = getColors(config.label, value);

  return (
    <div className={`group/status relative flex items-center gap-1 bg-black/80 border ${colors.border} ${colors.text} px-2 py-1 rounded text-xs shadow-lg cursor-help`}>
      <span className="text-sm border-r border-white/10 pr-1 mr-1">{config.icon}</span>
      <span className="font-bold">{value}</span>

      {/* Tooltip */}
      <div className={`absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 border ${colors.border.replace('/50', '')} rounded text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words`}>
        <div className={`${colors.text} font-bold mb-1 uppercase tracking-wider`}>{config.label}</div>
        <div className="text-gray-300">{formattedDesc}</div>
        {subtext && <div className="text-gray-500 mt-1 italic">{subtext}</div>}
      </div>
    </div>
  );
};

export const Unit: React.FC<UnitProps> = ({
  name,
  currentHp,
  maxHp,
  emoji,
  isEnemy,
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

  const handleDragOver = (e: React.DragEvent) => {
    if (isTargetable) {
      e.preventDefault(); // Allow drop
    }
  };

  const isDead = currentHp <= 0;

  // Helper to safely access enemy-specific statuses
  const getEnemyStatus = (key: keyof EnemyStatuses) => {
    if (statuses && key in statuses) return (statuses as EnemyStatuses)[key];
    return 0;
  };

  // Helper to calculate intent damage for display
  const calculateIntentDamage = () => {
    if (!intent || intent.type !== 'attack' || !statuses) return intent?.value || 0;
    let dmg = intent.value + statuses.strength;

    // Check for Weak (Drained)
    if (statuses.weak > 0) {
      dmg = Math.floor(dmg * 0.75);
    }

    const finalDmg = Math.max(0, dmg);

    // Check for multi-hit in description (e.g. "Divider (x6)")
    const multiHitMatch = intent.description.match(/\(x(\d+)\)/);
    if (multiHitMatch) {
      return `${finalDmg}x${multiHitMatch[1]}`;
    }
    return finalDmg;
  };

  const intentConfig = intent ? (INTENT_ICONS[intent.type as keyof typeof INTENT_ICONS] || INTENT_ICONS.unknown) : INTENT_ICONS.unknown;

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 group hover:z-50
        ${isEnemy ? 'items-end text-right' : 'items-start text-left'}
        ${isTargetable ? 'border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary/50 cursor-crosshair' : 'border-transparent'}
        ${isSelected ? 'ring-2 ring-primary bg-white/10' : ''}
        ${isDead ? 'opacity-50 grayscale blur-[2px]' : ''}
        min-w-[200px]
      `}
    >
      {/* Mitigation Badge */}
      {mitigation > 0 && (
        <div className={`absolute -top-3 ${isEnemy ? '-right-3' : '-left-3'} z-10 flex items-center justify-center w-10 h-10 bg-info rounded-full shadow-[0_0_15px_rgba(68,136,255,0.5)] border-2 border-white animate-in zoom-in duration-150 group/mitigation cursor-help`}>
          <Shield size={16} className="text-white fill-current" />
          <span className="absolute text-xs font-bold text-white font-mono translate-y-[1px]">{mitigation}</span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-gray-900 border border-info rounded text-xs text-left shadow-xl hidden group-hover/mitigation:block z-[100] whitespace-normal break-words">
            <div className="text-info font-bold mb-1 uppercase tracking-wider">Mitigation (Block)</div>
            <div className="text-gray-300 mb-1">
              Prevents the next <b className="text-white">{mitigation} damage</b>.
            </div>
            <div className="text-gray-500 italic">Removed at the start of your turn.</div>
          </div>
        </div>
      )}

      {/* Status Effects Row */}
      {statuses && (
        <div className={`absolute top-0 ${isEnemy ? 'right-0 justify-end' : 'left-0 justify-start'} -mt-8 flex gap-2 min-w-[200px] flex-wrap`}>

          {statuses.vulnerable > 0 && <StatusIcon config={STATUS_CONFIG.vulnerable} value={statuses.vulnerable} subtext={`Lasts ${statuses.vulnerable} turn(s)`} />}
          {statuses.weak > 0 && <StatusIcon config={STATUS_CONFIG.weak} value={statuses.weak} subtext={`Lasts ${statuses.weak} turn(s)`} />}
          {statuses.frail > 0 && <StatusIcon config={STATUS_CONFIG.frail} value={statuses.frail} subtext={`Lasts ${statuses.frail} turn(s)`} />}
          {statuses.strength !== 0 && <StatusIcon config={STATUS_CONFIG.strength} value={statuses.strength} />}
          {statuses.metallicize > 0 && <StatusIcon config={STATUS_CONFIG.metallicize} value={statuses.metallicize} />}
          {statuses.thorns > 0 && <StatusIcon config={STATUS_CONFIG.thorns} value={statuses.thorns} />}
          {statuses.artifact > 0 && <StatusIcon config={STATUS_CONFIG.artifact} value={statuses.artifact} />}
          {statuses.antifragile > 0 && <StatusIcon config={STATUS_CONFIG.antifragile} value={statuses.antifragile} />}
          {statuses.noDraw > 0 && <StatusIcon config={STATUS_CONFIG.noDraw} value={0} />}

          {/* Enemy Specific */}
          {getEnemyStatus('growth') > 0 && <StatusIcon config={STATUS_CONFIG.growth} value={getEnemyStatus('growth')} />}
          {getEnemyStatus('curlUp') > 0 && <StatusIcon config={STATUS_CONFIG.curlUp} value={getEnemyStatus('curlUp')} />}
          {getEnemyStatus('malleable') > 0 && <StatusIcon config={STATUS_CONFIG.malleable} value={getEnemyStatus('malleable')} />}
          {getEnemyStatus('asleep') > 0 && <StatusIcon config={STATUS_CONFIG.asleep} value={0} />}

        </div>
      )}

      {/* Entity Header */}
      <div className={`flex flex-col ${isEnemy ? 'items-end' : 'items-start'} pointer-events-none`}>
        <h2 className="text-xl font-display font-bold text-white tracking-wide">{name}</h2>
        <span className="text-xs text-gray-500 font-mono">{description}</span>
      </div>

      {/* Avatar / Visual */}
      <div className={`
        w-24 h-24 flex items-center justify-center text-5xl rounded-lg border border-white/10 bg-black/40 shadow-xl pointer-events-none
        ${isTargetable ? 'group-hover:ring-2 group-hover:ring-primary/50' : ''}
        ${isEnemy && statuses?.vulnerable ? 'ring-2 ring-danger animate-pulse-fast' : ''}
        transition-all duration-150
      `}>
        {isDead ? '💀' : emoji}
      </div>

      {/* Stats Bar (Runway/Health) */}
      <div className="w-full space-y-1 pointer-events-none">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className={isEnemy ? 'text-danger' : 'text-primary'}>
            {isEnemy ? 'COMPLEXITY' : 'RUNWAY'}
          </span>
          <span className="text-white">
            {isEnemy ? `${currentHp}/${maxHp}` : `$${currentHp}k`}
          </span>
        </div>
        <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-200 ease-out ${isEnemy ? 'bg-danger shadow-[0_0_10px_rgba(255,68,68,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(0,255,136,0.5)]'}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Enemy Intent (Forecast) */}
      {isEnemy && !isDead && intent && (
        <div className={`
            group/intent relative mt-2 px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 border shadow-lg cursor-help
            bg-black/80
            ${intent.type === 'attack' ? 'border-danger/50 text-danger' :
            intent.type === 'buff' ? 'border-warning/50 text-warning' :
              intent.type === 'debuff' ? 'border-purple-500/50 text-purple-400' : 'border-white/20 text-white'}
        `}>
          <span className="text-base">{intentConfig.icon}</span>
          <span className="font-bold">{intent.type === 'attack' ? calculateIntentDamage() : (intent.value > 0 ? intent.value : '')}</span>
          <span className="opacity-80">{intent.description || 'Unknown Intent'}</span>

          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 border border-gray-600 rounded text-xs text-left shadow-xl hidden group-hover/intent:block z-[100] text-white whitespace-normal break-words">
            <div className={`font-bold mb-2 border-b border-gray-700 pb-1 uppercase tracking-wider text-${intentConfig.color === 'gray-400' ? 'gray-400' : intentConfig.color}`}>
              Forecast: {intentConfig.label}
            </div>

            {intent.type === 'attack' && (
              <div>
                <p className="text-white mb-1">
                  Intends to deal <b className="text-danger text-sm">{calculateIntentDamage()} Burn</b>.
                </p>
                {statuses && statuses.strength !== 0 && (
                  <p className="text-gray-500 italic text-[10px] mt-1">
                    (Base {intent.value} {statuses.strength > 0 ? '+' : ''}{statuses.strength} Complexity)
                  </p>
                )}
                {statuses && statuses.weak > 0 && (
                  <p className="text-purple-400 italic text-[10px] mt-1">
                    (Reduced by Drained: -25%)
                  </p>
                )}
              </div>
            )}

            {intent.type === 'buff' && (
              <div>
                <p className="text-warning font-bold mb-1">{intent.description}</p>
                <div className="text-gray-300">
                  {intent.description.includes('Momentum') ? 'Gains Complexity per turn.' : 'Scales up.'}
                </div>
              </div>
            )}

            {intent.type === 'debuff' && (
              <div>
                <p className="text-purple-400 font-bold mb-1">{intent.description}</p>
                <div className="text-gray-300">
                  Applies negative status effects to you.
                </div>
              </div>
            )}

            {intent.type !== 'attack' && intent.type !== 'buff' && intent.type !== 'debuff' && (
              <p className="text-gray-300">{intent.description}</p>
            )}
          </div>
        </div>
      )}

      {!isEnemy && (
        <div className="mt-2 px-3 py-1 bg-black/50 border border-primary/30 rounded text-xs font-mono text-primary flex items-center gap-2 pointer-events-none">
          <Terminal size={12} />
          <span>Role: CTO</span>
        </div>
      )}
    </div>
  );
};