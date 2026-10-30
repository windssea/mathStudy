import { useEffect, useId, useRef, useState } from 'react';
import type { MethodNode } from '@mathstudy/animation-engine';

const textWidth = (value: string, size: number) =>
  [...value].reduce((sum, character) => sum + (/[^\x00-\xff]/.test(character) ? 1 : 0.57), 0) *
  size;

function wrapLabel(value: string, width: number, size: number) {
  const lines: string[] = [];
  let line = '';
  // A number is one mathematical label: never turn 1206 into "12" above "06".
  for (const token of value.match(/\d+(?:\.\d+)?|[^\d]/gu) ?? []) {
    if (line && textWidth(line + token, size) > width) {
      lines.push(line);
      line = token;
    } else line += token;
  }
  if (line) lines.push(line);
  return lines;
}

/** Geometry scales with the panel; labels retain a minimum of 16 actual CSS pixels.
 * A segment too small for its quantity uses a numbered key instead of shrinking the text. */
export default function MethodDiagram({ nodes, label }: { nodes: MethodNode[]; label: string }) {
  const title = useId();
  const svg = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) setScale(Math.min(width / 400, height / 250));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const font = (size = 22, minimum = 16) => Math.max(size, minimum / scale);
  const externalLabels: {
    index: number;
    label: string;
    tone: string;
    x: number;
    y: number;
    anchorX: number;
    anchorY: number;
  }[] = [];
  const shapes = nodes.map((node, i) => {
    const className = `diagram-${node.tone}`;
    switch (node.kind) {
      case 'rect': {
        const size = font(22, node.label && /^\d+(?:\.\d+)?$/.test(node.label) ? 18 : 16);
        const lines = node.label ? wrapLabel(node.label, Math.max(1, node.w - 12), size) : [];
        const external =
          !!node.label &&
          (lines.some((line) => textWidth(line, size) > node.w - 8) ||
            lines.length * size * 1.2 > node.h - 8);
        const key = externalLabels.length + 1;
        if (external)
          externalLabels.push({
            index: key,
            label: node.label!,
            tone: className,
            x: node.x + node.w / 2,
            y: node.y - 8 / scale,
            anchorX: node.x + node.w / 2,
            anchorY: node.y,
          });
        return (
          <g key={i} className={className} data-node-label={node.label}>
            <rect
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              rx={5}
              strokeDasharray={node.dashed ? '7 5' : undefined}
            />
            {node.label && !external && (
              <text
                x={node.x + node.w / 2}
                y={node.y + node.h / 2 - ((lines.length - 1) * size * 1.2) / 2}
                dominantBaseline="central"
                fontSize={size}
                className="diagram-rect-label"
              >
                {lines.map((line, j) => (
                  <tspan key={j} x={node.x + node.w / 2} dy={j ? size * 1.2 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        );
      }
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
      case 'text': {
        const size = font(node.size, /\d/.test(node.text) ? 18 : 16);
        const lines = wrapLabel(node.text, 376, size);
        const width = Math.min(376, Math.max(...lines.map((line) => textWidth(line, size))));
        const x = Math.max(width / 2 + 10, Math.min(390 - width / 2, node.x));
        const y = Math.max(size, Math.min(node.y, 244 - (lines.length - 1) * size * 1.2));
        return (
          <text key={i} className={className} x={x} y={y} fontSize={size}>
            {lines.map((line, j) => (
              <tspan key={j} x={x} dy={j ? size * 1.2 : 0}>
                {line}
              </tspan>
            ))}
          </text>
        );
      }
      case 'dot':
        return <circle key={i} className={className} cx={node.x} cy={node.y} r={6} />;
    }
  });
  // Tiny adjacent quantities still need distinct keys. Spread keys in the same row
  // and connect each one to its original segment without changing mathematical scale.
  const markerRows: (typeof externalLabels)[] = [];
  for (const marker of externalLabels) {
    const row = markerRows.find((items) => Math.abs(items[0].y - marker.y) < 22 / scale);
    if (row) row.push(marker);
    else markerRows.push([marker]);
  }
  for (const row of markerRows) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) row[i].x = Math.max(row[i].x, row[i - 1].x + 26 / scale);
    row[row.length - 1].x = Math.min(row[row.length - 1].x, 390 - 9 / scale);
    for (let i = row.length - 2; i >= 0; i--)
      row[i].x = Math.min(row[i].x, row[i + 1].x - 26 / scale);
  }
  return (
    <div className="method-diagram-wrap">
      <svg
        ref={svg}
        className="method-diagram"
        viewBox="0 0 400 250"
        role="img"
        aria-labelledby={title}
        aria-describedby={`${title}-description`}
      >
        <title id={title}>{label}</title>
        <desc id={`${title}-description`}>
          {nodes
            .flatMap((node) =>
              node.kind === 'text'
                ? [node.text]
                : node.kind === 'rect' && node.label
                  ? [node.label]
                  : [],
            )
            .join('；')}
        </desc>
        {shapes}
        {externalLabels.map((item) => (
          <g key={item.index} className={item.tone}>
            {Math.abs(item.x - item.anchorX) > 4 && (
              <line
                className="diagram-label-leader"
                x1={item.x}
                y1={item.y + 4 / scale}
                x2={item.anchorX}
                y2={item.anchorY}
              />
            )}
            <text x={item.x} y={item.y} fontSize={font(18)} className="diagram-label-marker">
              {item.index}
            </text>
          </g>
        ))}
      </svg>
      {externalLabels.length > 0 && (
        <ol className="diagram-labels" aria-label="分块标注">
          {externalLabels.map((item) => (
            <li key={item.index} className={item.tone}>
              <span aria-label={`标注${item.index}`}>{item.index}</span>
              {item.label}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
