
import React from 'react';
import { MapLayer, MapNode } from '../types';
import { Skull, Flag, Lock, Circle, Coffee, Store, Gem } from 'lucide-react';

interface MapScreenProps {
  map: MapLayer[];
  currentFloor: number;
  onNodeSelect: (node: MapNode) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ map, currentFloor, onNodeSelect }) => {
  
  // Helper to get icon based on type
  const getNodeIcon = (type: MapNode['type'], isBoss: boolean) => {
      if (isBoss) return <Skull size={32} className="text-danger animate-pulse" />;
      switch (type) {
          case 'retrospective': return <Coffee size={20} className="text-info" />;
          case 'vendor': return <Store size={20} className="text-warning" />;
          case 'milestone': return <Gem size={24} className="text-purple-400 animate-pulse" />;
          case 'problem': 
          default:
             return <Circle size={20} className="fill-current" />;
      }
  };

  const getNodeLabel = (type: MapNode['type'], isBoss: boolean) => {
      if (isBoss) return 'The Pivot (BOSS)';
      switch (type) {
          case 'retrospective': return 'Retrospective (Rest)';
          case 'vendor': return 'Vendor (Shop)';
          case 'milestone': return 'Milestone (Elite)';
          case 'problem': return 'Problem';
          default: return 'Unknown';
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-8 animate-in fade-in duration-500">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">PRODUCT ROADMAP</h2>
        <p className="text-gray-400 font-mono text-sm">Select your next milestone.</p>
      </div>

      <div className="flex flex-col-reverse gap-12 relative">
         {/* Vertical Line Connector (Simple Visual) */}
         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2 -z-10" />

         {map.map((layer, floorIndex) => {
             const floorNumber = floorIndex + 1;
             const isCurrent = floorNumber === currentFloor + 1; // Next accessible floor
             const isBoss = floorNumber === map.length;

             return (
                 <div key={floorIndex} className="relative flex items-center justify-center gap-16">
                     {/* Floor Label */}
                     <div className="absolute -left-24 text-xs font-mono text-gray-600 w-20 text-right">
                         {isBoss ? 'IPO' : `SPRINT ${floorNumber}`}
                     </div>

                     {layer.map((node) => {
                         const isClickable = isCurrent && !node.locked;
                         
                         return (
                             <button
                                key={node.id}
                                disabled={!isClickable}
                                onClick={() => isClickable && onNodeSelect(node)}
                                className={`
                                    relative group w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                    ${node.completed 
                                        ? 'bg-primary/20 border-primary text-primary grayscale opacity-50' 
                                        : isClickable 
                                            ? 'bg-surface border-white hover:border-primary hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] cursor-pointer z-10' 
                                            : 'bg-black border-gray-800 text-gray-700 cursor-not-allowed opacity-60'}
                                    ${isBoss ? 'w-24 h-24 border-danger/50' : ''}
                                    ${node.type === 'milestone' && isClickable ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''}
                                `}
                             >
                                 {getNodeIcon(node.type, isBoss)}

                                 {/* Node Type Tooltip */}
                                 {isClickable && (
                                     <div className="absolute bottom-full mb-2 bg-gray-900 text-xs px-2 py-1 rounded border border-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                         {getNodeLabel(node.type, isBoss)}
                                     </div>
                                 )}
                             </button>
                         )
                     })}
                 </div>
             )
         })}
      </div>
      
      <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mt-8">
          <div className="w-3 h-3 rounded-full bg-white border border-white"></div> Current
          <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-700 ml-4"></div> Locked
          <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary ml-4"></div> Completed
      </div>
    </div>
  );
};
