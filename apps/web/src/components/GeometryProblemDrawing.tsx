import { areaPairs, cornerCutMetrics, perimeterPairs } from '@mathstudy/math-core';

export function CornerCutDrawing({ values, step }: { values: number[]; step: number }) {
  const [a, b, cutA = 0, cutB = 0] = values;
  const scale = Math.min(270 / a, 195 / b),
    w = a * scale,
    h = b * scale,
    x = (500 - w) / 2,
    y = 45,
    cw = cutA * scale,
    ch = cutB * scale;
  const remaining = cutA > 0 ? cornerCutMetrics(a, b, cutA, cutB).remainingArea : a * b;
  return (
    <>
      <path
        d={
          step >= 2 && cutA > 0
            ? `M${x} ${y}H${x + w - cw}V${y + ch}H${x + w}V${y + h}H${x}Z`
            : `M${x} ${y}H${x + w}V${y + h}H${x}Z`
        }
        fill="#d9e6ff"
        stroke="#3563e9"
        strokeWidth="2"
      />
      {Array.from({ length: a - 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={x + (i + 1) * scale}
          x2={x + (i + 1) * scale}
          y1={step >= 2 && i + 1 > a - cutA ? y + ch : y}
          y2={y + h}
          stroke="#b4c8e9"
        />
      ))}
      {Array.from({ length: b - 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={x}
          x2={step >= 2 && i + 1 < cutB ? x + w - cw : x + w}
          y1={y + (i + 1) * scale}
          y2={y + (i + 1) * scale}
          stroke="#b4c8e9"
        />
      ))}
      {cutA > 0 && step >= 1 && (
        <>
          <rect
            x={x + w - cw}
            y={y}
            width={cw}
            height={ch}
            fill={step >= 2 ? '#fcfcff' : '#ffd5b6'}
            stroke="#c47f4b"
            strokeDasharray="4 3"
          />
          <text x={x + w - cw / 2} y={y + ch / 2 + 5} textAnchor="middle" fontSize="13">
            {cutA}×{cutB}={cutA * cutB}
          </text>
        </>
      )}
      <text x="250" y={y + h + 27} textAnchor="middle" fontSize="16">
        {a} 厘米
      </text>
      <text
        x={x - 25}
        y={y + h / 2}
        textAnchor="middle"
        fontSize="16"
        transform={`rotate(-90 ${x - 25} ${y + h / 2})`}
      >
        {b} 厘米
      </text>
      <text
        x="250"
        y={y + h * 0.66}
        textAnchor="middle"
        fill="#254caf"
        fontSize="20"
        fontWeight="700"
      >
        {step >= 2 ? `${remaining} 平方厘米` : `${a} × ${b} = ${a * b}`}
      </text>
      <text x="250" y="294" textAnchor="middle" fontSize="15">
        {step === 0
          ? '先求完整的面积'
          : step === 1
            ? '找出剪去部分的面积'
            : `${a * b} − ${cutA * cutB} = ${remaining}（平方厘米）`}
      </text>
    </>
  );
}

export function ComparisonDrawing({
  kind,
  value,
  step,
}: {
  kind: 'perimeterComparison' | 'areaComparison';
  value: number;
  step: number;
}) {
  const fixedPerimeter = kind === 'perimeterComparison',
    pairs = fixedPerimeter ? perimeterPairs(value) : areaPairs(value);
  const index = step === 0 ? 0 : step === 1 ? Math.floor(pairs.length / 2) : pairs.length - 1,
    p = pairs[index];
  const scale = Math.min(300 / p.length, 150 / p.width),
    w = p.length * scale,
    h = p.width * scale,
    x = 250 - w / 2,
    y = 120 - h / 2;
  return (
    <>
      <text x="250" y="28" textAnchor="middle" fontSize="17">
        {fixedPerimeter ? `周长保持 ${value} 厘米` : `面积保持 ${value} 平方厘米`}
      </text>
      <rect x={x} y={y} width={w} height={h} fill="#dce7ff" stroke="#3563e9" strokeWidth="2" />
      {Array.from({ length: p.length - 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={x + (i + 1) * scale}
          x2={x + (i + 1) * scale}
          y1={y}
          y2={y + h}
          stroke="#b3c7e7"
        />
      ))}
      {Array.from({ length: p.width - 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={x}
          x2={x + w}
          y1={y + (i + 1) * scale}
          y2={y + (i + 1) * scale}
          stroke="#b3c7e7"
        />
      ))}
      <text x="250" y={y - 13} textAnchor="middle" fontSize="15">
        {p.length} 厘米
      </text>
      <text x="250" y={y + h + 23} textAnchor="middle" fontSize="15">
        宽 {p.width} 厘米
      </text>
      <text x="250" y="240" textAnchor="middle" fontSize="16" fill="#3563e9">
        C = {p.perimeter} 厘米
      </text>
      <text x="250" y="265" textAnchor="middle" fontSize="16" fill="#3563e9">
        S = {p.area} 平方厘米
      </text>
      <text x="250" y="300" textAnchor="middle" fontSize="14">
        {step >= 2
          ? fixedPerimeter
            ? '6 × 6，面积最大：36 平方厘米'
            : '6 × 6，周长最短：24 厘米'
          : '边长取整厘米，交换长与宽算同一种组合'}
      </text>
    </>
  );
}

export function WallFenceDrawing({ values, step }: { values: number[]; step: number }) {
  const [a, b] = values,
    scale = Math.min(300 / a, 160 / b),
    w = a * scale,
    h = b * scale,
    x = (500 - w) / 2,
    y = 80;
  return (
    <>
      <rect x={x - 15} y="48" width={w + 30} height="30" fill="#dce1e9" />
      <text x="250" y="68" textAnchor="middle" fontSize="15">
        墙（这一边不用围）
      </text>
      <rect x={x} y={y} width={w} height={h} fill="#e4f0e9" />
      <path
        d={`M${x} ${y}H${x + w}`}
        stroke={step >= 1 ? '#9aa8ba' : '#3563e9'}
        strokeDasharray={step >= 1 ? '5 4' : undefined}
        strokeWidth="4"
      />
      <path d={`M${x} ${y}V${y + h}H${x + w}V${y}`} fill="none" stroke="#3563e9" strokeWidth="4" />
      <text x="250" y={y + h + 25} textAnchor="middle" fontSize="17">
        {a} 米
      </text>
      <text x={x - 25} y={y + h / 2} textAnchor="middle" fontSize="16">
        {b}米
      </text>
      <text x={x + w + 25} y={y + h / 2} textAnchor="middle" fontSize="16">
        {b}米
      </text>
      {step >= 1 && (
        <text x="250" y={y + h / 2} textAnchor="middle" fontSize="17">
          围下面和左右三条边
        </text>
      )}
      <text x="250" y="300" textAnchor="middle" fontSize="18" fill="#3563e9">
        {step >= 2 ? `${a}＋${b}＋${b}＝${a + 2 * b}（米）` : '先确定需要围的边，再相加'}
      </text>
    </>
  );
}

export function ComparisonTable({
  kind,
  value,
  step,
}: {
  kind: 'perimeterComparison' | 'areaComparison';
  value: number;
  step: number;
}) {
  const fixedPerimeter = kind === 'perimeterComparison';
  const pairs = fixedPerimeter ? perimeterPairs(value) : areaPairs(value);
  const selected = step === 0 ? 0 : step === 1 ? Math.floor(pairs.length / 2) : pairs.length - 1;
  return (
    <div className="comparison-table problem-comparison">
      <table>
        <caption>
          列全整数边长组合，比较{fixedPerimeter ? '面积（平方厘米）' : '周长（厘米）'}
        </caption>
        <thead>
          <tr>
            <th>长 × 宽 / 厘米</th>
            <th>{fixedPerimeter ? '面积' : '周长'}</th>
            <th>当前图形</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p, i) => (
            <tr key={i} className={i === selected ? 'selected' : ''}>
              <td>
                {p.length} × {p.width}
              </td>
              <td>{fixedPerimeter ? p.area : p.perimeter}</td>
              <td>
                {i === selected ? (step === 2 ? (fixedPerimeter ? '← 最大' : '← 最短') : '←') : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
