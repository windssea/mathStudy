import { Button } from './ui/button';
import { useState } from 'react';
import type { Visual } from '@mathstudy/contracts';
import { Icon } from './ui';
import ReasoningDrawing from './ReasoningDrawing';
import QuantityReasoningDiagram from './QuantityReasoningDiagram';
import {
  CornerCutDrawing,
  ComparisonDrawing,
  ComparisonTable,
  WallFenceDrawing,
} from './GeometryProblemDrawing';

export default function VisualExplanation({
  visual,
  hideTitle = false,
}: {
  visual: Visual;
  hideTitle?: boolean;
}) {
  const [step, setStep] = useState(0);
  const v = visual.values;
  const stage = visual.kind === 'reasoning' ? visual.stages?.[step] : undefined;
  const height =
    stage?.kind === 'table'
      ? Math.min(40, 305 / (stage.rows.length + 1)) * (stage.rows.length + 1) + 30
      : stage?.kind === 'flow'
        ? stage.rows.length * 105 + 25
        : stage?.kind === 'bars'
          ? (stage.values?.length ?? 0) * 72 + Math.min(stage.rows.length, 2) * 30 + 45
          : 340;
  const lineColor = '#3563e9';
  let drawing;
  if (visual.kind === 'reasoning' && visual.stages) {
    drawing = <ReasoningDrawing stage={visual.stages[step]} />;
  } else if (visual.kind === 'rectangle') {
    drawing = <CornerCutDrawing values={v} step={step} />;
  } else if (visual.kind === 'perimeterComparison' || visual.kind === 'areaComparison') {
    drawing = <ComparisonDrawing kind={visual.kind} value={v[0]} step={step} />;
  } else if (visual.kind === 'wallFence') {
    drawing = <WallFenceDrawing values={v} step={step} />;
  } else if (visual.kind === 'numberline') {
    drawing = (
      <>
        <rect x="65" y="122" width={step >= 1 ? 350 : 15} height="30" rx="15" fill="#dce7ff" />
        <path d="M35 137H465m-10-6 10 6-10 6" stroke={lineColor} fill="none" strokeWidth="2" />
        {[65, 240, 415].map((x, i) => (
          <g key={i}>
            <line x1={x} y1="126" x2={x} y2="149" stroke={lineColor} strokeWidth="2" />
            <text x={x} y="181" fontSize="17" textAnchor="middle">
              {[v[0], v[1], v[2] + 1][i]}
            </text>
          </g>
        ))}
        <circle cx="65" cy="137" r="6" fill={lineColor} />
        <circle cx="415" cy="137" r="6" fill="white" stroke={lineColor} strokeWidth="2" />
        <text x="240" y="80" textAnchor="middle" fill={lineColor}>
          四舍五入后都是 36 万
        </text>
        {step >= 2 && (
          <>
            <path d="M401 117v-19h-75" fill="none" stroke="#ce8b2b" />
            <text x="355" y="223" textAnchor="middle" fontSize="17">
              最大整数 {v[2]} · 不含 {v[2] + 1}
            </text>
          </>
        )}
      </>
    );
  } else if (visual.kind === 'multiplication') {
    const [a, b] = v,
      tens = Math.floor(b / 10) * 10,
      ones = b % 10;
    const cut = (300 * tens) / b;
    drawing = (
      <>
        <rect x="100" y="65" width={cut} height="165" fill="#dce7ff" stroke={lineColor} />
        <rect
          x={100 + cut}
          y="65"
          width={300 - cut}
          height="165"
          fill={step >= 1 ? '#ffe7a1' : '#f3f4f8'}
          stroke={lineColor}
        />
        <text x={100 + cut / 2} y="50" textAnchor="middle">
          {tens}
        </text>
        <text x={100 + cut + (300 - cut) / 2} y="50" textAnchor="middle">
          {ones}
        </text>
        <text x="66" y="154">
          {a}
        </text>
        <text x={100 + cut / 2} y="155" textAnchor="middle" fill={lineColor} fontSize="21">
          {a}×{tens}={a * tens}
        </text>
        {step >= 1 && (
          <text x={100 + cut + (300 - cut) / 2} y="155" textAnchor="middle" fontSize="17">
            {a * ones}
          </text>
        )}
        <text x="250" y="270" textAnchor="middle">
          {step >= 1 ? `${a * tens} + ${a * ones} = ${a * b}` : '先算整十的部分'}
        </text>
      </>
    );
  } else if (visual.kind === 'division') {
    const [n, d, g] = v,
      q = Math.floor(n / d),
      r = n % d;
    const results = [n, q, r > 0 ? Math.ceil(n / d) : q / g];
    const labels = [
      visual.labels[2] ?? '总量',
      `每 ${d} 一组`,
      r > 0 ? `余 ${r}，还需 1 组` : `每 ${g} 组再合一份`,
    ];
    drawing = (
      <>
        {[0, 1, 2].map((i) => (
          <g key={i} opacity={i <= step ? 1 : 0.2}>
            <rect
              x={20 + i * 165}
              y="91"
              width="135"
              height="100"
              rx="12"
              fill={i === 2 ? '#fff1cd' : '#e5edff'}
              stroke={i === 2 ? '#d9ae50' : lineColor}
            />
            <text x={87 + i * 165} y="133" textAnchor="middle" fontSize="28" fill={lineColor}>
              {results[i]}
            </text>
            <text x={87 + i * 165} y="164" textAnchor="middle" fontSize="13">
              {labels[i]}
            </text>
            {i < 2 && (
              <path d={`M${159 + i * 165} 139h20m-6-5 6 5-6 5`} stroke={lineColor} fill="none" />
            )}
          </g>
        ))}
        <text x="250" y="247" textAnchor="middle" fontSize="17">
          {r > 0 ? `${n} ÷ ${d} = ${q}……${r}` : `${n} ÷ ${d} ÷ ${g} = ${q / g}`}
        </text>
      </>
    );
  } else if (visual.kind === 'bars') {
    const values = v.slice(0, visual.labels.length),
      max = Math.max(...values);
    drawing = (
      <>
        {values.map((value, i) => (
          <g key={i} opacity={i <= step ? 1 : 0.3}>
            <text x="35" y={60 + i * 80} fontSize="15">
              {visual.labels[i]}
            </text>
            <rect
              x="35"
              y={72 + i * 80}
              width={(value / max) * 410}
              height="31"
              rx="5"
              fill={i === 0 ? '#6693ed' : i === 1 ? '#91c7b4' : '#ecc46c'}
            />
            <text x={45 + (value / max) * 410} y={94 + i * 80} fontSize="16">
              {value}
            </text>
            {values.length === 2 &&
              Array.from({ length: (v[i + 2] ?? 1) - 1 }, (_, j) => (
                <line
                  key={j}
                  x1={35 + ((value / max) * 410 * (j + 1)) / v[i + 2]}
                  x2={35 + ((value / max) * 410 * (j + 1)) / v[i + 2]}
                  y1={72 + i * 80}
                  y2={103 + i * 80}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
          </g>
        ))}
      </>
    );
  } else {
    drawing = (
      <>
        {visual.captions.map((caption, i) => (
          <g key={i} opacity={i <= step ? 1 : 0.2}>
            <rect
              x="30"
              y={25 + i * 90}
              width="440"
              height="66"
              rx="10"
              fill={i === step ? '#e5edff' : '#f1f3f8'}
              stroke={i === step ? lineColor : '#dce1ec'}
            />
            <circle cx="58" cy={58 + i * 90} r="14" fill={lineColor} />
            <text x="58" y={63 + i * 90} fill="white" textAnchor="middle" fontSize="15">
              {i + 1}
            </text>
            <foreignObject x="83" y={36 + i * 90} width="365" height="55">
              <div className="svg-foreign-text">{caption}</div>
            </foreignObject>
          </g>
        ))}
      </>
    );
  }
  return (
    <section className="visual-explanation" aria-label="可视化分步讲解">
      <div className="visual-heading">
        <span>
          <Icon name="Shapes" size={19} />
          图解
        </span>
        <span>
          {step + 1} / {visual.captions.length}
        </span>
      </div>
      {!hideTitle && <h4>{visual.title}</h4>}
      {stage && (stage.kind === 'table' || stage.kind === 'bars') ? (
        <figure
          className="quantity-reasoning-figure"
          aria-label={`${visual.title}。${visual.captions[step]}`}
        >
          <QuantityReasoningDiagram stage={stage} />
        </figure>
      ) : (
        <svg
          viewBox={
            visual.kind === 'reasoning'
              ? `0 0 720 ${height}`
              : visual.kind === 'rectangle'
                ? '100 0 300 310'
                : '0 0 500 310'
          }
          className={visual.kind === 'rectangle' ? 'corner-visual' : undefined}
          role="img"
          aria-label={`${visual.title}。${visual.captions[step]}`}
        >
          {drawing}
        </svg>
      )}
      {(visual.kind === 'perimeterComparison' || visual.kind === 'areaComparison') && (
        <ComparisonTable kind={visual.kind} value={v[0]} step={step} />
      )}
      <p className="visual-caption" aria-live="polite">
        {visual.captions[step]}
      </p>
      <div className="visual-controls">
        <Button
          variant="outline"
          className="button secondary small-button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <Icon name="ArrowLeft" size={16} />
          上一步
        </Button>
        <div className="step-dots">
          {visual.captions.map((_, i) => (
            <button
              aria-label={`查看图解第${i + 1}步`}
              aria-pressed={i === step}
              className={i === step ? 'active' : ''}
              key={i}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        <Button
          variant="outline"
          className="button secondary small-button"
          disabled={step === visual.captions.length - 1}
          onClick={() => setStep(step + 1)}
        >
          下一步
          <Icon name="ArrowRight" size={16} />
        </Button>
      </div>
    </section>
  );
}
