'use client';

import React, { useMemo, useState } from 'react';
import { ArchitectureEdge, ArchitectureNode } from './welcome.types';
import './ArchitectureMap.css';

type ArchitectureMapProps = {
  edges: ArchitectureEdge[];
  nodes: ArchitectureNode[];
};

export function ArchitectureMap({ edges, nodes }: ArchitectureMapProps) {
  const [activeId, setActiveId] = useState(nodes[0]?.id ?? '');

  const connected = useMemo(() => {
    const ids = new Set<string>([activeId]);

    for (const edge of edges) {
      if (edge.from === activeId || edge.to === activeId) {
        ids.add(edge.from);
        ids.add(edge.to);
      }
    }

    return ids;
  }, [activeId, edges]);

  const active = nodes.find((node) => node.id === activeId);

  return (
    <div className="architecture-map">
      <p className="architecture-map__label technical">Module graphhhh</p>
      <div className="architecture-map__stage">
        <svg
          aria-hidden="true"
          className="architecture-map__edges"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {edges.map((edge) => {
            const from = nodes.find((node) => node.id === edge.from);
            const to = nodes.find((node) => node.id === edge.to);

            if (!from || !to) {
              return null;
            }

            const isLive = connected.has(edge.from) && connected.has(edge.to);

            return (
              <line
                className={
                  isLive
                    ? 'architecture-map__line is-live'
                    : 'architecture-map__line'
                }
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                x2={to.x}
                y1={from.y}
                y2={to.y}
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const isActive = node.id === activeId;
          const isConnected = connected.has(node.id);

          return (
            <button
              aria-pressed={isActive}
              className={[
                'architecture-map__node',
                `architecture-map__node--${node.kind}`,
                isActive ? 'is-active' : '',
                isConnected ? 'is-connected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={node.id}
              onClick={() => setActiveId(node.id)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              type="button"
            >
              {node.label}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="architecture-map__detail">
        {active?.detail}
      </p>
    </div>
  );
}
