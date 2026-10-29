import { Button } from './ui/button';
import { Input } from './ui/input';
import StepControls from './StepControls';
import { useEffect, useId, useState } from 'react';
import type { LargeNumberDemo } from '@mathstudy/contracts';
import {
  countingFrames,
  readingFrames,
  approximationFrames,
  type NumberFrame,
} from '@mathstudy/animation-engine';
import {
  countingUnits,
  numberPlaces,
  readChineseNumber,
  groupedNumber,
  setNumberDigit,
  parseLargeNumber,
  roundLargeNumber,
  roundingRange,
  compareLargeNumbers,
  encodeLibraryBook,
  decodeLibraryBook,
  MAX_CLASSROOM_NUMBER,
} from '@mathstudy/math-core';

type Workspace = 'counter' | 'reading' | 'rounding' | 'encoding';
const sourcePages: Record<Workspace, string> = {
  counter: '教材 p.68-69、77',
  reading: '教材 p.71-76、86-88',
  rounding: '教材 p.80-81；范围题为原创拓展',
  encoding: '参考教材 p.82-83 · 自拟图书编号',
};
type NumberExample = { value: number; label: string; power?: number };
const presets: Record<Exclude<Workspace, 'encoding'>, NumberExample[]> = {
  counter: [
    { value: 9999, label: '9999添1：连续进位', power: 0 },
    { value: 9990, label: '9990：十个十个数', power: 1 },
    { value: 9000, label: '9000：一千一千数', power: 3 },
    { value: 29990000, label: '29990000：一万一万数', power: 4 },
  ],
  reading: [
    { value: 52395239, label: '5239｜5239：分级读数' },
    { value: 6004000, label: '600｜4000：级末尾的0' },
    { value: 3008007, label: '300｜8007：中间的0' },
    { value: 600080000, label: '6｜0008｜0000：跨级读零' },
    { value: 302005000, label: '3｜0200｜5000：按数位组成' },
    { value: 13700000000, label: '137｜0000｜0000：亿级' },
    { value: 60020070, label: '6002｜0070：读写复习' },
  ],
  rounding: [
    { value: 384204, label: '384204：教材男性人数', power: 4 },
    { value: 386685, label: '386685：教材女性人数', power: 4 },
    { value: 385000, label: '385000：刚好在中点', power: 4 },
    { value: 49995000, label: '49995000：连续进位', power: 4 },
    { value: 1970000000, label: '1970000000：用亿作单位', power: 8 },
    { value: 32000000, label: '32000000：精确改写', power: 4 },
    { value: 360000, label: '360000：反推整数范围', power: 4 },
  ],
};
function initialWorkspace(demo: LargeNumberDemo): Workspace {
  return demo.kind === 'countingUnits' || demo.kind === 'decimalSystem'
    ? 'counter'
    : demo.kind === 'roundingNumbers'
      ? 'rounding'
      : demo.kind === 'numberEncoding'
        ? 'encoding'
        : 'reading';
}
export default function LargeNumberLessonPlayer({
  demo,
  onExplored,
}: {
  demo: LargeNumberDemo;
  onExplored: (done: boolean) => void;
}) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace(demo));
  const [value, setValue] = useState(demo.initialNumber),
    [draft, setDraft] = useState(String(demo.initialNumber));
  const [selectedPower, setSelectedPower] = useState(demo.kind === 'decimalSystem' ? 4 : 0),
    [counterPower, setCounterPower] = useState(demo.kind === 'decimalSystem' ? 4 : 0),
    [retainPower, setRetainPower] = useState(4);
  const [readingMode, setReadingMode] = useState<'read' | 'write' | 'compare'>('read'),
    [writingTarget, setWritingTarget] = useState(demo.initialNumber);
  const [other, setOther] = useState(78090000),
    [otherDraft, setOtherDraft] = useState('78090000');
  const [roundingMode, setRoundingMode] = useState<'round' | 'exact' | 'range'>('round'),
    [probe, setProbe] = useState<number>();
  const [codeData, setCodeData] = useState({ year: 2026, shelf: 4, serial: 30 }),
    [codeDraft, setCodeDraft] = useState({ year: '2026', shelf: '4', serial: '30' }),
    [decodeDraft, setDecodeDraft] = useState('202604030'),
    [otherCode, setOtherCode] = useState('202604031');
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [staticMode, setStaticMode] = useState(false),
    [feedback, setFeedback] = useState('');
  const id = useId(),
    code = encodeLibraryBook(codeData.year, codeData.shelf, codeData.serial);
  let frames: NumberFrame[] =
    workspace === 'counter'
      ? countingFrames(value, counterPower)
      : workspace === 'rounding'
        ? approximationFrames(value, retainPower, roundingMode)
        : readingFrames(value);
  const comparison = compareLargeNumbers(value, other);
  if (workspace === 'reading' && readingMode === 'compare')
    frames = [
      { title: '先看两个数', text: '先比较位数；位数相同时，从最高位起逐位比较。' },
      {
        title: '先数位数',
        text: `左边${String(value).length}位，右边${String(other).length}位。${comparison.reason}`,
      },
      { title: '找到第一个不同的数位', text: comparison.reason, power: comparison.power },
      {
        title: '写出比较结果',
        text: `${value} ${comparison.symbol} ${other}。`,
        result: `${groupedNumber(value)} ${comparison.symbol} ${groupedNumber(other)}`,
      },
    ];
  if (workspace === 'encoding')
    frames = [
      {
        title: '先约定分段规则',
        text: '自拟图书编号：入库年份4位｜书架号2位｜序号3位。同一规则下，一个编号只给一本图书。',
      },
      {
        title: '不足位数，前面补0',
        text: `${codeData.shelf}号书架写成${code.slice(4, 6)}，第${codeData.serial}本写成${code.slice(6)}。补0使每一段的位置固定。`,
      },
      {
        title: '按段解读，不把编号当数量',
        text: `${code.slice(0, 4)}年入库，${codeData.shelf}号书架，第${codeData.serial}本。编号中的数字逐位读，不按万级、亿级读。`,
      },
      {
        title: '检查编号是否重复',
        text: '完全相同的年份、书架和序号会生成相同编号，不能给另一本书重复使用。可以改变序号，再检查。',
        result: code,
      },
    ];
  const last = frames.length - 1,
    frame = frames[Math.min(step, last)];
  const places = numberPlaces(value),
    counts = frame.digits ?? places.map((place) => place.digit);
  const highestCount = Math.max(0, ...counts.map((digit, power) => (digit ? power : 0)));
  const examples: NumberExample[] =
    workspace === 'encoding'
      ? []
      : workspace === 'rounding' && roundingMode === 'range'
        ? [
            { value: 360000, label: '360000：36万的范围', power: 4 },
            { value: 50000, label: '50000：约5万的范围', power: 4 },
            { value: 0, label: '0：最小自然数边界', power: 4 },
            { value: 1000000000, label: '1000000000：10亿的范围', power: 8 },
          ]
        : presets[workspace];
  function reset() {
    setStep(0);
    setPlaying(false);
    setStaticMode(false);
    setFeedback('');
    setProbe(undefined);
  }
  function commit(next: number, options?: { counter?: number; retain?: number }) {
    const nextCounter = options?.counter ?? counterPower,
      nextRetain = options?.retain ?? retainPower;
    if (workspace === 'counter' && next + 10 ** nextCounter > MAX_CLASSROOM_NUMBER)
      throw new RangeError(
        '再添这个单位会超出12位演示范围，请换一个较小的数；自然数本身没有最大值。',
      );
    if (workspace === 'rounding' && roundingMode === 'range' && next % 10 ** nextRetain !== 0)
      throw new RangeError('范围实验的目标近似数应是整万或整亿，请先改成对应单位的整数倍。');
    if (options?.counter !== undefined) {
      setCounterPower(options.counter);
      setSelectedPower(options.counter);
    }
    if (options?.retain !== undefined) setRetainPower(options.retain);
    setValue(next);
    setDraft(String(next));
    reset();
  }
  function changeWorkspace(next: Workspace) {
    setWorkspace(next);
    setReadingMode('read');
    setRoundingMode('round');
    setRetainPower(4);
    setCounterPower(0);
    setSelectedPower(0);
    const nextValue = next === 'counter' ? 9999 : next === 'rounding' ? 384204 : demo.initialNumber;
    setValue(nextValue);
    setDraft(String(nextValue));
    reset();
  }
  useEffect(() => onExplored(staticMode || step === last), [staticMode, step, last, onExplored]);
  useEffect(() => {
    if (!playing || staticMode) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStep((n) => Math.min(n + 1, last));
      setFeedback('');
    }, 2400 / speed);
    return () => clearTimeout(timer);
  }, [playing, staticMode, step, last, speed]);
  function play() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setStaticMode(true);
      return;
    }
    if (step === last) setStep(0);
    setPlaying(!playing);
    setFeedback('');
  }
  function chooseRoundingMode(next: typeof roundingMode) {
    setRoundingMode(next);
    reset();
    if (next === 'range') {
      setValue(360000);
      setDraft('360000');
      setRetainPower(4);
    } else if (next === 'exact' && retainPower !== 4 && retainPower !== 8) setRetainPower(4);
  }
  return (
    <section className="panel large-number-player" aria-label="多位数交互演示">
      <div className="arithmetic-heading">
        <div>
          <h2>
            {workspace === 'counter'
              ? '让计数单位一档一档进位'
              : workspace === 'rounding'
                ? '在数轴上理解近似数'
                : workspace === 'encoding'
                  ? '给图书编一个不重复的号码'
                  : '把大数放进数位表'}
          </h2>
        </div>
        <span className="source-label">{sourcePages[workspace]}</span>
      </div>
      {demo.kind === 'largeReview' && (
        <label className="arithmetic-selector">
          综合实验
          <select value={workspace} onChange={(e) => changeWorkspace(e.target.value as Workspace)}>
            <option value="reading">数位、读写与比较</option>
            <option value="rounding">近似数与范围</option>
            <option value="counter">计数单位进位</option>
            <option value="encoding">数字编码</option>
          </select>
        </label>
      )}
      {workspace !== 'encoding' && (
        <>
          <label className="arithmetic-selector">
            选择演示例题
            <select
              value={readingMode === 'write' ? writingTarget : value}
              onChange={(e) => {
                try {
                  const next = Number(e.target.value);
                  if (readingMode === 'write' && workspace === 'reading') {
                    setWritingTarget(next);
                    commit(0);
                  } else {
                    const example = examples.find((item) => item.value === next);
                    commit(next, {
                      counter: workspace === 'counter' ? example?.power : undefined,
                      retain: workspace === 'rounding' ? example?.power : undefined,
                    });
                  }
                } catch (error) {
                  setFeedback((error as Error).message);
                }
              }}
            >
              {!examples.some(
                (item) => item.value === (readingMode === 'write' ? writingTarget : value),
              ) && (
                <option value={readingMode === 'write' ? writingTarget : value}>
                  自己设置：{readingMode === 'write' ? writingTarget : value}
                </option>
              )}
              {examples.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <details
            className="number-customize"
            open={workspace === 'reading' && readingMode === 'write'}
            key={`${workspace}-${readingMode}`}
          >
            <summary>
              {workspace === 'reading' && readingMode === 'write' ? '写数作答' : '自定义数字'}
            </summary>
            <form
              className="number-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  commit(parseLargeNumber(draft));
                } catch (error) {
                  setFeedback((error as Error).message);
                }
              }}
            >
              <label htmlFor={`${id}-number`}>
                {workspace === 'rounding' && roundingMode === 'range'
                  ? '目标近似数（整万或整亿）'
                  : readingMode === 'write' && workspace === 'reading'
                    ? '写出阿拉伯数字'
                    : '输入整数'}
                <Input
                  id={`${id}-number`}
                  inputMode="numeric"
                  maxLength={12}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
              <Button variant="outline" className="button" type="submit">
                写到数位表
              </Button>
            </form>
          </details>
        </>
      )}
      {workspace === 'counter' && (
        <label className="arithmetic-selector">
          本次添的计数单位
          <select
            value={counterPower}
            onChange={(e) => {
              setCounterPower(Number(e.target.value));
              setSelectedPower(Number(e.target.value));
              reset();
            }}
          >
            {countingUnits.map((unit, power) => (
              <option
                key={unit}
                value={power}
                disabled={value + 10 ** power > MAX_CLASSROOM_NUMBER}
              >
                添1个{unit}（{10 ** power}）
              </option>
            ))}
          </select>
        </label>
      )}
      {workspace === 'reading' && (
        <div className="arithmetic-actions number-mode-buttons">
          {(['read', 'write', 'compare'] as const).map((mode, index) => (
            <Button
              variant="outline"
              key={mode}
              className="button"
              aria-pressed={readingMode === mode}
              onClick={() => {
                if (readingMode === mode) return;
                setReadingMode(mode);
                reset();
                if (mode === 'write') {
                  setWritingTarget(value);
                  setValue(0);
                  setDraft('0');
                }
              }}
            >
              {['分级读数', '练习写数', '比较大小'][index]}
            </Button>
          ))}
        </div>
      )}
      {workspace === 'rounding' && (
        <>
          <div className="arithmetic-actions number-mode-buttons">
            {(['round', 'exact', 'range'] as const).map((mode, index) => (
              <Button
                variant="outline"
                key={mode}
                className="button"
                aria-pressed={roundingMode === mode}
                onClick={() => chooseRoundingMode(mode)}
              >
                {['四舍五入', '精确改写', '反推整数范围'][index]}
              </Button>
            ))}
          </div>
          <label className="arithmetic-selector">
            保留或改写的单位
            <select
              value={retainPower}
              onChange={(e) => {
                const power = Number(e.target.value);
                if (roundingMode === 'range') {
                  const target = roundLargeNumber(value, power).rounded;
                  if (target > MAX_CLASSROOM_NUMBER) {
                    setFeedback('这个目标超过12位演示范围，请先换一个较小的数。');
                    return;
                  }
                  setValue(target);
                  setDraft(String(target));
                }
                setRetainPower(power);
                reset();
              }}
            >
              {(roundingMode === 'round' ? [2, 3, 4, 8] : [4, 8]).map((power) => (
                <option value={power} key={power}>
                  {countingUnits[power]}
                  {roundingMode === 'round' ? '位' : ''}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <div className="large-number-stage">
        <h3>{frame.title}</h3>
        {workspace !== 'encoding' && (
          <div className="number-banner">
            <span>
              {workspace === 'counter'
                ? '本次起点'
                : workspace === 'rounding' && roundingMode === 'range'
                  ? '目标近似数'
                  : '阿拉伯数字'}
            </span>
            <strong>{groupedNumber(value)}</strong>
          </div>
        )}
        {workspace === 'reading' && readingMode === 'write' && (
          <div className="writing-task">
            <strong>请写出：{readChineseNumber(writingTarget)}</strong>

            <Button
              variant="default"
              className="button primary"
              onClick={() => {
                if (value === writingTarget) {
                  setFeedback('写对了！各级按四位对齐，0也放在了正确的位置。');
                  setStep(last);
                } else setFeedback('还不一致。请从高位起对照题目，检查每级的位数和占位的0。');
              }}
            >
              核对写数
            </Button>
            {feedback && <p className="writing-feedback">{feedback}</p>}
          </div>
        )}
        {workspace === 'reading' && readingMode === 'compare' ? (
          <>
            <form
              className="number-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  setOther(parseLargeNumber(otherDraft));
                  reset();
                } catch (error) {
                  setFeedback((error as Error).message);
                }
              }}
            >
              <label>
                右边的数
                <Input
                  inputMode="numeric"
                  maxLength={12}
                  value={otherDraft}
                  onChange={(e) => setOtherDraft(e.target.value)}
                />
              </label>
              <Button variant="outline" className="button">
                更新右边的数
              </Button>
            </form>
            <div className="number-comparison" aria-label="逐位比较两个数">
              {[value, other].map((number, index) => (
                <div key={index}>
                  <span>{index === 0 ? '左边' : '右边'}</span>
                  <strong>
                    {String(number)
                      .split('')
                      .map((digit, position) => (
                        <i
                          key={position}
                          className={
                            step >= 2 && String(number).length - 1 - position === comparison.power
                              ? 'deciding-digit'
                              : ''
                          }
                        >
                          {digit}
                        </i>
                      ))}
                  </strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          (workspace === 'reading' || workspace === 'counter') && (
            <>
              <div className="number-classes" aria-label="整数数位顺序表">
                {[2, 1, 0]
                  .filter(
                    (group) =>
                      group <=
                      Math.floor(
                        Math.max(highestCount, workspace === 'counter' ? counterPower + 1 : 0) / 4,
                      ),
                  )
                  .map((group) => (
                    <section
                      key={group}
                      className={
                        frame.power !== undefined && Math.floor(frame.power / 4) === group
                          ? 'active-number-class'
                          : ''
                      }
                    >
                      <h4>{['个级', '万级', '亿级'][group]}</h4>
                      <div className="digit-row">
                        {[3, 2, 1, 0].map((offset) => {
                          const power = group * 4 + offset,
                            place = places[power],
                            used = workspace === 'counter' ? power <= highestCount : place.used;
                          return (
                            <button
                              key={power}
                              className="digit-card"
                              data-selected={power === selectedPower}
                              data-focus={frame.power === power}
                              aria-label={`${place.position}：${used ? counts[power] : '空位'}`}
                              onClick={() => setSelectedPower(power)}
                            >
                              <small>{place.position}</small>
                              <strong>{used ? counts[power] : '未填'}</strong>
                              <span>{counts[power] > 9 ? '待进位' : place.unit}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
              </div>
              <details className="number-place-detail">
                <summary>数位含义与修改</summary>
                <strong>{places[selectedPower].position}</strong>
                <span>
                  从右起第{selectedPower + 1}位 · 计数单位：{countingUnits[selectedPower]}
                </span>
                <p>
                  {workspace === 'counter' && step > 0
                    ? `本步这一档有${counts[selectedPower]}个${countingUnits[selectedPower]}，表示${counts[selectedPower] * 10 ** selectedPower}。`
                    : `数字${places[selectedPower].digit}表示${places[selectedPower].digit}个${countingUnits[selectedPower]}，数值是${places[selectedPower].contribution}。`}
                </p>
                {(workspace === 'reading' || (workspace === 'counter' && step === 0)) && (
                  <label>
                    改变选中数位的数字
                    <select
                      value={places[selectedPower].digit}
                      onChange={(e) => {
                        try {
                          commit(setNumberDigit(value, selectedPower, Number(e.target.value)));
                        } catch (error) {
                          setFeedback((error as Error).message);
                        }
                      }}
                    >
                      {Array.from({ length: 10 }, (_, digit) => (
                        <option value={digit} key={digit}>
                          {digit}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </details>
              {workspace === 'reading' && readingMode === 'read' && (
                <div className="number-readout" aria-live="polite">
                  <span>读作</span>
                  <strong>{frame.readout ?? '先分级，再从高位读起'}</strong>
                </div>
              )}
            </>
          )
        )}
        {workspace === 'counter' && (
          <div className="unit-exchange">
            <div
              className="unit-pile"
              aria-label={`10个${countingUnits[Math.min(frame.exchangePower ?? counterPower, 10)]}`}
            >
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index}>
                  {countingUnits[Math.min(frame.exchangePower ?? counterPower, 10)]}
                </span>
              ))}
            </div>
            <strong>
              10个{countingUnits[Math.min(frame.exchangePower ?? counterPower, 10)]}
              <br />
              ＝1个{countingUnits[Math.min(frame.exchangePower ?? counterPower, 10) + 1]}
            </strong>
          </div>
        )}
        {workspace === 'rounding' && roundingMode !== 'exact' && (
          <NumberLine
            value={value}
            power={retainPower}
            step={step}
            rangeMode={roundingMode === 'range'}
            probe={probe}
          />
        )}
        {workspace === 'rounding' && roundingMode === 'range' && (
          <div className="range-probes">
            <p>试一试边界前后的相邻整数：</p>
            {(() => {
              const range = roundingRange(value, retainPower);
              return [range.lower - 1, range.lower, range.upper, range.excludedUpper].map(
                (number, index) => (
                  <Button
                    variant="outline"
                    className="button"
                    key={index}
                    disabled={number < 0 || number > MAX_CLASSROOM_NUMBER}
                    onClick={() => {
                      setPlaying(false);
                      setProbe(number);
                      const rounded = roundLargeNumber(number, retainPower).rounded;
                      setFeedback(
                        `${number}四舍五入后是${rounded}，${rounded === value ? '在目标范围内' : '不在目标范围内'}。`,
                      );
                    }}
                  >
                    <small>{['下界之前', '最小整数', '最大整数', '上界之外'][index]}</small>
                    {number}
                  </Button>
                ),
              );
            })()}
          </div>
        )}
        {workspace === 'encoding' && (
          <>
            <p className="number-tool-note">
              固定规则：年份4位｜书架号2位｜序号3位。全部为自拟图书数据。
            </p>
            <form
              className="encoding-fields"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const data = {
                    year: Number(codeDraft.year),
                    shelf: Number(codeDraft.shelf),
                    serial: Number(codeDraft.serial),
                  };
                  if (!Object.values(codeDraft).every((part) => /^\d+$/.test(part)))
                    throw new RangeError('年份、书架和序号都应填写数字。');
                  encodeLibraryBook(data.year, data.shelf, data.serial);
                  setCodeData(data);
                  setDecodeDraft(encodeLibraryBook(data.year, data.shelf, data.serial));
                  reset();
                } catch (error) {
                  setFeedback((error as Error).message);
                }
              }}
            >
              {(['year', 'shelf', 'serial'] as const).map((key, index) => (
                <label key={key}>
                  {['入库年份', '书架号', '图书序号'][index]}
                  <Input
                    inputMode="numeric"
                    maxLength={[4, 2, 3][index]}
                    value={codeDraft[key]}
                    onChange={(e) => setCodeDraft({ ...codeDraft, [key]: e.target.value })}
                  />
                </label>
              ))}
              <Button variant="outline" className="button">
                生成编号
              </Button>
            </form>
            <div className="encoding-segments" aria-label="分段图书编号">
              {[code.slice(0, 4), code.slice(4, 6), code.slice(6)].map((segment, index) => (
                <div key={index}>
                  <span>{['年份4位', '书架2位', '序号3位'][index]}</span>
                  <strong>{step >= 1 || staticMode ? segment : '□'.repeat(segment.length)}</strong>
                </div>
              ))}
            </div>
            <p className="number-tool-note">
              逐位读：
              {step >= 2 || staticMode
                ? code
                    .split('')
                    .map(
                      (digit) =>
                        ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'][Number(digit)],
                    )
                    .join(' ')
                : '先按规则分段，再逐位读出编号。'}
            </p>
            <details className="encoding-tools">
              <summary>解读编号与查重</summary>
              <form
                className="number-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    const data = decodeLibraryBook(decodeDraft);
                    setCodeData(data);
                    setCodeDraft({
                      year: String(data.year),
                      shelf: String(data.shelf),
                      serial: String(data.serial),
                    });
                    reset();
                    setStep(2);
                    setFeedback(
                      `解读成功：${data.year}年、${data.shelf}号书架、第${data.serial}本。`,
                    );
                  } catch (error) {
                    setFeedback((error as Error).message);
                  }
                }}
              >
                <label>
                  要解读的编号
                  <Input
                    inputMode="numeric"
                    maxLength={9}
                    value={decodeDraft}
                    onChange={(e) => setDecodeDraft(e.target.value)}
                  />
                </label>
                <Button variant="outline" className="button">
                  解读编号
                </Button>
              </form>
              <form
                className="number-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    decodeLibraryBook(otherCode);
                    setFeedback(
                      code === otherCode
                        ? '编号重复！不能把同一个编号分给另一本书。'
                        : '两个编号不同，可以区分这两本书。',
                    );
                    setPlaying(false);
                  } catch (error) {
                    setFeedback((error as Error).message);
                  }
                }}
              >
                <label>
                  另一本书的编号
                  <Input
                    inputMode="numeric"
                    maxLength={9}
                    value={otherCode}
                    onChange={(e) => setOtherCode(e.target.value)}
                  />
                </label>
                <Button variant="outline" className="button">
                  检查重复
                </Button>
              </form>
            </details>
          </>
        )}
        <div className="arithmetic-reason" role="status" aria-live="polite">
          {feedback || frame.text}
        </div>
        {frame.result && <div className="number-result">{frame.result}</div>}
      </div>
      <StepControls
        step={step}
        last={last}
        onStep={(next) => {
          setStep(next);
          setPlaying(false);
          setFeedback('');
        }}
        playing={playing}
        onPlay={play}
        speed={speed}
        onSpeed={setSpeed}
        onReset={() => reset()}
        staticMode={staticMode}
        onStatic={() => {
          setStaticMode(!staticMode);
          setPlaying(false);
        }}
      />
      {staticMode && (
        <div className="arithmetic-static">
          <h3>完整静态步骤</h3>
          <ol>
            {frames.map((item, index) => (
              <li key={index}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                {item.readout && <p>读作：{item.readout}</p>}
                {item.result && <p>{item.result}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
function NumberLine({
  value,
  power,
  step,
  rangeMode,
  probe,
}: {
  value: number;
  power: number;
  step: number;
  rangeMode: boolean;
  probe?: number;
}) {
  const rounding = roundLargeNumber(value, power),
    range = rangeMode ? roundingRange(value, power) : undefined;
  const start = range ? Math.max(0, value - range.unit) : rounding.lower,
    end = range ? value + range.unit : rounding.upper;
  const x = (number: number) => 60 + ((number - start) / (end - start)) * 600;
  const current = range ? (probe ?? value) : value;
  return (
    <div className="number-line">
      <svg
        viewBox="0 0 720 210"
        role="img"
        aria-label={
          range
            ? `四舍五入后为${value}的整数范围：${range.lower}至${range.upper}，不含${range.excludedUpper}。`
            : `${value}位于${rounding.lower}与${rounding.upper}之间，中点${rounding.midpoint}，四舍五入到${rounding.rounded}。`
        }
      >
        <line x1="60" x2="660" y1="94" y2="94" stroke="#64748b" strokeWidth="2" />
        {range && step >= 1 && (
          <rect
            x={x(range.lower)}
            y="82"
            width={x(range.excludedUpper) - x(range.lower)}
            height="24"
            fill="#3563e9"
            opacity=".18"
          />
        )}
        {[start, (start + end) / 2, end].map((number) => (
          <g key={number}>
            <line x1={x(number)} x2={x(number)} y1="85" y2="103" stroke="#64748b" />
            <text
              x={x(number)}
              y="166"
              textAnchor={number === start ? 'start' : number === end ? 'end' : 'middle'}
            >
              {number}
            </text>
          </g>
        ))}
        {!range && step >= 1 && (
          <>
            <line
              x1={x(rounding.midpoint)}
              x2={x(rounding.midpoint)}
              y1="65"
              y2="115"
              stroke="#c38b2c"
              strokeDasharray="4 4"
            />
            <text x={x(rounding.midpoint)} y="194" textAnchor="middle">
              中点 {rounding.midpoint}
            </text>
          </>
        )}
        {range && step >= 1 && (
          <>
            <circle cx={x(range.lower)} cy="94" r="5" fill="#3563e9" />
            <text x={x(range.lower)} y="124" textAnchor="middle">
              {range.lower}（含）
            </text>
          </>
        )}
        {range && step >= 2 && (
          <>
            <circle
              cx={x(range.excludedUpper)}
              cy="94"
              r="5"
              fill="white"
              stroke="#3563e9"
              strokeWidth="2"
            />
            <text x={x(range.excludedUpper)} y="124" textAnchor="middle">
              {range.excludedUpper}（不含）
            </text>
          </>
        )}
        {(step >= 2 || probe !== undefined) && (
          <>
            <line x1={x(current)} x2={x(current)} y1="45" y2="85" stroke="#3563e9" />
            <circle cx={x(current)} cy={range ? '55' : '94'} r="6" fill="#3563e9" />
            <text x={Math.min(620, Math.max(100, x(current)))} y="32" textAnchor="middle">
              原数 {current}
            </text>
          </>
        )}
        {!range && step >= 3 && (
          <path
            d={`M ${x(current)} 65 Q ${(x(current) + x(rounding.rounded)) / 2} 5 ${x(rounding.rounded)} 65`}
            fill="none"
            stroke="#4c9679"
            strokeWidth="3"
          />
        )}
      </svg>
    </div>
  );
}
