import { useId } from 'react';
import type { MethodNode } from '@mathstudy/animation-engine';

/** SVG labels remain text, so diagrams can be read by assistive technology and zoomed. */
export default function MethodDiagram({ nodes, label }: { nodes: MethodNode[]; label: string }) {
  const title = useId();
  return (
    <svg className="method-diagram" viewBox="0 0 400 250" role="img" aria-labelledby={title}>
      <title id={title}>{label}</title>
      {nodes.map((node, i) => {
        const className = `diagram-${node.tone}`;
        switch (node.kind) {
          case 'rect':
            return (
              <g key={i} className={className}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={5}
                  strokeDasharray={node.dashed ? '7 5' : undefined}
                />
                {node.label && (
                  <text
                    x={node.x + node.w / 2}
                    y={node.y + node.h / 2}
                    dominantBaseline="central"
                    fontSize={Math.min(
                      24,
                      (node.w - 10) /
                        [...node.label].reduce(
                          (n, c) => n + (/[\u3000-\u9fff]/.test(c) ? 1 : 0.56),
                          0,
                        ),
                    )}
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          case 'line':
            return (
              <line
                key={i}
                className={className}
                x1={node.x}
                y1={node.y}
                x2={node.x2}
                y2={node.y2}
                strokeDasharray={node.dashed ? '8 6' : undefined}
              />
            );
          case 'text':
            return (
              <text key={i} className={className} x={node.x} y={node.y} fontSize={node.size}>
                {node.text}
              </text>
            );
          case 'dot':
            return <circle key={i} className={className} cx={node.x} cy={node.y} r={6} />;
        }
      })}
    </svg>
  );
}
