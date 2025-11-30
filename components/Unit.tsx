
import React from 'react';
import { Terminal, Sword, TrendingUp, ShieldAlert, HelpCircle, Shield, AlertTriangle, Zap, BarChart3, TrendingDown, ArrowUpCircle, ShieldOff, Moon, Layers, Hexagon, Sprout, Ban, RefreshCw, Heart } from 'lucide-react';
import { EnemyIntent, EntityStatus, EnemyStatuses } from '../types';

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
  icon: React.ReactNode;
  value: number;
  color: string;
  borderColor: string;
  label: string;
  description: React.ReactNode;
  subtext?: string;
}> = ({ icon, value, color, borderColor, label, description, subtext }) => (
  <div className={`group/status relative flex items-center gap-1 bg-black/80 border ${borderColor} ${color} px-2 py-1 rounded text-xs shadow-lg cursor-help`}>
    {icon}
    <span className="font-bold">{value}</span>

    {/* Tooltip */}
    <div className={`absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 border ${borderColor.replace('/50', '')} rounded text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words`}>
      <div className={`${color} font-bold mb-1 uppercase tracking-wider`}>{label}</div>
      <div className="text-gray-300">{description}</div>
      {subtext && <div className="text-gray-500 mt-1 italic">{subtext}</div>}
    </div>
  </div>
);

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

  const getIntentIcon = (type: string) => {
    switch (type) {
      case 'attack': return <Sword size={14} />;
      case 'buff': return <TrendingUp size={14} />;
      case 'debuff': return <ShieldAlert size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  // Helper to safely access enemy-specific statuses
  const getEnemyStatus = (key: keyof EnemyStatuses) => {
    if (statuses && key in statuses) return (statuses as EnemyStatuses)[key];
    return 0;
  };

  // Helper to calculate intent damage for display
  const calculateIntentDamage = () => {
    if (!intent || intent.type !== 'attack' || !statuses) return intent?.value || 0;
    let dmg = intent.value + statuses.strength;
    const finalDmg = Math.max(0, dmg);

    // Check for multi-hit in description (e.g. "Divider (x6)")
    const multiHitMatch = intent.description.match(/\(x(\d+)\)/);
    if (multiHitMatch) {
      return `${finalDmg}x${multiHitMatch[1]}`;
    }
    return finalDmg;
  };

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

          {/* Vulnerable */}
          {statuses.vulnerable > 0 && (
            <StatusIcon
              icon={<AlertTriangle size={12} />}
              value={statuses.vulnerable}
              color="text-danger"
              borderColor="border-danger/50"
              label="Vulnerable"
              description={<span>Incoming damage is multiplied by <b className="text-white">1.5x</b>.</span>}
              subtext={`Lasts ${statuses.vulnerable} more turn(s).`}
            />
          )}

          {/* Weak */}
          {statuses.weak > 0 && (
            <StatusIcon
              icon={<TrendingDown size={12} />}
              value={statuses.weak}
              color="text-purple-400"
              borderColor="border-purple-500/50"
              label="Weak"
              description={<span>Attacks deal <b className="text-white">25% less damage</b>.</span>}
              subtext={`Lasts ${statuses.weak} more turn(s).`}
            />
          )}

          {/* Frail */}
          {statuses.frail > 0 && (
            <StatusIcon
              icon={<ShieldOff size={12} />}
              value={statuses.frail}
              color="text-orange-400"
              borderColor="border-orange-500/50"
              label="Frail"
              description={<span>Block gained from cards is reduced by <b className="text-white">25%</b>.</span>}
              subtext={`Lasts ${statuses.frail} more turn(s).`}
            />
          )}

          {/* Strength */}
          {statuses.strength !== 0 && (
            <StatusIcon
              icon={statuses.strength > 0 ? <Zap size={12} className="fill-current" /> : <TrendingDown size={12} />}
              value={statuses.strength}
              color={statuses.strength > 0 ? 'text-warning' : 'text-blue-400'}
              borderColor={statuses.strength > 0 ? 'border-warning/50' : 'border-blue-400/50'}
              label={`${isEnemy ? 'Complexity' : 'Execution Power'} (Strength)`}
              description={<span>Attacks deal <b className="text-white">{statuses.strength > 0 ? '+' : ''}{statuses.strength} damage</b>.</span>}
            />
          )}

          {/* Metallicize */}
          {statuses.metallicize > 0 && (
            <StatusIcon
              icon={<Shield size={12} />}
              value={statuses.metallicize}
              color="text-gray-300"
              borderColor="border-gray-400/50"
              label="Metallicize"
              description={<span>At the end of turn, gain <b className="text-white">{statuses.metallicize} Block</b>.</span>}
            />
          )}

          {/* Thorns */}
          {statuses.thorns > 0 && (
            <StatusIcon
              icon={<Sprout size={12} />}
              value={statuses.thorns}
              color="text-green-400"
              borderColor="border-green-500/50"
              label="Thorns"
              description={<span>When attacked, deal <b className="text-white">{statuses.thorns} damage</b> back.</span>}
            />
          )}

          {/* Artifact */}
          {statuses.artifact > 0 && (
            <StatusIcon
              icon={<Hexagon size={12} />}
              value={statuses.artifact}
              color="text-cyan-400"
              borderColor="border-cyan-500/50"
              label="Artifact"
              description={<span>Negates the next <b className="text-white">{statuses.artifact} debuff(s)</b>.</span>}
            />
          )}

          {/* Antifragile */}
          {statuses.antifragile > 0 && (
            <StatusIcon
              icon={<ArrowUpCircle size={12} />}
              value={statuses.antifragile}
              color="text-pink-400"
              borderColor="border-pink-500/50"
              label="Antifragile"
              description={<span>At start of turn, gain <b className="text-white">+{statuses.antifragile} Strength</b>.</span>}
            />
          )}

          {/* --- ENEMY SPECIFIC --- */}

          {/* Growth */}
          {getEnemyStatus('growth') > 0 && (
            <StatusIcon
              icon={<BarChart3 size={12} />}
              value={getEnemyStatus('growth')}
              color="text-info"
              borderColor="border-info/50"
              label="Growth"
              description={<span>Gains <b className="text-white">+{getEnemyStatus('growth')} Strength</b> per turn.</span>}
            />
          )}

          {/* Curl Up */}
          {getEnemyStatus('curlUp') > 0 && (
            <StatusIcon
              icon={<Shield size={12} />}
              value={getEnemyStatus('curlUp')}
              color="text-blue-300"
              borderColor="border-blue-300/50"
              label="Curl Up"
              description={<span>On taking damage, gain <b className="text-white">{getEnemyStatus('curlUp')} Block</b>. (Once per combat)</span>}
            />
          )}

          {/* Malleable */}
          {getEnemyStatus('malleable') > 0 && (
            <StatusIcon
              icon={<Layers size={12} />}
              value={getEnemyStatus('malleable')}
              color="text-indigo-400"
              borderColor="border-indigo-500/50"
              label="Malleable"
              description={<span>On taking damage, gain <b className="text-white">{getEnemyStatus('malleable')} Block</b>. Increases by 1 each time.</span>}
            />
          )}

          {/* Asleep */}
          {getEnemyStatus('asleep') > 0 && (
            <StatusIcon
              icon={<Moon size={12} />}
              value={0} // Value doesn't matter much, maybe show nothing or just icon
              color="text-purple-300"
              borderColor="border-purple-300/50"
              label="Asleep"
              description={<span>This enemy is asleep. Wakes up if it takes damage.</span>}
            />
          )}

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
            ${intent.type === 'attack' ? 'bg-black/80 border-danger/50 text-danger' :
            intent.type === 'buff' ? 'bg-black/80 border-warning/50 text-warning' :
              intent.type === 'debuff' ? 'bg-black/80 border-purple-500/50 text-purple-400' :
                'bg-black/50 border-white/20 text-white'}
        `}>
          {getIntentIcon(intent.type)}
          <span className="font-bold">{intent.type === 'attack' ? calculateIntentDamage() : (intent.value > 0 ? intent.value : '')}</span>
          <span className="opacity-80">{intent.description || 'Unknown Intent'}</span>

          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 border border-gray-600 rounded text-xs text-left shadow-xl hidden group-hover/intent:block z-[100] text-white whitespace-normal break-words">
            <div className="font-bold mb-2 border-b border-gray-700 pb-1 uppercase tracking-wider text-gray-400">Forecast</div>

            {intent.type === 'attack' && (
              <div>
                <p className="text-white mb-1">
                  Intends to deal <b className="text-danger text-sm">{calculateIntentDamage()} Damage</b>.
                </p>
                {statuses && statuses.strength !== 0 && (
                  <p className="text-gray-500 italic text-[10px] mt-1">
                    (Base {intent.value} {statuses.strength > 0 ? '+' : ''}{statuses.strength} Complexity)
                  </p>
                )}
                {statuses && statuses.weak > 0 && (
                  <p className="text-purple-400 italic text-[10px] mt-1">
                    (Reduced by Weak: -25%)
                  </p>
                )}
              </div>
            )}

            {intent.type === 'buff' && (
              <div>
                <p className="text-warning font-bold mb-1">{intent.description}</p>
                <div className="text-gray-300">
                  {intent.description.includes('Growth') ? 'Gains Strength per turn.' : 'Buffs self.'}
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