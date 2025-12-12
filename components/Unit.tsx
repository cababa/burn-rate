
import React from 'react';
import { Terminal, Sword, TrendingUp, ShieldAlert, HelpCircle, Shield, AlertTriangle, Zap, BarChart3, TrendingDown, ArrowUpCircle, ShieldOff, Moon, Layers, Hexagon, Sprout, Ban, RefreshCw, Heart } from 'lucide-react';
import { EnemyIntent, EntityStatus, EnemyStatuses } from '../types';
import { STATUS_CONFIG, INTENT_ICONS } from '../constants';

interface UnitProps {
  name: string;
  currentHp: number;
  maxHp: number;
  emoji: string;
  gifUrl?: string | null; // Optional GIF URL from Giphy
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
    if (label === 'Exposed') return { text: 'text-red-600', border: 'border-red-300', bg: 'bg-red-50' };
    if (label === 'Drained') return { text: 'text-purple-600', border: 'border-purple-300', bg: 'bg-purple-50' };
    if (label === 'Execution Power') return { text: val > 0 ? 'text-amber-600' : 'text-blue-600', border: val > 0 ? 'border-amber-300' : 'border-blue-300', bg: val > 0 ? 'bg-amber-50' : 'bg-blue-50' };
    if (label === 'Fragile') return { text: 'text-orange-600', border: 'border-orange-300', bg: 'bg-orange-50' };
    if (label === 'Auto-Mitigation') return { text: 'text-slate-600', border: 'border-slate-300', bg: 'bg-slate-50' };
    if (label === 'Counterattack') return { text: 'text-green-600', border: 'border-green-300', bg: 'bg-green-50' };
    if (label === 'Buffer') return { text: 'text-cyan-600', border: 'border-cyan-300', bg: 'bg-cyan-50' };
    if (label === 'Antifragile') return { text: 'text-pink-600', border: 'border-pink-300', bg: 'bg-pink-50' };
    if (label === 'Momentum') return { text: 'text-blue-600', border: 'border-blue-300', bg: 'bg-blue-50' };
    if (label === 'Adaptive') return { text: 'text-indigo-600', border: 'border-indigo-300', bg: 'bg-indigo-50' };
    if (label === 'Flow State Lock') return { text: 'text-red-600', border: 'border-red-300', bg: 'bg-red-50' };
    return { text: 'text-gray-600', border: 'border-gray-300', bg: 'bg-gray-50' };
  };

  const colors = getColors(config.label, value);

  return (
    <div className={`group/status relative flex items-center gap-1 ${colors.bg} border ${colors.border} ${colors.text} px-2 py-1 rounded-full text-xs shadow-sm cursor-help`}>
      <span className="text-sm border-r ${colors.border} pr-1 mr-1">{config.icon}</span>
      <span className="font-bold">{value}</span>

      {/* Tooltip */}
      <div className={`absolute bottom-full right-0 mb-2 w-56 p-3 bg-white border ${colors.border} rounded-lg text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words`}>
        <div className={`${colors.text} font-bold mb-1 uppercase tracking-wider`}>{config.label}</div>
        <div className="text-gray-600">{formattedDesc}</div>
        {subtext && <div className="text-gray-400 mt-1 italic">{subtext}</div>}
      </div>
    </div>
  );
};

export const Unit: React.FC<UnitProps> = ({
  name,
  currentHp,
  maxHp,
  emoji,
  gifUrl,
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
        relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150 group hover:z-50
        ${isEnemy ? 'items-end text-right' : 'items-start text-left'}
        ${isTargetable ? 'border-dashed border-gray-300 bg-white/50 hover:bg-white hover:border-primary/50 cursor-crosshair' : 'border-transparent'}
        ${isSelected ? 'ring-2 ring-primary bg-white' : ''}
        ${isDead ? 'opacity-50 grayscale blur-[2px]' : ''}
        min-w-[200px]
      `}
      style={{
        background: isTargetable ? 'linear-gradient(145deg, #F5F7FA, #E8ECEF)' : 'transparent',
        boxShadow: isTargetable ? '8px 8px 16px #C8CED3, -8px -8px 16px #FFFFFF' : 'none',
      }}
    >
      {/* Mitigation Badge */}
      {mitigation > 0 && (
        <div className={`absolute -top-3 ${isEnemy ? '-right-3' : '-left-3'} z-10 flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-150 group/mitigation cursor-help`}>
          <Shield size={16} className="text-white fill-current" />
          <span className="absolute text-xs font-bold text-white font-mono translate-y-[1px]">{mitigation}</span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-white border border-blue-300 rounded-lg text-xs text-left shadow-xl hidden group-hover/mitigation:block z-[100] whitespace-normal break-words">
            <div className="text-blue-600 font-bold mb-1 uppercase tracking-wider">Mitigation (Block)</div>
            <div className="text-gray-600 mb-1">
              Prevents the next <b className="text-gray-800">{mitigation} damage</b>.
            </div>
            <div className="text-gray-400 italic">Removed at the start of your turn.</div>
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

      {/* Entity Header - Description now shows on hover for enemies */}
      <div className={`flex flex-col ${isEnemy ? 'items-end' : 'items-start'} pointer-events-auto group/title relative`}>
        <h2 className="text-xl font-display font-bold text-gray-800 tracking-wide cursor-help">{name}</h2>
        {/* For enemies: show description on hover. For player: always show */}
        {isEnemy ? (
          <div className="absolute top-full right-0 mt-1 w-64 p-3 bg-white border border-gray-200 rounded-lg text-xs text-left shadow-xl hidden group-hover/title:block z-[100] whitespace-normal break-words">
            <div className="text-gray-600">{description}</div>
          </div>
        ) : (
          <span className="text-xs text-gray-500 font-mono">{description}</span>
        )}
      </div>

      {/* Avatar / Visual - Larger for enemies with GIFs */}
      <div className={`
        ${isEnemy ? 'w-36 h-36' : 'w-24 h-24'} flex items-center justify-center rounded-xl border border-gray-200 bg-white shadow-md pointer-events-none overflow-hidden
        ${isTargetable ? 'group-hover:ring-2 group-hover:ring-primary/50' : ''}
        ${isEnemy && statuses?.vulnerable ? 'ring-2 ring-red-400 animate-pulse-fast' : ''}
        transition-all duration-150
      `}
        style={{
          boxShadow: 'inset 2px 2px 4px rgba(200,206,211,0.5), inset -2px -2px 4px rgba(255,255,255,0.8), 4px 4px 8px #C8CED3, -4px -4px 8px #FFFFFF',
        }}
      >
        {isDead ? (
          <span className={isEnemy ? 'text-7xl' : 'text-5xl'}>💀</span>
        ) : gifUrl ? (
          <img
            src={gifUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className={isEnemy ? 'text-7xl' : 'text-5xl'}>{emoji}</span>
        )}
      </div>

      {/* Stats Bar (Runway/Health) */}
      <div className="w-full space-y-1 pointer-events-none">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className={isEnemy ? 'text-red-600 font-semibold' : 'text-primary font-semibold'}>
            {isEnemy ? 'COMPLEXITY' : 'RUNWAY'}
          </span>
          <span className="text-gray-700 font-bold">
            {isEnemy ? `${currentHp}/${maxHp}` : `$${currentHp}k`}
          </span>
        </div>
        <div
          className="h-3 w-full rounded-full overflow-hidden border border-gray-200"
          style={{
            background: 'linear-gradient(inset, #E8ECEF 0%, #F5F7FA 100%)',
            boxShadow: 'inset 2px 2px 4px #C8CED3, inset -2px -2px 4px #FFFFFF',
          }}
        >
          <div
            className={`h-full transition-all duration-200 ease-out rounded-full ${isEnemy ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-primary to-green-400'}`}
            style={{
              width: `${hpPercent}%`,
              boxShadow: isEnemy ? '0 0 8px rgba(229, 62, 62, 0.4)' : '0 0 8px rgba(0, 214, 126, 0.4)',
            }}
          />
        </div>
      </div>

      {/* Enemy Intent (Forecast) */}
      {isEnemy && !isDead && intent && (
        <div className={`
            group/intent relative mt-2 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 border shadow-sm cursor-help
            bg-white
            ${intent.type === 'attack' ? 'border-red-300 text-red-600' :
            intent.type === 'buff' ? 'border-amber-300 text-amber-600' :
              intent.type === 'debuff' ? 'border-purple-300 text-purple-600' : 'border-gray-200 text-gray-600'}
        `}>
          <span className="text-base">{intentConfig.icon}</span>
          <span className="font-bold">{intent.type === 'attack' ? calculateIntentDamage() : (intent.value > 0 ? intent.value : '')}</span>
          <span className="opacity-80">{intent.description || 'Unknown Intent'}</span>

          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-white border border-gray-200 rounded-lg text-xs text-left shadow-xl hidden group-hover/intent:block z-[100] text-gray-600 whitespace-normal break-words">
            <div className={`font-bold mb-2 border-b border-gray-100 pb-1 uppercase tracking-wider ${intent.type === 'attack' ? 'text-red-600' : intent.type === 'buff' ? 'text-amber-600' : intent.type === 'debuff' ? 'text-purple-600' : 'text-gray-600'}`}>
              Forecast: {intentConfig.label}
            </div>

            {intent.type === 'attack' && (
              <div>
                <p className="text-gray-600 mb-1">
                  Intends to deal <b className="text-red-600 text-sm">⚔️ {calculateIntentDamage()} Runway damage</b>.
                </p>
                {statuses && statuses.strength !== 0 && (
                  <p className="text-gray-400 italic text-[10px] mt-1">
                    (Base {intent.value} {statuses.strength > 0 ? '+' : ''}{statuses.strength} Velocity)
                  </p>
                )}
                {statuses && statuses.weak > 0 && (
                  <p className="text-purple-500 italic text-[10px] mt-1">
                    (Reduced by Drained: -25%)
                  </p>
                )}
              </div>
            )}

            {intent.type === 'buff' && (
              <div>
                <p className="text-amber-600 font-bold mb-1">⬆️ {intent.description}</p>
                <div className="text-gray-500">
                  {intent.description.includes('Momentum') || intent.description.includes('Add Feature')
                    ? 'Gains Velocity each turn. Kill fast!'
                    : 'Enemy is powering up.'}
                </div>
              </div>
            )}

            {intent.type === 'debuff' && (
              <div>
                <p className="text-purple-600 font-bold mb-1">⬇️ {intent.description}</p>
                <div className="text-gray-500">
                  Applies negative status effects to your Runway.
                </div>
              </div>
            )}

            {intent.type !== 'attack' && intent.type !== 'buff' && intent.type !== 'debuff' && (
              <p className="text-gray-500">❓ {intent.description || 'Unknown intent'}</p>
            )}
          </div>
        </div>
      )}

      {!isEnemy && (
        <div className="mt-2 px-3 py-1 bg-white border border-primary/30 rounded-lg text-xs font-mono text-primary flex items-center gap-2 pointer-events-none shadow-sm">
          <Terminal size={12} />
          <span>Role: CTO</span>
        </div>
      )}
    </div>
  );
};