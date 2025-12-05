
import React, { useRef, useEffect, useState } from 'react';
import { MapLayer, MapNode } from '../types';
import { Skull, Circle, Coffee, Store, Gem, HelpCircle, Gift } from 'lucide-react';

interface MapScreenProps {
  map: MapLayer[];
  currentFloor: number;
  currentNodeId: string | null;
  onNodeSelect: (node: MapNode) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ map, currentFloor, currentNodeId, onNodeSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Calculate node positions for SVG connections
  useEffect(() => {
    if (!containerRef.current) return;

    const positions = new Map<string, { x: number; y: number }>();
    map.forEach((layer) => {
      layer.forEach((node) => {
        const element = document.getElementById(`node-${node.id}`);
        if (element && containerRef.current) {
          const rect = element.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          positions.set(node.id, {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
          });
        }
      });
    });
    setNodePositions(positions);
  }, [map]);

  // Get icon based on node type
  const getNodeIcon = (type: MapNode['type']) => {
    switch (type) {
      case 'boss': return <Skull size={32} className="text-danger animate-pulse" />;
      case 'retrospective': return <Coffee size={20} className="text-green-400" />;
      case 'vendor': return <Store size={20} className="text-yellow-400" />;
      case 'elite': return <Gem size={24} className="text-purple-400 animate-pulse" />;
      case 'opportunity': return <HelpCircle size={20} className="text-blue-400" />;
      case 'treasure': return <Gift size={20} className="text-amber-400" />;
      case 'problem':
      default:
        return <Circle size={20} className="fill-current text-red-400" />;
    }
  };

  const getNodeLabel = (type: MapNode['type']) => {
    switch (type) {
      case 'boss': return 'Boss - Series Gate';
      case 'retrospective': return 'Retrospective (Rest)';
      case 'vendor': return 'Vendor (Shop)';
      case 'elite': return 'Milestone (Elite)';
      case 'opportunity': return 'Opportunity (?)';
      case 'treasure': return 'Funding Round (Relic)';
      case 'problem': return 'Problem (Combat)';
      default: return 'Unknown';
    }
  };

  const getNodeBgColor = (node: MapNode, isAccessible: boolean) => {
    if (node.completed) return 'bg-primary/20 border-primary';
    if (!isAccessible) return 'bg-black border-gray-800';

    switch (node.type) {
      case 'boss': return 'bg-red-900/50 border-red-500';
      case 'elite': return 'bg-purple-900/50 border-purple-500';
      case 'retrospective': return 'bg-green-900/50 border-green-500';
      case 'vendor': return 'bg-yellow-900/50 border-yellow-500';
      case 'opportunity': return 'bg-blue-900/50 border-blue-500';
      case 'treasure': return 'bg-amber-900/50 border-amber-500';
      default: return 'bg-surface border-white';
    }
  };

  // Determine if a node is accessible
  const isNodeAccessible = (node: MapNode): boolean => {
    // First floor nodes are always accessible at start
    if (node.floor === 1 && currentFloor === 0) return true;

    // If we're on a specific node, only its connections are accessible
    if (currentNodeId) {
      const currentLayer = map.find(layer => layer.some(n => n.id === currentNodeId));
      const currentNode = currentLayer?.find(n => n.id === currentNodeId);
      if (currentNode) {
        return currentNode.connections.includes(node.id);
      }
    }

    // Fallback: floor-based accessibility
    return node.floor === currentFloor + 1 && !node.completed;
  };

  // Generate SVG path connections
  const renderConnections = () => {
    const paths: JSX.Element[] = [];

    map.forEach((layer) => {
      layer.forEach((node) => {
        const fromPos = nodePositions.get(node.id);
        if (!fromPos) return;

        node.connections.forEach((targetId) => {
          const toPos = nodePositions.get(targetId);
          if (!toPos) return;

          const isActive = node.completed || (currentNodeId === node.id);
          const controlPointOffset = (toPos.x - fromPos.x) * 0.3;

          paths.push(
            <path
              key={`${node.id}-${targetId}`}
              d={`M ${fromPos.x} ${fromPos.y} C ${fromPos.x + controlPointOffset} ${fromPos.y}, ${toPos.x - controlPointOffset} ${toPos.y}, ${toPos.x} ${toPos.y}`}
              stroke={isActive ? '#00FF88' : '#333'}
              strokeWidth={isActive ? 3 : 2}
              fill="none"
              opacity={node.completed ? 0.3 : 0.6}
              className="transition-all duration-300"
            />
          );
        });
      });
    });

    return paths;
  };

  // Node dimensions
  const nodeSize = 56;
  const nodeSpacingX = 80;
  const nodeSpacingY = 70;
  const paddingX = 60;
  const paddingY = 40;

  return (
    <div className="flex flex-col items-center min-h-[60vh] p-4 animate-in fade-in duration-500">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">THE INCUBATOR</h2>
        <p className="text-gray-400 font-mono text-sm">Act 1: Finding Product-Market Fit</p>
      </div>

      {/* Horizontal scrollable map container */}
      <div className="w-full overflow-x-auto pb-4">
        <div
          ref={containerRef}
          className="relative"
          style={{
            minWidth: `${17 * nodeSpacingX + paddingX * 2}px`,
            minHeight: `${7 * nodeSpacingY + paddingY * 2}px`
          }}
        >
          {/* SVG layer for connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            {renderConnections()}
          </svg>

          {/* Floor labels */}
          {map.map((_, floorIdx) => (
            <div
              key={`floor-label-${floorIdx}`}
              className="absolute text-xs font-mono text-gray-600"
              style={{
                left: `${paddingX + floorIdx * nodeSpacingX + nodeSize / 2 - 15}px`,
                bottom: '5px'
              }}
            >
              {floorIdx === map.length - 1 ? 'BOSS' : `S${floorIdx + 1}`}
            </div>
          ))}

          {/* Nodes */}
          {map.map((layer, floorIdx) => (
            <React.Fragment key={`floor-${floorIdx}`}>
              {layer.map((node) => {
                const accessible = isNodeAccessible(node);
                const isClickable = accessible && !node.completed;
                const isCurrent = currentNodeId === node.id;

                return (
                  <button
                    id={`node-${node.id}`}
                    key={node.id}
                    disabled={!isClickable}
                    onClick={() => isClickable && onNodeSelect(node)}
                    className={`
                      absolute group flex items-center justify-center rounded-full border-2 transition-all duration-300
                      ${getNodeBgColor(node, accessible)}
                      ${node.completed ? 'grayscale opacity-50' : ''}
                      ${isClickable ? 'hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] cursor-pointer z-10' : 'cursor-not-allowed opacity-60'}
                      ${isCurrent ? 'ring-4 ring-primary ring-opacity-50' : ''}
                      ${node.type === 'boss' ? 'w-20 h-20' : 'w-14 h-14'}
                    `}
                    style={{
                      left: `${paddingX + floorIdx * nodeSpacingX}px`,
                      top: `${paddingY + node.column * nodeSpacingY}px`
                    }}
                  >
                    {getNodeIcon(node.type)}

                    {/* Tooltip */}
                    {isClickable && (
                      <div className="absolute bottom-full mb-2 bg-gray-900 text-xs px-2 py-1 rounded border border-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {getNodeLabel(node.type)}
                      </div>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-gray-500 mt-4">
        <div className="flex items-center gap-1">
          <Circle size={12} className="fill-red-400 text-red-400" /> Problem
        </div>
        <div className="flex items-center gap-1">
          <Gem size={12} className="text-purple-400" /> Elite
        </div>
        <div className="flex items-center gap-1">
          <Coffee size={12} className="text-green-400" /> Rest
        </div>
        <div className="flex items-center gap-1">
          <Store size={12} className="text-yellow-400" /> Shop
        </div>
        <div className="flex items-center gap-1">
          <HelpCircle size={12} className="text-blue-400" /> Event
        </div>
        <div className="flex items-center gap-1">
          <Gift size={12} className="text-amber-400" /> Treasure
        </div>
        <div className="flex items-center gap-1">
          <Skull size={12} className="text-danger" /> Boss
        </div>
      </div>
    </div>
  );
};
