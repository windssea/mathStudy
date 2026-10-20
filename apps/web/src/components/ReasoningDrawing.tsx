import type { Visual } from '@mathstudy/contracts';
import { CellDrawing } from './GridExercise';

type Stage = NonNullable<Visual['stages']>[number];
const blue = '#3563e9';
export default function ReasoningDrawing({ stage }: { stage: Stage }) {
  if (stage.kind === 'image')
    return <image href={stage.image} x="0" y="0" width="720" height="340" />;
  if (stage.kind === 'packing') {
    const showRotated = stage.headings[1] === 'rotated';
    return (
      <g>
        <text x="360" y="35" textAnchor="middle" fontSize="20">
          23厘米 × 9厘米
        </text>
        <rect x="60" y="65" width="598" height="234" fill="#fff" stroke="#768caf" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x={60 + (i % 4) * 130}
            y={65 + Math.floor(i / 4) * 78}
            width="130"
            height="78"
            fill="#e2ebff"
            stroke="#3563e9"
            strokeWidth="2"
          />
        ))}
        {showRotated && (
          <rect
            x="580"
            y="65"
            width="78"
            height="130"
            fill="#c8e7d8"
            stroke="#43876b"
            strokeWidth="3"
          />
        )}
        <text x="360" y="330" textAnchor="middle" fontSize="20">
          12块：5×3厘米{showRotated ? '；另1块：3×5厘米' : ''}
        </text>
      </g>
    );
  }
  if (stage.kind === 'fence') {
    const [length, width] = stage.values!,
      phase = Number(stage.headings[1]);
    return (
      <g>
        <path d="M130 75H590" stroke="#8c775c" strokeWidth="12" />
        <text x="360" y="48" textAnchor="middle" fontSize="20">
          靠墙的一边不围
        </text>
        <path
          d="M130 80V255H590V80"
          stroke="#3563e9"
          strokeWidth="5"
          fill={phase === 2 ? '#e5f2e9' : 'none'}
        />
        <text x="360" y="285" textAnchor="middle" fontSize="22">
          {length}米
        </text>
        <text x="610" y="175" fontSize="21">
          {phase === 0 ? '？' : `${width}米`}
        </text>
        <text x="360" y="325" textAnchor="middle" fontSize="21">
          {phase === 2
            ? `面积：${length}×${width}＝${length * width}平方米`
            : '篱笆：一条长边＋两条宽'}
        </text>
      </g>
    );
  }
  if (stage.kind === 'grid') {
    const cells = (stage.values ?? []).flatMap((v, i, a) =>
      i % 2 === 0 ? [[v, a[i + 1]] as [number, number]] : [],
    );
    const width = (Math.max(...cells.map((c) => c[0])) + 1) * 36,
      height = (Math.max(...cells.map((c) => c[1])) + 1) * 36;
    return (
      <g>
        <text x="360" y="32" textAnchor="middle" fontSize="20">
          {stage.headings[0]}
        </text>
        <g
          transform={`translate(${(720 - width * Math.min(2, 600 / width, 240 / height)) / 2},${65 + (240 - height * Math.min(2, 600 / width, 240 / height)) / 2}) scale(${Math.min(2, 600 / width, 240 / height)})`}
        >
          <CellDrawing cells={cells} boundary={stage.headings[1] === 'boundary'} />
        </g>
      </g>
    );
  }
  if (stage.kind === 'table') {
    const width = 660 / stage.headings.length;
    const height = Math.min(40, 305 / (stage.rows.length + 1));
    return (
      <g>
        <rect x="30" y="15" width="660" height={height} fill="#edf2ff" />
        {stage.headings.map((h, i) => (
          <text
            key={i}
            x={30 + (i + 0.5) * width}
            y={15 + height * 0.67}
            fontSize="18"
            textAnchor="middle"
            fill={blue}
          >
            {h}
          </text>
        ))}
        {stage.rows.map((row, i) => (
          <g key={i}>
            <rect
              x="30"
              y={15 + (i + 1) * height}
              width="660"
              height={height}
              fill={stage.highlights?.includes(i) ? '#e5f2e9' : i % 2 ? '#f5f7fb' : '#fff'}
            />
            {row.map((cell, j) => (
              <text
                key={j}
                x={30 + (j + 0.5) * width}
                y={15 + (i + 1.67) * height}
                fontSize="18"
                textAnchor="middle"
              >
                {cell}
              </text>
            ))}
          </g>
        ))}
      </g>
    );
  }
  if (stage.kind === 'bars') {
    const values = stage.values!,
      max = Math.max(...values, 1);
    return (
      <g>
        {values.map((v, i) => (
          <g key={i}>
            <text x="35" y={32 + i * 72} fontSize="18">
              {stage.headings[i]}
            </text>
            <rect
              x="35"
              y={42 + i * 72}
              width={(v / max) * 560}
              height="28"
              fill={i % 2 ? '#65a58c' : blue}
              rx="3"
            />
            <text x={48 + (v / max) * 560} y={63 + i * 72} fontSize="19" fill={blue}>
              {v}
            </text>
          </g>
        ))}
        {stage.rows.slice(0, 2).map((row, i) => (
          <text key={i} x="35" y={values.length * 72 + 30 + i * 30} fontSize="19">
            {row.join('：')}
          </text>
        ))}
      </g>
    );
  }
  if (stage.kind === 'digits') {
    const row = stage.rows[0];
    return (
      <g>
        {row.map((digit, i) => (
          <g key={i}>
            <text x={110 + i * 85 + 36} y="70" textAnchor="middle" fontSize="18">
              {stage.headings[i]}
            </text>
            <rect
              x={110 + i * 85}
              y="95"
              width="72"
              height="95"
              rx="6"
              fill={stage.highlights?.includes(i) ? '#fff1d8' : '#edf2ff'}
              stroke={stage.highlights?.includes(i) ? '#a97117' : '#bdccef'}
            />
            <text x={110 + i * 85 + 36} y="156" textAnchor="middle" fontSize="42" fill={blue}>
              {digit}
            </text>
            {stage.highlights?.includes(i) && (
              <path d={`M${120 + i * 85} 205h52`} stroke="#a97117" strokeWidth="4" />
            )}
          </g>
        ))}
        <text x="365" y="270" textAnchor="middle" fontSize="24">
          {row.slice(0, 2).join('')} 万级 ｜ {row.slice(2).join('')} 个级
        </text>
      </g>
    );
  }
  if (stage.kind === 'join') {
    const [a, b, phase] = stage.values!,
      scale = 25,
      x1 = phase ? 150 : 95,
      x2 = phase ? x1 + a * scale : 420;
    return (
      <g>
        <text x="360" y="45" textAnchor="middle" fontSize="21">
          {stage.headings[0]}
        </text>
        {[x1, x2].map((x, i) => (
          <g key={i}>
            <rect
              x={x}
              y="105"
              width={a * scale}
              height={b * scale}
              fill={i ? '#e5f2e9' : '#edf2ff'}
              stroke={blue}
              strokeWidth="3"
            />
            <text x={x + (a * scale) / 2} y="90" textAnchor="middle" fontSize="20">
              8厘米
            </text>
          </g>
        ))}
        {phase > 0 && (
          <line
            x1={x2}
            x2={x2}
            y1="105"
            y2={105 + b * scale}
            stroke="#bc4e3c"
            strokeWidth="5"
            strokeDasharray="8 5"
          />
        )}
        {phase === 2 && (
          <rect
            x={x1}
            y="105"
            width={a * scale * 2}
            height={b * scale}
            fill="none"
            stroke={blue}
            strokeWidth="5"
          />
        )}
        <text x="40" y="176" fontSize="20">
          5厘米
        </text>
        <text x="360" y="292" fontSize="23" textAnchor="middle">
          {phase === 0
            ? '26 + 26 = 52厘米'
            : phase === 1
              ? '两条公共边：5 × 2 = 10厘米'
              : '(16 + 5) × 2 = 42厘米'}
        </text>
      </g>
    );
  }
  return (
    <g>
      {stage.rows.map((row, i) => (
        <g key={i}>
          <rect
            x="40"
            y={20 + i * 105}
            width="640"
            height="90"
            rx="7"
            fill={i === stage.rows.length - 1 ? '#e5f2e9' : '#edf2ff'}
            stroke="#cad6ee"
          />
          <text x="60" y={45 + i * 105} fontSize="17" fill="#53647f">
            {row[0]}
          </text>
          <text x="60" y={72 + i * 105} fontSize="20" fill={blue}>
            {(row[1].match(/.{1,28}/gu) ?? []).map((line, j) => (
              <tspan x="60" dy={j === 0 ? 0 : 24} key={j}>
                {line}
              </tspan>
            ))}
          </text>
          {i < stage.rows.length - 1 && (
            <path
              d={`M360 ${112 + i * 105}v10m-5-5 5 5 5-5`}
              fill="none"
              stroke={blue}
              strokeWidth="2"
            />
          )}
        </g>
      ))}
    </g>
  );
}
