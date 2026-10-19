import { useEffect, useMemo, useState } from 'react';
import type { DivisionDemo } from '@mathstudy/contracts';
import { divide, trialQuotient } from '@mathstudy/math-core';
import { divisionFrames, groupFrames, type Frame } from '@mathstudy/animation-engine';
import { Icon } from './ui';

export default function DemoPlayer({
  demo,
  onExplored,
}: {
  demo: DivisionDemo;
  onExplored: (done: boolean) => void;
}) {
  const [example, setExample] = useState(`${demo.dividend},${demo.divisor}`);
  const [n, d] = example.split(',').map(Number);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [trial, setTrial] = useState(5);
  const [staticMode, setStaticMode] = useState(false);
  const result = divide(n, d);
  const tried = trialQuotient(n, d, trial);
  const division = useMemo(() => divisionFrames(n, d), [n, d]);
  const frames: Frame[] =
    demo.kind === 'groups'
      ? groupFrames(n, d)
      : demo.kind === 'trial'
        ? [
            {
              id: 'intro',
              title: '先用整十数估一估',
              text: `把 ${d} 看作 ${Math.round(d / 10) * 10} 来试商。选择一个商，观察“乘回”和“余数”的变化。`,
              phase: 'intro',
              columnIndex: 0,
            },
            {
              id: 'multiply',
              title: '用除数乘试商',
              text: `你试商 ${trial}：${d} × ${trial} = ${tried.product}。与被除数 ${n} 比一比。`,
              phase: 'multiply',
              columnIndex: 0,
            },
            {
              id: 'compare',
              title: '检查余数，决定怎样调整',
              text:
                tried.verdict === 'large'
                  ? `积 ${tried.product} 超过 ${n}，商偏大，应调小。`
                  : tried.verdict === 'small'
                    ? `余下 ${tried.remainder}，不小于除数 ${d}，还能继续分，商偏小，应调大。`
                    : `余下 ${tried.remainder}，小于除数 ${d}，商 ${trial} 正合适。`,
              phase: 'subtract',
              columnIndex: 0,
            },
            {
              id: 'check',
              title: '确定商和余数',
              text: `${n} ÷ ${d} = ${result.quotient}……${result.remainder}。验算：${d} × ${result.quotient} + ${result.remainder} = ${n}。`,
              phase: 'check',
              columnIndex: 0,
            },
          ]
        : demo.kind === 'chain'
          ? [
              {
                id: 'intro',
                title: '整理条件',
                text: '224 本书，2 个书架，每个书架 4 层。要求每层的本数。',
                phase: 'intro',
                columnIndex: 0,
              },
              {
                id: 'shelves',
                title: '先分到每个书架',
                text: '224 ÷ 2 = 112（本），每个书架放 112 本。',
                phase: 'groups',
                columnIndex: 0,
              },
              {
                id: 'layers',
                title: '再分到每一层',
                text: '112 ÷ 4 = 28（本），每层放 28 本。',
                phase: 'subtract',
                columnIndex: 0,
              },
              {
                id: 'check',
                title: '换一种思路检验',
                text: '2 × 4 = 8（层），224 ÷ 8 = 28（本）。两种方法的结果相同。',
                phase: 'check',
                columnIndex: 0,
              },
            ]
          : division.frames;
  const current = frames[Math.min(step, frames.length - 1)];
  useEffect(() => {
    onExplored(step === frames.length - 1 || staticMode);
  }, [step, frames.length, staticMode, onExplored]);
  useEffect(() => {
    if (!playing) return;
    if (step >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStep((s) => s + 1), 2200 / speed);
    return () => clearTimeout(timer);
  }, [playing, step, speed, frames.length]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  function changeExample(value: string) {
    setExample(value);
    setStep(0);
    setPlaying(false);
    setTrial(5);
    setStaticMode(false);
  }
  const presets =
    demo.kind === 'groups'
      ? [
          [160, 30],
          [60, 20],
          [280, 30],
        ]
      : demo.kind === 'trial'
        ? [
            [172, 28],
            [96, 24],
            [108, 22],
            [250, 36],
          ]
        : [
            [156, 12],
            [612, 30],
            [840, 40],
            [605, 21],
          ];
  return (
    <section className="demo-player" aria-label="数学交互演示">
      <div className="demo-topbar">
        <span>
          <span className="live-dot" />
          交互实验室
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
      {demo.kind !== 'chain' && (
        <div className="demo-options">
          <label>
            换一道例题
            <select
              aria-label="选择演示例题"
              value={example}
              onChange={(e) => changeExample(e.target.value)}
            >
              {[
                ...new Set([
                  `${demo.dividend},${demo.divisor}`,
                  ...presets.map((p) => p.join(',')),
                ]),
              ].map((p) => (
                <option key={p} value={p}>
                  {p.replace(',', ' ÷ ')}
                </option>
              ))}
            </select>
          </label>
          <span>换题后从第一步重新观察</span>
        </div>
      )}
      {staticMode ? (
        <ol className="static-steps">
          {frames.map((f) => (
            <li key={f.id}>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <div className={`math-stage stage-${demo.kind}`}>
            {demo.kind === 'groups' ? (
              <>
                <div className="stage-equation">
                  {n}
                  <span>÷</span>
                  {d}
                  <span>=</span>
                  {step >= 3 ? result.quotient : '?'}
                  {step >= 3 && result.remainder > 0 && <small>……{result.remainder}</small>}
                </div>
                <div className="groups-canvas">
                  {Array.from({ length: step === 0 ? 1 : result.quotient }, (_, i) => (
                    <div className={`book-group ${step === 0 ? 'total-group' : ''}`} key={i}>
                      <div className="book-stack">
                        {Array.from({ length: 5 }, (_, j) => (
                          <span key={j} />
                        ))}
                      </div>
                      <b>
                        {step === 0 ? n : d}
                        <small> 本</small>
                      </b>
                      <span>{step === 0 ? '待分的图书' : `第 ${i + 1} 组`}</span>
                    </div>
                  ))}
                  {step >= 2 && result.remainder > 0 && (
                    <div className="book-group remainder-group">
                      <Icon name="BookOpen" size={36} />
                      <b>
                        {result.remainder}
                        <small> 本</small>
                      </b>
                      <span>剩下的，不够一组</span>
                    </div>
                  )}
                </div>
              </>
            ) : demo.kind === 'trial' ? (
              <>
                <div className="stage-equation">
                  {n}
                  <span>÷</span>
                  {d}
                  <span>≈</span>
                  <b>{trial}</b>
                </div>
                <div className="trial-lab">
                  <div>
                    <span>乘回去</span>
                    <strong>
                      {d} × {trial} = {tried.product}
                    </strong>
                  </div>
                  <Icon name="ArrowRight" />
                  <div
                    className={
                      step >= 2
                        ? tried.verdict === 'correct'
                          ? 'correct'
                          : 'needs-adjustment'
                        : ''
                    }
                  >
                    <span>{tried.remainder < 0 ? '超过了' : '余下的'}</span>
                    <strong>
                      {Math.abs(tried.remainder)}
                      <small> 本</small>
                    </strong>
                  </div>
                </div>
                <div className="trial-meter">
                  <div className="trial-meter-track">
                    <span style={{ width: `${Math.min(100, (tried.product / n) * 100)}%` }} />
                  </div>
                  <span>
                    已尝试装入 {tried.product} 本 / 一共 {n} 本
                  </span>
                </div>
                <div className="trial-control">
                  <label htmlFor="trial-slider">
                    试商 <b>{trial}</b>
                  </label>
                  <input
                    id="trial-slider"
                    type="range"
                    min="1"
                    max="9"
                    value={trial}
                    onChange={(e) => {
                      setTrial(Number(e.target.value));
                      setPlaying(false);
                    }}
                  />
                  <div className="stepper">
                    <button
                      aria-label="把试商减小1"
                      onClick={() => setTrial((s) => Math.max(1, s - 1))}
                      disabled={trial === 1}
                    >
                      −
                    </button>
                    <button
                      aria-label="把试商增大1"
                      onClick={() => setTrial((s) => Math.min(9, s + 1))}
                      disabled={trial === 9}
                    >
                      +
                    </button>
                  </div>
                </div>
              </>
            ) : demo.kind === 'chain' ? (
              <>
                <div className="stage-equation">
                  224 <small>本图书</small>
                </div>
                <div className="shelf-model">
                  {[0, 1].map((s) => (
                    <div className="shelf" key={s}>
                      <span>
                        第 {s + 1} 个书架{step >= 1 ? ' · 112 本' : ''}
                      </span>
                      {[0, 1, 2, 3].map((r) => (
                        <div key={r} className={step >= 2 ? 'filled' : ''}>
                          <Icon name="BookOpen" size={20} />
                          <span>{step >= 2 ? '28 本' : '？'}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="stage-note">
                  {step >= 3
                    ? '224 ÷ 2 ÷ 4 = 224 ÷（2 × 4）= 28'
                    : '先分到 2 个书架，再分到每个书架的 4 层。'}
                </p>
              </>
            ) : (
              <LongDivisionView n={n} d={d} frame={current} columns={division.columns} />
            )}
          </div>
          <div className="narration" aria-live="polite">
            <span className="narration-step">{step + 1}</span>
            <div>
              <strong>{current.title}</strong>
              <p>{current.text}</p>
            </div>
          </div>
          <div className="playback">
            <button
              className="icon-button"
              aria-label="重新演示"
              onClick={() => {
                setStep(0);
                setPlaying(false);
              }}
            >
              <Icon name="RotateCcw" size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="上一步"
              disabled={step === 0}
              onClick={() => {
                setStep((s) => s - 1);
                setPlaying(false);
              }}
            >
              <Icon name="ArrowLeft" size={19} />
            </button>
            <button
              className="play-button"
              aria-label={playing ? '暂停演示' : '播放演示'}
              onClick={() => {
                if (step === frames.length - 1) setStep(0);
                setPlaying(!playing);
              }}
            >
              <Icon name={playing ? 'Pause' : 'Play'} size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="下一步"
              disabled={step === frames.length - 1}
              onClick={() => {
                setStep((s) => s + 1);
                setPlaying(false);
              }}
            >
              <Icon name="StepForward" size={19} />
            </button>
            <div className="playback-track">
              <label className="sr-only" htmlFor="demo-step">
                演示步骤
              </label>
              <input
                id="demo-step"
                type="range"
                min="0"
                max={frames.length - 1}
                value={step}
                onChange={(e) => {
                  setStep(Number(e.target.value));
                  setPlaying(false);
                }}
              />
              <span>
                {step + 1} / {frames.length} 步
              </span>
            </div>
            <label className="speed-select">
              <span className="sr-only">播放速度</span>
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={0.75}>0.75 倍速</option>
                <option value={1}>1 倍速</option>
                <option value={1.5}>1.5 倍速</option>
              </select>
            </label>
          </div>
        </>
      )}
    </section>
  );
}

function LongDivisionView({
  n,
  d,
  frame,
  columns,
}: {
  n: number;
  d: number;
  frame: Frame;
  columns: ReturnType<typeof divisionFrames>['columns'];
}) {
  const digits = String(n).split('');
  const phaseRank = {
    intro: 0,
    groups: 0,
    quotient: 1,
    multiply: 2,
    subtract: 3,
    bring: 4,
    check: 5,
  }[frame.phase];
  const x = (column: number) => 203 + column * 48;
  const digitText = (value: number, end: number, y: number, color: string) =>
    String(value)
      .split('')
      .map((s, i, a) => (
        <text key={`${y}-${i}`} x={x(end - a.length + 1 + i)} y={y} fill={color}>
          {s}
        </text>
      ));
  return (
    <svg
      className="division-svg"
      viewBox={`0 0 480 ${Math.max(330, 180 + columns.length * 95)}`}
      role="img"
      aria-label={`${n} 除以 ${d} 的竖式，当前步骤：${frame.title}`}
    >
      <text x="238" y="24" className="svg-overline" textAnchor="middle">
        数位对齐 · 商 → 乘 → 减 → 落
      </text>
      <path
        d={`M164 130 Q174 114 173 84 H${x(digits.length - 1) + 28}`}
        fill="none"
        stroke="#25314d"
        strokeWidth="2"
      />
      <text x="130" y="124" textAnchor="end">
        {d}
      </text>
      {digits.map((s, i) => (
        <text key={i} x={x(i)} y="124">
          {s}
        </text>
      ))}
      {columns.map((c, i) => {
        const active = i === frame.columnIndex;
        const previous = i < frame.columnIndex;
        const qVisible = previous || (active && phaseRank >= 1);
        const mVisible = previous || (active && phaseRank >= 2);
        const sVisible = previous || (active && phaseRank >= 3);
        const y = 163 + i * 95;
        return (
          <g key={i}>
            {qVisible && (
              <text x={x(c.column)} y="70" fill="#3563e9">
                {c.digit}
              </text>
            )}
            {mVisible && (
              <>
                {digitText(c.product, c.column, y, '#7483a1')}
                <line
                  x1={x(Math.max(0, c.column - String(c.product).length + 1)) - 18}
                  y1={y + 10}
                  x2={x(c.column) + 22}
                  y2={y + 10}
                  stroke="#9daac0"
                />
              </>
            )}
            {sVisible && (
              <>
                {digitText(c.remainder, c.column, y + 47, '#3563e9')}
                {c.broughtDigit !== undefined && (previous || phaseRank >= 4) && (
                  <>
                    <text x={x(c.column + 1)} y={y + 47} fill="#d08b1f">
                      {c.broughtDigit}
                    </text>
                    <path
                      d={`M${x(c.column + 1) + 10} ${i === 0 ? 136 : y - 30}v${i === 0 ? 42 : 50}`}
                      stroke="#d08b1f"
                      strokeDasharray="3 4"
                      fill="none"
                    />
                  </>
                )}
              </>
            )}
          </g>
        );
      })}
      <text
        x="240"
        y={Math.max(312, 163 + columns.length * 95)}
        textAnchor="middle"
        className="svg-note"
      >
        {frame.phase === 'check'
          ? `${d} × ${Math.floor(n / d)} + ${n % d} = ${n}   ✓`
          : frame.title}
      </text>
    </svg>
  );
}
