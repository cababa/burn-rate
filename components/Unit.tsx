

import React from 'react';
import { Terminal, Sword, TrendingUp, ShieldAlert, HelpCircle, Shield, AlertTriangle, Zap, BarChart3, TrendingDown, ArrowUpCircle } from 'lucide-react';
import { EnemyIntent, EntityStatus, EnemyStatus } from '../types';

interface UnitProps {
  name: string;
  currentHp: number;
  maxHp: number;
  emoji: string;
  isEnemy?: boolean;
  intent?: EnemyIntent;
  statuses?: EntityStatus | EnemyStatus;
  mitigation?: number;
  description?: string;
  onDrop?: (e: React.DragEvent) => void;
  isTargetable?: boolean;
}

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
  isTargetable
}) => {
  const hpPercent = Math.max(0, (currentHp / maxHp) * 100);
  
  const handleDragOver = (e: React.DragEvent) => {
    if (isTargetable) {
      e.preventDefault(); // Allow drop
    }
  };

  const isDead = currentHp <= 0;

  const getIntentIcon = (type: string) => {
    switch(type) {
        case 'attack': return <Sword size={14} />;
        case 'buff': return <TrendingUp size={14} />;
        case 'debuff': return <ShieldAlert size={14} />;
        default: return <HelpCircle size={14} />;
    }
  };

  // Helper to safely access growth if it exists
  const getGrowth = () => {
      if (statuses && 'growth' in statuses) return (statuses as EnemyStatus).growth;
      return 0;
  };

  // Helper to calculate intent damage for display
  const calculateIntentDamage = () => {
      if (!intent || intent.type !== 'attack' || !statuses) return intent?.value || 0;
      let dmg = intent.value + statuses.strength;
      // Note: We don't have access to player Vulnerable here easily without prop drilling,
      // so we stick to Base + Strength calc for display, which matches Slay the Spire default intent number behavior (modified by str)
      return Math.max(0, dmg);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={onDrop}
      className={`
        relative flex flex-col items-center gap-4 p-8 rounded-xl border-2 transition-all duration-150 group hover:z-50
        ${isEnemy ? 'items-end text-right' : 'items-start text-left'}
        ${isTargetable ? 'border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary/50 cursor-crosshair' : 'border-transparent'}
        ${isDead ? 'opacity-50 grayscale blur-[2px]' : ''}
        min-w-[280px]
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
          <div className={`absolute top-0 ${isEnemy ? 'right-0 justify-end' : 'left-0 justify-start'} -mt-8 flex gap-2 min-w-[200px]`}>
              {/* Vulnerable */}
              {statuses.vulnerable > 0 && (
                <div className="group/status relative flex items-center gap-1 bg-black/80 border border-danger/50 text-danger px-2 py-1 rounded text-xs animate-pulse-fast shadow-lg cursor-help">
                    <AlertTriangle size={12} />
                    <span className="font-bold">{statuses.vulnerable}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 border border-danger rounded text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words">
                        <div className="text-danger font-bold mb-1 uppercase tracking-wider">Vulnerable</div>
                        <div className="text-gray-300">
                           Incoming damage is multiplied by <b className="text-white">1.5x</b>.
                        </div>
                         <div className="text-gray-500 mt-1 italic">Lasts {statuses.vulnerable} more turn(s).</div>
                    </div>
                </div>
              )}
              {/* Weak */}
              {statuses.weak > 0 && (
                <div className="group/status relative flex items-center gap-1 bg-black/80 border border-purple-500/50 text-purple-400 px-2 py-1 rounded text-xs shadow-lg cursor-help">
                    <TrendingDown size={12} />
                    <span className="font-bold">{statuses.weak}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 border border-purple-500 rounded text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words">
                        <div className="text-purple-400 font-bold mb-1 uppercase tracking-wider">Weak</div>
                        <div className="text-gray-300">
                           Attacks deal <b className="text-white">25% less damage</b>.
                        </div>
                         <div className="text-gray-500 mt-1 italic">Lasts {statuses.weak} more turn(s).</div>
                    </div>
                </div>
              )}
              {/* Strength (Execution Power) */}
              {statuses.strength !== 0 && (
                <div className={`
                    group/status relative flex items-center gap-1 bg-black/80 border px-2 py-1 rounded text-xs shadow-lg cursor-help
                    ${statuses.strength > 0 ? 'border-warning/50 text-warning' : 'border-blue-400/50 text-blue-400'}
                `}>
                    {statuses.strength > 0 ? <Zap size={12} className="fill-current" /> : <TrendingDown size={12} />}
                    <span className="font-bold">{statuses.strength > 0 ? '+' : ''}{statuses.strength}</span>

                    {/* Tooltip */}
                    <div className={`absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 border rounded text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words ${statuses.strength > 0 ? 'border-warning' : 'border-blue-400'}`}>
                        <div className={`${statuses.strength > 0 ? 'text-warning' : 'text-blue-400'} font-bold mb-1 uppercase tracking-wider`}>
                            {isEnemy ? 'Complexity' : 'Execution Power'} (Strength)
                        </div>
                        <div className="text-gray-300">
                           Attacks deal <b className="text-white">{statuses.strength > 0 ? '+' : ''}{statuses.strength} damage</b>.
                        </div>
                    </div>
                </div>
              )}
              {/* Antifragile */}
              {statuses.antifragile > 0 && (
                <div className="group/status relative flex items-center gap-1 bg-black/80 border border-pink-500/50 text-pink-400 px-2 py-1 rounded text-xs shadow-lg cursor-help">
                    <ArrowUpCircle size={12} />
                    <span className="font-bold">+{statuses.antifragile}</span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 border border-pink-500 rounded text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words">
                        <div className="text-pink-500 font-bold mb-1 uppercase tracking-wider">Antifragile</div>
                        <div className="text-gray-300">
                           At the start of your turn, gain <b className="text-white">+{statuses.antifragile} Strength</b>.
                        </div>
                    </div>
                </div>
              )}
              {/* Growth (Enemy Only) */}
              {getGrowth() > 0 && (
                <div className="group/status relative flex items-center gap-1 bg-black/80 border border-info/50 text-info px-2 py-1 rounded text-xs shadow-lg cursor-help">
                    <BarChart3 size={12} />
                    <span className="font-bold">+{getGrowth()}/turn</span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 border border-info rounded text-xs text-left shadow-xl hidden group-hover/status:block z-[100] whitespace-normal break-words">
                        <div className="text-info font-bold mb-1 uppercase tracking-wider">Growth</div>
                        <div className="text-gray-300">
                           At the end of its turn, this unit gains <b className="text-white">+{getGrowth()} Complexity</b> (Strength).
                        </div>
                    </div>
                </div>
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
        w-36 h-36 flex items-center justify-center text-7xl rounded-lg border border-white/10 bg-black/40 shadow-xl pointer-events-none
        ${isTargetable ? 'group-hover:ring-2 group-hover:ring-primary/50' : ''}
        ${isEnemy && statuses?.vulnerable ? 'ring-2 ring-danger animate-pulse-fast' : ''}
        transition-all duration-150
      `}>
        {isDead ? '💀' : emoji}
      </div>

      {/* Stats Bar (Runway/Health) */}
      <div className="w-56 space-y-1 pointer-events-none">
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
                             Gains <b className="text-white">+{intent.value} Growth</b> (Complexity/Turn).
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