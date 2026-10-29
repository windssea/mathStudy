import { Button } from './ui/button';
import StepControls from './StepControls';
import { useEffect, useState } from 'react';
import type { GeometryDemo } from '@mathstudy/contracts';
import { areaPairs, perimeterPairs, rectangleMetrics, tilingMetrics } from '@mathstudy/math-core';
import { areaSteps, perimeterSteps, type GeometryStep } from '@mathstudy/animation-engine';
import { Icon } from './ui';

const unitNames = { cm: '厘米', dm: '分米', m: '米' };
const colors = ['#3563e9', '#c38b2c', '#4c9679', '#9a78bb'];
export default function GeometryLessonPlayer({
  demo,
  onExplored,
}: {
  demo: GeometryDemo;
  onExplored: (done: boolean) => void;
}) {
  const [a, setA] = useState(demo.columns),
    [b, setB] = useState(demo.rows);
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const [staticMode, setStaticMode] = useState(false),
    [shape, setShape] = useState<'rectangle' | 'triangle'>('rectangle');
  const [measured, setMeasured] = useState<number[]>([]),
    [activeEdge, setActiveEdge] = useState(0);
  const [tileCount, setTileCount] = useState(0),
    [tileSide, setTileSide] = useState(1);
  const [largeUnit, setLargeUnit] = useState<'dm' | 'm'>('dm'),
    [quantity, setQuantity] = useState(1);
  const [estimateA, setEstimateA] = useState(Math.min(12, demo.columns + 1)),
    [estimateB, setEstimateB] = useState(Math.max(1, demo.rows - 1));
  const [comparison, setComparison] = useState<'perimeter' | 'area'>('perimeter'),
    [pairIndex, setPairIndex] = useState(0);
  const unit = unitNames[demo.unit];
  const metrics = rectangleMetrics(a, b);
  const edges = shape === 'triangle' ? [4, 5, 3] : metrics.edges;
  const tiles = tilingMetrics(a, b, demo.kind === 'areaUnits' ? tileSide : 1);
  const pairs = comparison === 'perimeter' ? perimeterPairs(24) : areaPairs(36);
  const pair = pairs[Math.min(pairIndex, pairs.length - 1)];
  let frames: GeometryStep[];
  switch (demo.kind) {
    case 'boundary':
      frames = [
        {
          title: '同一图形的两种观察',
          text: '想一想：给画框做边框，与给画面涂色，分别关注图形的什么？',
        },
        {
          title: '沿边线描一周',
          text: `从起点出发，沿长方形四条边走回起点。周长计量的是一周边线的长度，用${unit}等长度单位。`,
        },
        {
          title: '把边线围成的面涂满',
          text: `填满图形内部，表示的是面的大小。面积用平方${unit}等面积单位计量。`,
        },
        {
          title: '把两种量分清楚',
          text: `这个长方形的周长是${metrics.perimeter}${unit}，面积是${metrics.area}平方${unit}。两个量含义不同，单位也不同。`,
        },
      ];
      break;
    case 'perimeterMeasure':
      frames = perimeterSteps(edges, unit);
      break;
    case 'perimeterFormula':
      frames = [
        {
          title: '先看四条边',
          text: `两条长各${a}${unit}，两条宽各${b}${unit}。每条边都要算进去。`,
        },
        { title: '把相对的边配成两组', text: `${a}＋${b}＋${a}＋${b}，就是两组“长＋宽”。` },
        {
          title: '归纳长方形的周长',
          text: `C＝（长＋宽）×2＝（${a}＋${b}）×2＝${metrics.perimeter}（${unit}）。`,
        },
        {
          title: a === b ? '正方形的特别之处' : '试着把长与宽调成一样',
          text:
            a === b
              ? `四条边都是${a}${unit}，所以也可以算${a}×4＝${metrics.perimeter}（${unit}）。`
              : '长方形的长宽相等时就是正方形，周长可以用边长×4计算。',
        },
      ];
      break;
    case 'areaUnits':
      frames = [
        {
          title: '同一个面，选不同的方格',
          text: `卡片长${a}厘米、宽${b}厘米，卡片的大小保持不变。我们只改变测量它的方格大小。`,
        },
        { title: '先用1平方厘米的方格', text: `每排${a}个、${b}排，一共${a * b}个小方格。` },
        {
          title: '再用较大的方格',
          text: `每个边长2厘米的方格相当于4个小方格。现在每排${a / 2}个、${b / 2}排，只需${(a * b) / 4}个大方格。`,
        },
        {
          title: '面积比较，要先统一单位',
          text: `${(a * b) / 4}个大方格和${a * b}个小方格铺的是同一个面。方格个数变了，面积仍是${a * b}平方厘米。`,
        },
      ];
      break;
    case 'areaTiling':
      frames = areaSteps(a, b, unit);
      break;
    case 'areaConversion': {
      const big = unitNames[largeUnit],
        small = largeUnit === 'dm' ? '厘米' : '分米';
      frames = [
        { title: '先看边长单位', text: `1${big}＝10${small}，大正方形的每条边都能分成10份。` },
        { title: '沿一条边铺10格', text: `沿着长摆一排，可以摆10个边长1${small}的正方形。` },
        {
          title: '另一方向也有10排',
          text: `一排10格，一共10排：10×10＝100。1平方${big}＝100平方${small}。`,
        },
        {
          title: '换算时用进率100',
          text: `${quantity}平方${big}＝${quantity}×100＝${quantity * 100}平方${small}。不是乘10，因为两个方向都分成了10份。`,
        },
      ];
      break;
    }
    case 'areaEstimate':
      frames = [
        {
          title: '先作一个有依据的估测',
          text: '把自己的步长、熟悉的物体作为参照，先估长和宽。这里用教室的示例数据体验估测过程。',
        },
        {
          title: '用估测长宽计算',
          text: `估测长${estimateA}米、宽${estimateB}米，估测面积约${estimateA * estimateB}平方米。这里的数值带有“大约”的意思。`,
        },
        {
          title: '再看示例测量结果',
          text: `示例测量长${a}米、宽${b}米，面积${a * b}平方米。与你的估测面积相差${Math.abs(a * b - estimateA * estimateB)}平方米。`,
        },
        {
          title: '用单位方格复核',
          text: `地面相当于每排${a}个、共${b}排的1平方米方格，一共${a * b}格。实际测量应使用米尺或卷尺，不能拿真实尺量屏幕。`,
        },
      ];
      break;
    case 'perimeterAreaCompare':
      frames = [
        {
          title: comparison === 'perimeter' ? '保持周长24厘米' : '保持面积36平方厘米',
          text:
            comparison === 'perimeter'
              ? '长与宽的和保持12，边长取整厘米，依次列出所有不同的组合。'
              : '长与宽的乘积保持36，依次列出36的整数乘数组合。',
        },
        {
          title: '换一种拼法，记录结果',
          text: `当前长${pair.length}厘米、宽${pair.width}厘米，周长${pair.perimeter}厘米，面积${pair.area}平方厘米。点选表格里的其他组合比较。`,
        },
        {
          title: comparison === 'perimeter' ? '找到最大的面积' : '找到最短的周长',
          text:
            comparison === 'perimeter'
              ? '比较完整的6组组合，6×6的面积36平方厘米最大。'
              : '比较完整的5组组合，6×6的周长24厘米最短。',
        },
        {
          title: '说清你的发现与条件',
          text: '在这里比较的整数边长长方形或正方形中，长和宽越接近，固定周长时面积越大；固定面积时周长越短。周长相同不代表面积相同。',
        },
      ];
      break;
  }
  function applyStep(target: number) {
    const value = Math.max(0, Math.min(frames.length - 1, target));
    setStep(value);
    if (demo.kind === 'perimeterMeasure')
      setMeasured(value >= 2 ? edges.map((_, i) => i) : value === 0 ? [] : measured);
    if (demo.kind === 'areaTiling') setTileCount(value === 0 ? 0 : value === 1 ? a : a * b);
    if (demo.kind === 'areaUnits') {
      setTileSide(value >= 2 ? 2 : 1);
      setTileCount(value === 0 ? 0 : value === 1 ? a * b : (a * b) / 4);
    }
    if (demo.kind === 'perimeterAreaCompare')
      setPairIndex(value === 0 ? 0 : value === 1 ? Math.floor(pairs.length / 2) : pairs.length - 1);
  }
  function resetStage() {
    setStep(0);
    setPlaying(false);
    setStaticMode(false);
    setMeasured([]);
    setTileCount(0);
    setActiveEdge(0);
  }
  function resetAll() {
    setA(demo.columns);
    setB(demo.rows);
    setShape('rectangle');
    setTileSide(1);
    setLargeUnit('dm');
    setQuantity(1);
    setComparison('perimeter');
    setPairIndex(0);
    setEstimateA(Math.min(12, demo.columns + 1));
    setEstimateB(Math.max(1, demo.rows - 1));
    resetStage();
  }
  useEffect(() => {
    onExplored(step === frames.length - 1 || staticMode);
  }, [step, frames.length, staticMode, onExplored]);
  useEffect(() => {
    if (!playing) return;
    if (step === frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => applyStep(step + 1), 2600 / speed);
    return () => clearTimeout(timer);
  });
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  const isTiling = demo.kind === 'areaTiling' || demo.kind === 'areaUnits';
  return (
    <section className="demo-player geometry-player" aria-label="周长与面积交互演示">
      <div className="demo-topbar">
        <span>
          <span className="live-dot" />
          几何演示
        </span>
        <button
          className="text-link"
          onClick={() => {
            setStaticMode(!staticMode);
            setPlaying(false);
          }}
        >
          {staticMode ? '返回动态演示' : '查看静态步骤'}
          <Icon name={staticMode ? 'Play' : 'List'} size={15} />
        </button>
      </div>
      <div className="geometry-parameters">
        {['boundary', 'perimeterFormula', 'areaTiling'].includes(demo.kind) && (
          <>
            <RangeControl
              label="长"
              value={a}
              max={12}
              suffix={unit}
              onChange={(v) => {
                setA(v);
                resetStage();
              }}
            />
            <RangeControl
              label="宽"
              value={b}
              max={10}
              suffix={unit}
              onChange={(v) => {
                setB(v);
                resetStage();
              }}
            />
          </>
        )}
        {demo.kind === 'perimeterMeasure' && (
          <label className="geometry-select">
            选择测量图形
            <select
              aria-label="选择测量图形"
              value={shape}
              onChange={(e) => {
                setShape(e.target.value as typeof shape);
                resetStage();
              }}
            >
              <option value="rectangle">长方形：6厘米 × 4厘米</option>
              <option value="triangle">三角形：3、4、5厘米</option>
            </select>
          </label>
        )}
        {demo.kind === 'areaUnits' && (
          <div className="geometry-toggle" role="group" aria-label="选择单位方格">
            {[1, 2].map((s) => (
              <button
                key={s}
                aria-pressed={tileSide === s}
                className={tileSide === s ? 'active' : ''}
                onClick={() => {
                  setTileSide(s);
                  resetStage();
                  setStep(s === 1 ? 1 : 2);
                }}
              >
                边长 {s} 厘米的方格
              </button>
            ))}
          </div>
        )}
        {demo.kind === 'areaConversion' && (
          <>
            <label className="geometry-select">
              换算模型
              <select
                aria-label="选择面积单位换算"
                value={largeUnit}
                onChange={(e) => {
                  setLargeUnit(e.target.value as typeof largeUnit);
                  resetStage();
                }}
              >
                <option value="dm">平方分米 → 平方厘米</option>
                <option value="m">平方米 → 平方分米</option>
              </select>
            </label>
            <RangeControl
              label="大单位数量"
              value={quantity}
              max={9}
              suffix={`平方${unitNames[largeUnit]}`}
              onChange={(v) => {
                setQuantity(v);
                resetStage();
              }}
            />
          </>
        )}
        {demo.kind === 'areaEstimate' && (
          <>
            <RangeControl
              label="估测长"
              value={estimateA}
              max={12}
              suffix="米"
              onChange={(v) => {
                setEstimateA(v);
                resetStage();
              }}
            />
            <RangeControl
              label="估测宽"
              value={estimateB}
              max={10}
              suffix="米"
              onChange={(v) => {
                setEstimateB(v);
                resetStage();
              }}
            />
          </>
        )}
        {demo.kind === 'perimeterAreaCompare' && (
          <div className="geometry-toggle" role="group" aria-label="比较条件">
            <button
              aria-pressed={comparison === 'perimeter'}
              className={comparison === 'perimeter' ? 'active' : ''}
              onClick={() => {
                setComparison('perimeter');
                setPairIndex(0);
                resetStage();
              }}
            >
              固定周长 24 厘米
            </button>
            <button
              aria-pressed={comparison === 'area'}
              className={comparison === 'area' ? 'active' : ''}
              onClick={() => {
                setComparison('area');
                setPairIndex(0);
                resetStage();
              }}
            >
              固定面积 36 平方厘米
            </button>
          </div>
        )}
      </div>
      {staticMode ? (
        <ol className="static-steps">
          {frames.map((f, i) => (
            <li key={i}>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <div className="geometry-stage">
            {demo.kind === 'perimeterMeasure' ? (
              <MeasurementCanvas
                edges={edges}
                shape={shape}
                a={a}
                b={b}
                step={step}
                measured={measured}
                active={activeEdge}
              />
            ) : demo.kind === 'perimeterAreaCompare' ? (
              <>
                <div className="geometry-kpi">
                  <span>
                    周长 <b>{pair.perimeter}</b> 厘米
                  </span>
                  <span>
                    面积 <b>{pair.area}</b> 平方厘米
                  </span>
                </div>
                <RectangleCanvas
                  a={pair.length}
                  b={pair.width}
                  unit="厘米"
                  filled={pair.area}
                  tileSide={1}
                  border={true}
                  formula={`${pair.length} × ${pair.width} = ${pair.area}`}
                />
              </>
            ) : demo.kind === 'areaConversion' ? (
              <>
                <div className="geometry-kpi">
                  <span>
                    {quantity} 平方{unitNames[largeUnit]}
                  </span>
                  <span>
                    = <b>{step >= 3 ? quantity * 100 : '?'}</b> 平方
                    {largeUnit === 'dm' ? '厘米' : '分米'}
                  </span>
                </div>
                <RectangleCanvas
                  a={10}
                  b={10}
                  unit={largeUnit === 'dm' ? '厘米' : '分米'}
                  filled={step === 0 ? 0 : step === 1 ? 10 : 100}
                  tileSide={1}
                  border={true}
                  formula={
                    step >= 2
                      ? '10 × 10 = 100'
                      : step === 1
                        ? '每排 10 个小正方形'
                        : '1 个较大的面积单位'
                  }
                />
              </>
            ) : (
              <>
                <div className="geometry-kpi">
                  {isTiling ? (
                    <>
                      <span>
                        已铺 <b>{tileCount}</b> 格
                      </span>
                      <span>
                        每格 {tiles.tileArea} 平方{unit}
                      </span>
                    </>
                  ) : demo.kind === 'areaEstimate' ? (
                    <>
                      <span>
                        估测面积约 <b>{estimateA * estimateB}</b> 平方米
                      </span>
                      {step >= 2 && (
                        <span>
                          示例测量 <b>{a * b}</b> 平方米
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>
                        周长{' '}
                        <b>
                          {step >= 3 || (demo.kind === 'perimeterFormula' && step >= 2)
                            ? metrics.perimeter
                            : '?'}
                        </b>{' '}
                        {unit}
                      </span>
                      <span>
                        面积 <b>{demo.kind === 'boundary' && step >= 3 ? metrics.area : '?'}</b>{' '}
                        平方{unit}
                      </span>
                    </>
                  )}
                </div>
                <RectangleCanvas
                  a={a}
                  b={b}
                  unit={unit}
                  filled={
                    isTiling
                      ? tileCount
                      : (demo.kind === 'boundary' && step >= 2) ||
                          (demo.kind === 'areaEstimate' && step >= 3)
                        ? a * b
                        : 0
                  }
                  tileSide={demo.kind === 'areaUnits' ? tileSide : 1}
                  border={demo.kind === 'boundary' ? step === 1 || step === 3 : true}
                  labelDimensions={demo.kind !== 'areaEstimate' || step >= 2}
                  formula={
                    demo.kind === 'areaTiling' && step >= 3
                      ? `S = ${a} × ${b} = ${a * b} 平方${unit}`
                      : demo.kind === 'perimeterFormula' && step >= 2
                        ? `C =（${a} + ${b}）× 2 = ${metrics.perimeter} ${unit}`
                        : ''
                  }
                />
              </>
            )}
            {demo.kind === 'boundary' && (
              <div className="geometry-toggle stage-actions">
                <button
                  className={step === 1 ? 'active' : ''}
                  onClick={() => {
                    setPlaying(false);
                    applyStep(1);
                  }}
                >
                  描一周边线
                </button>
                <button
                  className={step === 2 ? 'active' : ''}
                  onClick={() => {
                    setPlaying(false);
                    applyStep(2);
                  }}
                >
                  涂满内部
                </button>
              </div>
            )}
            {demo.kind === 'perimeterMeasure' && (
              <div className="measure-buttons" role="group" aria-label="逐边测量">
                {edges.map((edge, i) => (
                  <button
                    key={i}
                    className={measured.includes(i) ? 'measured' : ''}
                    onClick={() => {
                      setPlaying(false);
                      setStep(1);
                      setActiveEdge(i);
                      setMeasured((list) => (list.includes(i) ? list : [...list, i]));
                    }}
                  >
                    <span style={{ background: colors[i] }} />
                    测量第{i + 1}条边 <b>{measured.includes(i) ? `${edge}厘米` : '？'}</b>
                  </button>
                ))}
              </div>
            )}
            {isTiling && (
              <div className="tile-actions">
                <Button
                  variant="outline"
                  className="button secondary"
                  disabled={tileCount >= tiles.count}
                  onClick={() => {
                    setPlaying(false);
                    setStep(demo.kind === 'areaUnits' && tileSide === 2 ? 2 : 1);
                    setTileCount((n) => Math.min(tiles.count, n + 1));
                  }}
                >
                  铺一格
                </Button>
                <Button
                  variant="outline"
                  className="button secondary"
                  disabled={tileCount >= tiles.count}
                  onClick={() => {
                    setPlaying(false);
                    setStep(demo.kind === 'areaUnits' && tileSide === 2 ? 2 : 1);
                    setTileCount((n) =>
                      Math.min(tiles.count, (Math.floor(n / tiles.columns) + 1) * tiles.columns),
                    );
                  }}
                >
                  铺一排
                </Button>
                <Button
                  variant="outline"
                  className="button secondary"
                  onClick={() => {
                    setPlaying(false);
                    setStep(demo.kind === 'areaUnits' && tileSide === 1 ? 1 : 2);
                    setTileCount(tiles.count);
                  }}
                >
                  铺满方格
                </Button>
                <Button
                  variant="ghost"
                  className="button subtle"
                  onClick={() => {
                    setPlaying(false);
                    setTileCount(0);
                    setStep(demo.kind === 'areaUnits' ? (tileSide === 1 ? 1 : 2) : 0);
                  }}
                >
                  清空方格
                </Button>
              </div>
            )}
            {demo.kind === 'perimeterAreaCompare' && (
              <div className="comparison-table">
                <table>
                  <caption>整厘米边长的所有不同组合，点选一行观察</caption>
                  <thead>
                    <tr>
                      <th>长 / 厘米</th>
                      <th>宽 / 厘米</th>
                      <th>周长 / 厘米</th>
                      <th>面积 / 平方厘米</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairs.map((p, i) => (
                      <tr key={i} className={pairIndex === i ? 'selected' : ''}>
                        <td>
                          <button
                            aria-label={`观察长${p.length}厘米宽${p.width}厘米的图形`}
                            aria-pressed={pairIndex === i}
                            onClick={() => {
                              setPairIndex(i);
                              setStep(1);
                              setPlaying(false);
                            }}
                          >
                            {p.length}
                          </button>
                        </td>
                        <td>{p.width}</td>
                        <td>{p.perimeter}</td>
                        <td>{p.area}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="geometry-scale-note">示意图，非实际尺寸。</p>
          </div>
          <div className="narration" aria-live="polite">
            <span className="narration-step">{step + 1}</span>
            <div>
              <strong>{frames[step].title}</strong>
              <p>{frames[step].text}</p>
            </div>
          </div>
          <StepControls
            step={step}
            last={frames.length - 1}
            onStep={(next) => {
              setPlaying(false);
              applyStep(next);
            }}
            playing={playing}
            onPlay={() => {
              if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
                setStaticMode(true);
                return;
              }
              if (step === frames.length - 1) applyStep(0);
              setPlaying(!playing);
            }}
            speed={speed}
            onSpeed={setSpeed}
            onReset={resetAll}
          />
        </>
      )}
    </section>
  );
}

function RangeControl({
  label,
  value,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="geometry-range">
      <span>
        {label} <b>{value}</b> {suffix}
      </span>
      <input
        aria-label={label}
        type="range"
        min={1}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function RectangleCanvas({
  a,
  b,
  unit,
  filled = 0,
  tileSide = 1,
  border = false,
  formula = '',
  labelDimensions = true,
}: {
  a: number;
  b: number;
  unit: string;
  filled?: number;
  tileSide?: number;
  border?: boolean;
  formula?: string;
  labelDimensions?: boolean;
}) {
  const cell = Math.min(40, 500 / a, 195 / b),
    w = a * cell,
    h = b * cell,
    x = (640 - w) / 2,
    y = 42 + (195 - h) / 2;
  const tile = cell * tileSide,
    columns = a / tileSide,
    rows = b / tileSide;
  const viewWidth = Math.min(640, Math.max(w + 90, formula ? 600 : filled ? 420 : 240));
  return (
    <svg
      className="geometry-svg rectangle-canvas"
      viewBox={`${(640 - viewWidth) / 2} 0 ${viewWidth} ${formula ? 330 : filled ? 290 : 250}`}
      role="img"
      aria-label={`${labelDimensions ? `长${a}${unit}、宽${b}${unit}` : '教室形状示意'}，已铺${filled}格${formula ? `，${formula}` : ''}`}
    >
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#aabbd8" strokeWidth={2} />
      {Array.from({ length: columns * rows }, (_, i) => (
        <rect
          className="unit-tile"
          key={i}
          x={x + (i % columns) * tile}
          y={y + Math.floor(i / columns) * tile}
          width={tile}
          height={tile}
          fill={i < filled ? (Math.floor(i / columns) % 2 ? '#a8d4c6' : '#c8e3d9') : 'transparent'}
          stroke={filled > 0 ? '#9eb9bc' : 'transparent'}
          strokeWidth={1}
        />
      ))}
      {border && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="none"
          stroke="#3563e9"
          strokeWidth={4}
          className="highlight-boundary"
        />
      )}
      {labelDimensions && (
        <>
          <text x="320" y={y - 14} textAnchor="middle" className="dimension-label">
            {a} {unit}
          </text>
          <text
            x={x - 17}
            y={y + h / 2}
            textAnchor="middle"
            className="dimension-label"
            transform={`rotate(-90 ${x - 17} ${y + h / 2})`}
          >
            {b} {unit}
          </text>
        </>
      )}
      {filled > 0 && (
        <>
          <rect x="228" y="264" width="18" height="18" fill="#c8e3d9" stroke="#91b2a8" />
          <text x="254" y="278" fontSize="14">
            1格＝{tileSide * tileSide}平方{unit}
          </text>
        </>
      )}
      {formula && (
        <text x="320" y="312" textAnchor="middle" className="geometry-formula">
          {formula}
        </text>
      )}
    </svg>
  );
}
function MeasurementCanvas({
  edges,
  shape,
  a,
  b,
  step,
  measured,
  active,
}: {
  edges: number[];
  shape: 'rectangle' | 'triangle';
  a: number;
  b: number;
  step: number;
  measured: number[];
  active: number;
}) {
  const perimeter = edges.reduce((s, n) => s + n, 0),
    scale = Math.min(28, 520 / perimeter);
  const vertices =
    shape === 'triangle'
      ? [
          [130, 70],
          [130 + 4 * scale, 70],
          [130, 70 + 3 * scale],
        ]
      : [
          [130, 60],
          [130 + a * scale, 60],
          [130 + a * scale, 60 + b * scale],
          [130, 60 + b * scale],
        ];
  let cumulative = 0;
  return (
    <svg
      className="geometry-svg measurement-canvas"
      viewBox="0 0 640 350"
      role="img"
      aria-label={`${shape === 'triangle' ? '三角形' : '长方形'}逐边测量${step >= 2 ? `，展开后周长${perimeter}厘米` : ''}`}
    >
      <polygon
        points={vertices.map((p) => p.join(',')).join(' ')}
        fill="#f0f5ff"
        stroke="#c1d0e7"
      />
      {edges.map((edge, i) => {
        const start = vertices[i],
          end = vertices[(i + 1) % vertices.length];
        const offset = cumulative;
        cumulative += edge;
        return (
          <g key={i}>
            <line
              x1={start[0]}
              y1={start[1]}
              x2={end[0]}
              y2={end[1]}
              stroke={measured.includes(i) ? colors[i] : '#aabbd8'}
              strokeWidth={active === i && step === 1 ? 6 : 3}
            />
            <text
              x={(start[0] + end[0]) / 2 + (i === edges.length - 1 ? -25 : 0)}
              y={(start[1] + end[1]) / 2 + (i === 0 ? -12 : 18)}
              fill={colors[i]}
              textAnchor="middle"
              fontSize="15"
            >
              {measured.includes(i) ? `${edge}厘米` : `边${i + 1}`}
            </text>
            {step >= 2 && (
              <>
                <line
                  x1={60 + offset * scale}
                  y1="267"
                  x2={60 + (offset + edge) * scale}
                  y2="267"
                  stroke={colors[i]}
                  strokeWidth="8"
                />
                <line
                  x1={60 + offset * scale}
                  y1="255"
                  x2={60 + offset * scale}
                  y2="280"
                  stroke={colors[i]}
                />
                <text
                  x={60 + (offset + edge / 2) * scale}
                  y="246"
                  textAnchor="middle"
                  fill={colors[i]}
                  fontSize="15"
                >
                  {edge}
                </text>
              </>
            )}
          </g>
        );
      })}
      <text x="480" y="100" textAnchor="middle" className="dimension-label">
        {step < 2 ? '先逐边量一量' : '每一段与原边等长'}
      </text>
      <text x="480" y="129" textAnchor="middle" fontSize="12" fill="#63718a">
        {measured.length} / {edges.length} 条边已记录
      </text>
      {step === 1 && (
        <g>
          <rect
            x="60"
            y="249"
            width={edges[active] * scale}
            height="35"
            fill="#fff0cc"
            stroke="#d2b778"
          />
          {Array.from({ length: edges[active] + 1 }, (_, i) => (
            <g key={i}>
              <line x1={60 + i * scale} x2={60 + i * scale} y1="249" y2="260" stroke="#806940" />
              <text x={60 + i * scale} y="278" fontSize="12" textAnchor="middle">
                {i}
              </text>
            </g>
          ))}
          <line
            x1="60"
            x2={60 + edges[active] * scale}
            y1="240"
            y2="240"
            stroke={colors[active]}
            strokeWidth="4"
          />
          <text x="320" y="318" fontSize="15" textAnchor="middle">
            第{active + 1}条边：起点对准0刻度，终点读{edges[active]}厘米
          </text>
        </g>
      )}
      {step >= 2 && (
        <>
          <line
            x1={60 + perimeter * scale}
            y1="255"
            x2={60 + perimeter * scale}
            y2="280"
            stroke="#63718a"
          />
          <text x="320" y="318" textAnchor="middle" className="geometry-formula">
            {edges.join('＋')}＝{perimeter} 厘米
          </text>
        </>
      )}
    </svg>
  );
}
