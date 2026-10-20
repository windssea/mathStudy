import StepControls from './StepControls';
import { useEffect, useId, useState } from 'react';
import type { ArithmeticDemo } from '@mathstudy/contracts';
import {
  arithmeticScenes,
  calculationFrames,
  type CalculationFrame,
} from '@mathstudy/animation-engine';
import {
  expressionOperations,
  parseExpression,
  expressionText,
  expressionTokens,
  operationRule,
  readyOperations,
  reduceOperation,
} from '@mathstudy/math-core';

export default function ArithmeticLessonPlayer({
  demo,
  onExplored,
}: {
  demo: ArithmeticDemo;
  onExplored: (done: boolean) => void;
}) {
  const examples = arithmeticScenes.filter((item) => item.kind === demo.kind);
  const [exampleId, setExampleId] = useState(demo.exampleId);
  const scene = examples.find((item) => item.id === exampleId) ?? examples[0];
  const [frames, setFrames] = useState<CalculationFrame[]>(() =>
    calculationFrames(scene.expression),
  );
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const [staticMode, setStaticMode] = useState(false),
    [feedback, setFeedback] = useState(''),
    [forward, setForward] = useState(false);
  const prefix = scene.problem ? 2 : 0;
  const last = prefix + frames.length - 1 + (scene.problem ? 1 : 0);
  const calculationIndex = Math.max(0, Math.min(step - prefix, frames.length - 1));
  const frame = frames[calculationIndex],
    problem = scene.problem;
  const ready = readyOperations(frame.root);
  const operations = expressionOperations(frame.root);
  function partRevealed(value: number, index: number) {
    return (
      staticMode ||
      step === last ||
      (calculationIndex >= index + 1 &&
        frames.slice(1, calculationIndex + 1).some((item) => item.operation.endsWith(`= ${value}`)))
    );
  }
  const id = useId();
  function reset(expression = scene.expression, initial = 0) {
    setFrames(calculationFrames(expression));
    setStep(initial);
    setPlaying(false);
    setStaticMode(false);
    setFeedback('');
  }
  function chooseExample(value: string) {
    const next = examples.find((item) => item.id === value)!;
    setExampleId(value);
    reset(next.expression);
    setForward(false);
  }
  function calculate(operationId: string) {
    setPlaying(false);
    if (!ready.some((item) => item.node.id === operationId)) {
      setFeedback(operationRule(frame.root, operationId));
      return;
    }
    const result = reduceOperation(frame.root, operationId);
    const tail = calculationFrames(result.root);
    tail[0] = result;
    setFrames([...frames.slice(0, calculationIndex + 1), ...tail]);
    setStep(prefix + calculationIndex + 1);
    setFeedback(`${result.operation}。${result.reason}`);
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
    }, 2200 / speed);
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
  const stageTitle =
    problem && step === 0
      ? '① 读题：已知什么，要求什么'
      : problem && step === 1
        ? '② 分析：找到中间量'
        : problem && step === last
          ? '④ 检验：回到原来的数量关系'
          : problem
            ? '③ 列式与计算：每一步都有含义'
            : '下一步，先算哪里？';
  const currentReason =
    problem && step === 0
      ? scene.note
      : problem && step === 1
        ? '先从问题倒推需要的数量，再从已知条件正向计算。'
        : problem && step === last
          ? problem.check
          : frame.reason;
  return (
    <section className="panel arithmetic-player" aria-label="混合运算交互演示">
      <div className="arithmetic-heading">
        <div>
          <h2>{scene.title}</h2>
        </div>
        <span className="source-label">{scene.source}</span>
      </div>
      <label className="arithmetic-selector" htmlFor={`${id}-example`}>
        选择演示例题
        <select
          id={`${id}-example`}
          value={exampleId}
          onChange={(event) => chooseExample(event.target.value)}
        >
          {examples.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <div className="arithmetic-stage">
        <h3>{stageTitle}</h3>
        {problem && (
          <div className="arithmetic-problem">
            <p>{problem.stem}</p>
            <ul>
              {problem.conditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
            <strong>问题：{problem.target}？</strong>
          </div>
        )}
        {problem && (step >= 1 || staticMode) && (
          <div className="relation-analysis">
            <div className="arithmetic-actions">
              <button className="button" aria-pressed={!forward} onClick={() => setForward(false)}>
                从问题倒推
              </button>
              <button className="button" aria-pressed={forward} onClick={() => setForward(true)}>
                从条件推算
              </button>
            </div>
            <ol
              className="relation-chain"
              aria-label={forward ? '从条件推算的分析过程' : '从问题倒推的分析过程'}
            >
              {(forward ? [...problem.relations].reverse() : problem.relations).map(
                (relation, index) => (
                  <li key={relation.quantity}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{relation.quantity}</strong>
                      <p>{relation.relation}</p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </div>
        )}
        {problem && (step >= prefix || staticMode) && (
          <fieldset className="expression-choices">
            <legend>哪种列式符合题意？可以比较不同方法。</legend>
            {problem.choices.map((choice) => (
              <button
                className="button"
                key={choice.expression}
                onClick={() => {
                  setPlaying(false);
                  if (choice.valid) {
                    reset(choice.expression, prefix);
                    setFeedback(choice.reason);
                  } else setFeedback(choice.reason);
                }}
              >
                {choice.valid &&
                expressionText(parseExpression(choice.expression)) ===
                  expressionText(frames[0].root)
                  ? '✓ '
                  : ''}
                {choice.expression.replaceAll('*', '×').replaceAll('/', '÷').replaceAll('-', '−')}
              </button>
            ))}
          </fieldset>
        )}
        {(step >= prefix || staticMode) && (
          <>
            <p className="arithmetic-instruction">
              点选运算符，试着计算下一步。选错时先看原因，再试一次。
            </p>
            <div className="expression-workbench" aria-label="当前完整算式">
              {expressionTokens(frame.root).map((token) =>
                token.kind === 'operator' ? (
                  <button
                    key={token.id}
                    className="expression-operator"
                    data-ready={ready.some((item) => item.node.id === token.id)}
                    disabled={staticMode || step === last}
                    aria-label={`计算 ${expressionText(operations.find((item) => item.node.id === token.id)!.node)}`}
                    onClick={() => calculate(token.id)}
                  >
                    {token.text}
                  </button>
                ) : (
                  <span
                    key={token.id}
                    className={`expression-${token.kind}`}
                    data-depth={token.depth}
                  >
                    {token.text}
                  </span>
                ),
              )}
            </div>
            <p className="scope-legend">
              小括号 ( ) / 中括号 [ ] 表示整体；每一步把未计算的部分照抄下来。
            </p>
            <ol className="calculation-trace" aria-label="完整等式步骤">
              {frames
                .slice(0, staticMode ? frames.length : calculationIndex + 1)
                .map((item, index) => (
                  <li key={index} className={index === calculationIndex ? 'current' : ''}>
                    <span>{index === 0 ? '原式' : '='}</span>
                    <div>
                      <strong>{expressionText(item.root)}</strong>
                      {index > 0 && (
                        <p>
                          {item.operation} · {item.scope}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
            </ol>
          </>
        )}
        {problem && (
          <div className="quantity-summary">
            <p>
              数量条：总量 {problem.total} {problem.unit}，各段按数量比例绘制
            </p>
            <div className="arithmetic-bar" aria-label="总量的分段数量条">
              {problem.parts.map((part, index) => (
                <span
                  key={part.label}
                  style={{ width: `${(part.value / problem.total) * 100}%` }}
                  data-part={index}
                  className={partRevealed(part.value, index) ? 'revealed' : ''}
                />
              ))}
            </div>
            <ul>
              {problem.parts.map((part, index) => (
                <li key={part.label}>
                  <i data-part={index} />
                  {part.label}
                  {partRevealed(part.value, index) ? `：${part.value}${problem.unit}` : '：待计算'}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="arithmetic-reason" aria-live="polite" role="status">
          {feedback || currentReason}
        </div>
        {demo.kind === 'nestedBrackets' && (
          <details className="bracket-comparison">
            <summary>对照：加一个中括号，为什么结果从4变成100？</summary>
            <p>800÷(70−30)÷5＝800÷40÷5＝20÷5＝4</p>
            <p>800÷[(70−30)÷5]＝800÷[40÷5]＝800÷8＝100</p>
            <p>第二式把40÷5的结果整体作为除数。第一式则在括号算完后，从左往右连续做两次除法。</p>
          </details>
        )}
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
          <h3>逐步阅读</h3>
          {problem && (
            <>
              <p>
                问题：{problem.target}。{scene.note}
              </p>
              {problem.relations.map((relation) => (
                <p key={relation.quantity}>
                  {relation.quantity}：{relation.relation}
                </p>
              ))}
            </>
          )}
          <ol>
            {frames.map((item, index) => (
              <li key={index}>
                <strong>{expressionText(item.root)}</strong>
                <p>
                  {item.operation}。{item.reason}
                </p>
              </li>
            ))}
          </ol>
          {problem && <p>{problem.check}</p>}
        </div>
      )}
    </section>
  );
}
