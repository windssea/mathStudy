import StepControls from './StepControls';
import LessonNarration from './LessonNarration';
import QuantityRelationGuide from './QuantityRelationGuide';
import { useEffect, useId, useState } from 'react';
import type { QuantityDemo } from '@mathstudy/contracts';
import {
  quantityRelation,
  purchaseChange,
  travelComparison,
  type UnknownQuantity,
} from '@mathstudy/math-core';
import { quantityFrames, type QuantityFrame } from '@mathstudy/animation-engine';
import { Icon } from './ui';

const classmates = travelComparison([
  { name: '小明', distance: 280, time: 4 },
  { name: '小红', distance: 240, time: 4 },
  { name: '小刚', distance: 240, time: 3 },
]);
const palette = ['var(--sky)', 'var(--sun)', 'var(--success)'];
export default function QuantityLessonPlayer({
  demo,
  onExplored,
}: {
  demo: QuantityDemo;
  onExplored: (done: boolean) => void;
}) {
  const [unitValue, setUnitValue] = useState(demo.unitValue),
    [count, setCount] = useState(demo.count);
  const [unknown, setUnknown] = useState<UnknownQuantity>('total');
  const [scenario, setScenario] = useState<'walk' | 'car' | 'compare'>('walk');
  const [problem, setProblem] = useState<'purchase' | 'return'>('purchase');
  const [selected, setSelected] = useState<number[]>([]);
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [staticMode, setStaticMode] = useState(false);
  const id = useId(),
    relation = quantityRelation(unitValue, count);
  const context =
    demo.kind === 'equalGroups' ? 'groups' : demo.kind === 'journey' ? 'journey' : 'shopping';
  const compare = demo.kind === 'journey' && scenario === 'compare',
    isProblem = demo.kind === 'quantityProblems';
  const names =
    context === 'groups'
      ? ['每组人数', '组数', '总人数']
      : context === 'shopping'
        ? ['单价', '数量', '总价']
        : ['速度', '时间', '路程'];
  const units =
    context === 'groups'
      ? ['人/组', '组', '人']
      : context === 'shopping'
        ? ['元/件', '件', '元']
        : scenario === 'car'
          ? ['千米/时', '小时', '千米']
          : ['米/分', '分钟', '米'];
  const conditions =
    problem === 'purchase'
      ? ['3本同样的笔记本共18元', '要买8本这样的笔记本', '带了70元', '商店上午8时开门']
      : ['去程速度60千米/时', '去程用了4小时', '返回用了3小时', '往返走同一路线', '汽车是蓝色的'];
  const relevant = problem === 'purchase' ? [0, 1, 2] : [0, 1, 2, 3];
  const selectionCorrect =
    selected.length === relevant.length && relevant.every((i) => selected.includes(i));
  let frames = quantityFrames(unitValue, count, context, unknown, scenario === 'car');
  if (compare)
    frames = [
      {
        title: '时间和路程都可能不同',
        text: '小明4分钟走280米，小红4分钟走240米，小刚3分钟走240米。三条路线共用0～320米的刻度。',
        groups: 0,
        reveal: false,
      },
      {
        title: '都看行进的第一分钟',
        text: '小明每分钟70米，小红每分钟60米，小刚每分钟80米。比较同样一分钟行进的距离，才能公平比较。',
        groups: 1,
        reveal: false,
      },
      {
        title: '用总路程除以时间',
        text: '280÷4＝70（米/分）；240÷4＝60（米/分）；240÷3＝80（米/分）。速度表示单位时间行进的路程。',
        groups: 2,
        reveal: true,
      },
      {
        title: '走得远，不一定走得快',
        text: '80＞70＞60，小刚最快。小刚3分钟到达240米处，小明4分钟到达280米处；小明总路程较长，但速度较慢。',
        groups: 4,
        reveal: true,
      },
    ];
  if (isProblem) {
    const shopping = purchaseChange(18, 3, 8, 70);
    frames =
      problem === 'purchase'
        ? [
            {
              title: '选条件，分清每个数量',
              text: '问题：买8本这样的笔记本，还剩多少元？选择有用条件。开门时间与购买金额无关。',
              groups: 0,
              reveal: false,
            },
            {
              title: '第一步：求不变的单价',
              text: `3本共18元，每本18÷3＝${shopping.unitValue}（元/本）。同样的笔记本按同一单价购买。`,
              groups: 1,
              reveal: false,
            },
            {
              title: '第二步：求新的总价',
              text: `8本需要${shopping.unitValue}×8＝${shopping.cost}（元）。这里的48元是用去的钱，70元是带的钱。`,
              groups: 2,
              reveal: false,
            },
            {
              title: '第三步：求剩余的钱',
              text: `70－${shopping.cost}＝${shopping.change}（元）。用去48元，加上剩余22元，正好是带来的70元。`,
              groups: 3,
              reveal: true,
            },
          ]
        : [
            {
              title: '选条件，找出什么没有变',
              text: '问题：返回的速度是多少？“往返走同一路线”告诉我们两次路程相同，车身颜色与计算无关。',
              groups: 0,
              reveal: false,
            },
            {
              title: '第一步：求去程路程',
              text: '60×4＝240（千米）。图中4个相同的时间段，每段表示1小时行60千米。',
              groups: 1,
              reveal: false,
            },
            {
              title: '第二步：同一路程重新分段',
              text: '返回的路程仍为240千米，把同样长的路线平均分成3个1小时的时间段。',
              groups: 2,
              reveal: false,
            },
            {
              title: '第三步：求返回速度',
              text: '240÷3＝80（千米/时）。3×80＝240，和去程路程相同。两条路线等长，每小时行进的路程不同。',
              groups: 3,
              reveal: true,
            },
          ];
  }
  const current = frames[Math.min(step, frames.length - 1)];
  const reset = () => {
    setStep(0);
    setPlaying(false);
    setStaticMode(false);
  };
  useEffect(
    () => onExplored(staticMode || step === frames.length - 1),
    [staticMode, step, frames.length, onExplored],
  );
  useEffect(() => {
    if (!playing || staticMode) return;
    if (step >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(
      () => setStep((n) => Math.min(n + 1, frames.length - 1)),
      1500 / speed,
    );
    return () => clearTimeout(timer);
  }, [playing, staticMode, step, frames.length, speed]);
  const update = (setter: (value: number) => void, value: number) => {
    setter(value);
    reset();
  };
  const changeUnknown = (value: UnknownQuantity) => {
    setUnknown(value);
    reset();
  };
  function changeScenario(value: typeof scenario) {
    setScenario(value);
    setUnitValue(value === 'car' ? 60 : 70);
    setCount(value === 'car' ? 3 : 4);
    reset();
  }
  const finalValue = (index: number) =>
    unknown === (index === 0 ? 'unit' : index === 1 ? 'count' : 'total') && !current.reveal
      ? '?'
      : [unitValue, count, relation.total][index];
  return (
    <section
      className="demo-player geometry-player quantity-player"
      aria-label="乘法数量关系交互演示"
    >
      <div className="demo-topbar">
        <span>
          <Icon name="Shapes" size={18} />
          把数量关系画出来
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
      <details className="lesson-parameters">
        <summary>调整情境与已知量</summary>
        <div className="quantity-controls">
          {demo.kind === 'shopping' && (
            <label>
              教材情境
              <select
                aria-label="购物情境"
                onChange={(e) => {
                  const pen = e.target.value === 'pen';
                  setUnitValue(pen ? 8 : 2);
                  setCount(pen ? 2 : 5);
                  reset();
                }}
                defaultValue="pen"
              >
                <option value="pen">钢笔：8元/支，买2支</option>
                <option value="notebook">练习本：2元/本，买5本</option>
              </select>
            </label>
          )}
          {demo.kind === 'journey' && (
            <label>
              行进情境
              <select
                aria-label="行进情境"
                value={scenario}
                onChange={(e) => changeScenario(e.target.value as typeof scenario)}
              >
                <option value="walk">步行：米/分与分钟</option>
                <option value="car">行车：千米/时与小时</option>
                <option value="compare">教材：三位同学谁走得快</option>
              </select>
            </label>
          )}
          {isProblem && (
            <label>
              解决哪一个问题
              <select
                aria-label="应用题情境"
                value={problem}
                onChange={(e) => {
                  setProblem(e.target.value as typeof problem);
                  setSelected([]);
                  reset();
                }}
              >
                <option value="purchase">购物：先求单价，再算找零</option>
                <option value="return">往返：路程相同，速度不同</option>
              </select>
            </label>
          )}
          {!isProblem && !compare && (
            <>
              <NumberRange
                id={`${id}-unit`}
                label={names[0]}
                value={unitValue}
                min={demo.kind === 'journey' ? 10 : 1}
                max={demo.kind === 'equalGroups' ? 8 : demo.kind === 'journey' ? 100 : 20}
                step={demo.kind === 'journey' ? 10 : 1}
                suffix={units[0]}
                onChange={(v) => update(setUnitValue, v)}
              />
              <NumberRange
                id={`${id}-count`}
                label={names[1]}
                value={count}
                min={1}
                max={demo.kind === 'equalGroups' ? 6 : demo.kind === 'journey' ? 8 : 12}
                suffix={units[1]}
                onChange={(v) => update(setCount, v)}
              />
            </>
          )}
        </div>
        {isProblem && (
          <div className="quantity-conditions">
            <p>
              <b>先挑出计算需要的条件</b>，再跟着步骤整理。
            </p>
            <div role="group" aria-label="选择有用条件">
              {conditions.map((text, i) => (
                <button
                  key={text}
                  aria-pressed={selected.includes(i)}
                  onClick={() =>
                    setSelected((list) =>
                      list.includes(i) ? list.filter((v) => v !== i) : [...list, i],
                    )
                  }
                >
                  {selected.includes(i) ? '已选：' : ''}
                  {text}
                </button>
              ))}
            </div>
            <p role="status">
              {selected.length
                ? selectionCorrect
                  ? '选对了：这些条件可以连成完整的数量关系。'
                  : '再对照问题看看：是否漏掉关键条件，或选了无关信息？'
                : '每个条件都可以点选，也可以取消。'}
            </p>
          </div>
        )}
      </details>
      {!compare && !isProblem && (
        <div className="quantity-unknowns" role="group" aria-label="选择要求的量">
          {(['total', 'unit', 'count'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={unknown === value}
              onClick={() => changeUnknown(value)}
            >
              求{names[value === 'unit' ? 0 : value === 'count' ? 1 : 2]}
            </button>
          ))}
        </div>
      )}
      {staticMode ? (
        <ol className="quantity-static">
          {frames.map((frame, i) => (
            <li key={i}>
              <h3>{frame.title}</h3>
              <p>{frame.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <div className="quantity-stage">
            {!isProblem &&
              !compare &&
              context !== 'journey' &&
              !(context === 'groups' && unknown !== 'total') && (
                <div className="quantity-facts">
                  {names.map((name, i) => (
                    <div key={name}>
                      <span>{name}</span>
                      <strong>
                        {finalValue(i)}
                        <small>{units[i]}</small>
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            {compare ? (
              <ComparisonDrawing frame={current} />
            ) : isProblem ? (
              <ProblemDrawing problem={problem} step={step} />
            ) : context === 'groups' && unknown !== 'total' ? (
              <DivisionMeaningDrawing
                unitValue={unitValue}
                count={count}
                unknown={unknown}
                grouped={step >= 2}
                reveal={current.reveal}
              />
            ) : context === 'journey' ? (
              <JourneyDrawing
                unitValue={unitValue}
                count={count}
                groups={current.groups}
                suffix={units[2]}
              />
            ) : (
              <div
                className="quantity-groups"
                role="img"
                aria-label={`${count}份，每份${unitValue}${context === 'groups' ? '人' : '元'}，已展示${Math.min(current.groups, count)}份`}
              >
                {Array.from({ length: count }, (_, i) => (
                  <div
                    key={i}
                    className={`quantity-group ${i < current.groups ? 'is-counted' : ''}`}
                    data-counted={i < current.groups}
                  >
                    <span>
                      第{i + 1}
                      {context === 'groups' ? '组' : '件'}
                    </span>
                    {context === 'groups' ? (
                      <div className="quantity-people">
                        {Array.from({ length: unitValue }, (_, j) => (
                          <i key={j} />
                        ))}
                      </div>
                    ) : (
                      <Icon name="BookOpen" size={28} />
                    )}
                    <strong>
                      {unknown === 'unit' && !current.reveal ? '?' : unitValue}
                      {context === 'groups' ? '人' : '元'}
                    </strong>
                  </div>
                ))}
              </div>
            )}
            {!isProblem && !compare && !(context === 'groups' && unknown !== 'total') && (
              <div className="quantity-equation">
                {unknown === 'total' && current.groups > 0 && (
                  <span className="quantity-addition" aria-label="相同加数的和">
                    {Array.from({ length: Math.min(current.groups, count) }, () => unitValue).join(
                      '＋',
                    )}
                    ＝{Math.min(current.groups, count) * unitValue}
                  </span>
                )}
                <span>
                  {current.reveal
                    ? relation.equations[unknown]
                    : `${names[2]} = ${names[0]} × ${names[1]}`}
                </span>
              </div>
            )}
          </div>
          <LessonNarration>
            <div className="narration" aria-live="polite">
              <span className="narration-step">{step + 1}</span>
              <div>
                <strong>{current.title}</strong>
                <p>{current.text}</p>
              </div>
            </div>
            {!isProblem && !compare && (
              <QuantityRelationGuide
                context={context}
                unitValue={unitValue}
                count={count}
                perHour={scenario === 'car'}
                unknown={unknown}
                onUnknown={changeUnknown}
              />
            )}
          </LessonNarration>
          <StepControls
            step={step}
            last={frames.length - 1}
            onStep={(next) => {
              setPlaying(false);
              setStep(next);
            }}
            playing={playing}
            onPlay={() => {
              if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
                setStaticMode(true);
                return;
              }
              if (step === frames.length - 1) setStep(0);
              setPlaying(!playing);
            }}
            speed={speed}
            onSpeed={setSpeed}
            onReset={reset}
          />
        </>
      )}
      <p className="quantity-footnote">
        {isProblem
          ? '应用题来自本平台原创题库，按教材的数量关系方法讲解。'
          : context === 'journey'
            ? '图上刻度统一，演示假定匀速。计算前先确认路程和时间的单位配套。'
            : '每一份都同样多。先说清每个数表示什么，再写出算式和单位。'}
      </p>
    </section>
  );
}
function DivisionMeaningDrawing({
  unitValue,
  count,
  unknown,
  grouped,
  reveal,
}: {
  unitValue: number;
  count: number;
  unknown: 'unit' | 'count';
  grouped: boolean;
  reveal: boolean;
}) {
  const total = unitValue * count;
  const height = count <= 3 ? 150 : 225;
  return (
    <svg
      className="quantity-svg quantity-division"
      viewBox={`0 0 450 ${height}`}
      role="img"
      aria-label={
        grouped
          ? `${total}人，${unknown === 'unit' ? `平均分成${count}组，求每组人数` : `每组${unitValue}人，求组数`}`
          : `共${total}人，还没有分组`
      }
    >
      <text x="225" y="28" textAnchor="middle">
        {unknown === 'unit' ? `平均分成${count}组，每组几人？` : `每组${unitValue}人，可以分几组？`}
      </text>
      {Array.from({ length: count }, (_, group) => {
        const x = 5 + (group % 3) * 150,
          y = 42 + Math.floor(group / 3) * 75;
        return (
          <g key={group}>
            {grouped && (
              <rect
                x={x}
                y={y}
                width="140"
                height="65"
                rx="10"
                fill="var(--sky-soft)"
                stroke="var(--sky)"
                strokeWidth="2"
              />
            )}
            {Array.from({ length: unitValue }, (_, person) => (
              <circle
                key={person}
                cx={x + 24 + (person % 4) * 31}
                cy={y + 23 + Math.floor(person / 4) * 23}
                r="7"
                fill="var(--primary)"
              />
            ))}
          </g>
        );
      })}
      <text x="225" y={height - 12} textAnchor="middle">
        {grouped
          ? `${total}÷${unknown === 'unit' ? count : unitValue}＝${reveal ? (unknown === 'unit' ? `${unitValue}（人）` : `${count}（组）`) : '？'}`
          : `共${total}人；下一步，圈出每一组`}
      </text>
    </svg>
  );
}
function NumberRange({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <label htmlFor={id}>
      {label}
      <b>
        {value} {suffix}
      </b>
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function JourneyDrawing({
  unitValue,
  count,
  groups,
  suffix,
}: {
  unitValue: number;
  count: number;
  groups: number;
  suffix: string;
}) {
  const reached = Math.min(groups, count),
    x = (distance: number) => 40 + (distance / 800) * 320;
  return (
    <svg
      className="quantity-svg quantity-route"
      viewBox="0 0 400 200"
      role="img"
      aria-label={`同尺度路线0到800${suffix}，每段${unitValue}${suffix}，已行进${reached}段，共${reached * unitValue}${suffix}`}
    >
      <text className="quantity-svg-title" x="200" y="27" textAnchor="middle">
        每段代表1{suffix === '米' ? '分钟' : '小时'}
      </text>
      <line x1="40" y1="110" x2="360" y2="110" stroke="var(--input)" strokeWidth="3" />
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <rect
            x={x(i * unitValue)}
            y="80"
            width={(unitValue / 800) * 320}
            height="30"
            fill={i < reached ? 'var(--sky)' : 'var(--sky-soft)'}
            stroke="white"
          />
          <line
            x1={x((i + 1) * unitValue)}
            x2={x((i + 1) * unitValue)}
            y1="76"
            y2="115"
            stroke="var(--muted)"
          />
        </g>
      ))}
      {[0, 200, 400, 600, 800].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1="118" y2="125" stroke="var(--muted)" />
          <text x={x(v)} y="147" textAnchor="middle">
            {v}
          </text>
        </g>
      ))}
      <circle cx={x(reached * unitValue)} cy="64" r="9" fill="var(--success)" />
      <text className="quantity-svg-summary" x="200" y="183" textAnchor="middle">
        已行进 {reached * unitValue} {suffix}
      </text>
    </svg>
  );
}
function ComparisonDrawing({ frame }: { frame: QuantityFrame }) {
  return (
    <>
      <svg
        className="quantity-svg"
        viewBox="0 0 640 260"
        role="img"
        aria-label={`三人共用0到320米刻度，经过${frame.groups}分钟；小明70米/分、小红60米/分、小刚80米/分`}
      >
        {classmates.map((trip, i) => {
          const y = 50 + i * 70,
            distance = Math.min(frame.groups, trip.time) * trip.speed;
          return (
            <g key={trip.name}>
              <text x="17" y={y + 5}>
                {trip.name}
              </text>
              <line x1="75" x2="580" y1={y} y2={y} stroke="var(--border)" strokeWidth="12" />
              <line
                x1="75"
                x2={75 + (distance / 320) * 505}
                y1={y}
                y2={y}
                stroke={palette[i]}
                strokeWidth="12"
              />
              <circle cx={75 + (distance / 320) * 505} cy={y} r="9" fill={palette[i]} />
              <text x="75" y={y + 29}>
                {distance}米{frame.groups >= trip.time ? ' · 已到达' : ''}
              </text>
            </g>
          );
        })}
        {[0, 80, 160, 240, 320].map((v) => (
          <text key={v} x={75 + (v / 320) * 505} y="250" textAnchor="middle">
            {v}米
          </text>
        ))}
      </svg>
      <div className="quantity-table-wrap">
        <table className="quantity-table">
          <caption>教材 p.50：比较每分钟走的路程</caption>
          <thead>
            <tr>
              <th>姓名</th>
              <th>路程</th>
              <th>时间</th>
              <th>速度</th>
            </tr>
          </thead>
          <tbody>
            {classmates.map((t) => (
              <tr key={t.name}>
                <th scope="row">{t.name}</th>
                <td>{t.distance}米</td>
                <td>{t.time}分钟</td>
                <td>{frame.reveal ? `${t.speed}米/分` : '待计算'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function ProblemDrawing({ problem, step }: { problem: 'purchase' | 'return'; step: number }) {
  if (problem === 'return')
    return (
      <>
        <svg
          className="quantity-svg"
          viewBox="0 0 640 250"
          role="img"
          aria-label={`去程和回程同为240千米，去程分4段、回程分3段，${step >= 3 ? '返回每小时80千米' : '正在求返回速度'}`}
        >
          {[4, 3].map((segments, row) => (
            <g key={row}>
              <text x="25" y={60 + row * 100}>
                {row === 0 ? '去程' : '回程'}
              </text>
              <rect
                x="85"
                y={38 + row * 100}
                width="500"
                height="32"
                fill={step >= row + 1 ? 'var(--sky-soft)' : 'var(--muted-surface)'}
                stroke="var(--input)"
              />
              {Array.from({ length: segments }, (_, i) => (
                <g key={i}>
                  <line
                    x1={85 + (500 * i) / segments}
                    x2={85 + (500 * i) / segments}
                    y1={38 + row * 100}
                    y2={70 + row * 100}
                    stroke="var(--sky)"
                  />
                  <text
                    x={85 + (500 * (i + 0.5)) / segments}
                    y={61 + row * 100}
                    textAnchor="middle"
                  >
                    {row === 0 ? '60' : step >= 3 ? '80' : '?'}千米
                  </text>
                </g>
              ))}
              <text x="335" y={94 + row * 100} textAnchor="middle">
                {row === 0 ? '4小时' : '3小时'} · 路程{step >= 1 ? '240' : '?'}千米
              </text>
            </g>
          ))}
        </svg>
        <p className="quantity-equation">
          {step >= 3
            ? '240 ÷ 3 = 80 千米/时'
            : step >= 1
              ? '60 × 4 = 240 千米'
              : '先求路程，再求返回速度'}
        </p>
      </>
    );
  return (
    <>
      <div className="quantity-table-wrap">
        <table className="quantity-table">
          <caption>同样的笔记本，单价不变</caption>
          <thead>
            <tr>
              <th>购物单</th>
              <th>单价</th>
              <th>数量</th>
              <th>总价</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">原来购买</th>
              <td>{step >= 1 ? '6元/本' : '?'}</td>
              <td>3本</td>
              <td>18元</td>
            </tr>
            <tr>
              <th scope="row">这次购买</th>
              <td>{step >= 1 ? '6元/本' : '相同'}</td>
              <td>8本</td>
              <td>{step >= 2 ? '48元' : '?'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <svg
        className="quantity-svg"
        viewBox="0 0 640 145"
        role="img"
        aria-label={`70元分成用去的48元与剩下的22元，当前${step >= 3 ? '剩22元' : '待计算'}`}
      >
        <text x="320" y="27" textAnchor="middle">
          带来的70元
        </text>
        <rect x="60" y="45" width="520" height="40" fill="var(--sky-soft)" stroke="var(--input)" />
        {step >= 2 && <rect x="60" y="45" width={(520 * 48) / 70} height="40" fill="var(--sky)" />}
        <text x="220" y="112" textAnchor="middle">
          用去：{step >= 2 ? '48元' : '?'}
        </text>
        <text x="500" y="112" textAnchor="middle">
          剩余：{step >= 3 ? '22元' : '?'}
        </text>
      </svg>
      <p className="quantity-equation">
        {step === 3
          ? '70 − 48 = 22 元'
          : step === 2
            ? '6 × 8 = 48 元'
            : step === 1
              ? '18 ÷ 3 = 6 元/本'
              : '找出需要的条件 → 求单价 → 求总价 → 求剩余'}
      </p>
    </>
  );
}
