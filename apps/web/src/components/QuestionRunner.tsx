import { useState } from 'react';
import type { QuestionPublic, Explanation, Grade } from '@mathstudy/contracts';
import { difficultyLabels, typeLabels } from '@mathstudy/contracts';
import { request } from '../lib/api';
import {
  recordAnswer,
  recordAssistance,
  makeLearningEvent,
  currentLearningOwner,
  currentAccountHeaders,
  useAccount,
} from '../lib/progress';
import { Icon } from './ui';
import VisualExplanation from './VisualExplanation';
import { GridEditor, GridFigureView, initialDrawing } from './GridExercise';

export default function QuestionRunner({
  question: q,
  onAttempt,
  standalone = false,
  onResult,
  headingLevel,
}: {
  question: QuestionPublic;
  standalone?: boolean;
  headingLevel?: 2 | 3;
  onResult?: (result: 'correct' | 'incorrect' | 'revealed', assisted: boolean) => void;
  onAttempt?: (id: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    (): Record<string, string> => (q.construction ? { cells: initialDrawing(q.construction) } : {}),
  );
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<Grade>();
  const [explanation, setExplanation] = useState<Explanation>();
  const [revealed, setRevealed] = useState(false);
  const [details, setDetails] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  useAccount();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const owner = currentLearningOwner();
    const eventData = makeLearningEvent(
      'attempt',
      q.id,
      answers,
      revealed || usedHint || !!explanation,
    );
    try {
      const g = await request<Grade>(`/questions/${q.id}/check`, {
        method: 'POST',
        headers: currentAccountHeaders(),
        body: JSON.stringify({
          answers,
          attemptId: eventData.id,
          occurredAt: eventData.occurredAt,
          assisted: eventData.assisted,
        }),
      });
      setGrade(g);
      setExplanation(g.explanation);
      recordAnswer(q.id, g.correct, eventData.assisted, eventData, owner);
      onAttempt?.(q.id);
      onResult?.(g.correct ? 'correct' : 'incorrect', eventData.assisted);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reveal() {
    const owner = currentLearningOwner();
    setBusy(true);
    setError('');
    try {
      const e = await request<Explanation>(`/questions/${q.id}/explanation`, { method: 'POST' });
      setExplanation(e);
      setRevealed(true);
      setDetails(true);
      recordAssistance(q.id, owner);
      onAttempt?.(q.id);
      onResult?.('revealed', true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const Heading = standalone ? 'h1' : headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="question-runner">
      <div className="question-meta">
        <span className={`chip difficulty-${q.difficulty}`}>{difficultyLabels[q.difficulty]}</span>
        <span className="chip neutral">{typeLabels[q.type]}</span>
        {q.hasVisual && (
          <span className="visual-tag">
            <Icon name="Shapes" size={15} />
            分步图解
          </span>
        )}
      </div>
      <Heading>{q.title}</Heading>
      <p className="question-stem">{q.stem}</p>
      {q.figure && <GridFigureView figure={q.figure} />}
      <form onSubmit={submit}>
        {q.construction ? (
          <GridEditor
            task={q.construction}
            value={answers.cells ?? initialDrawing(q.construction)}
            onChange={(cells) => {
              setAnswers({ cells });
              setGrade(undefined);
            }}
          />
        ) : q.options ? (
          <fieldset className="answer-options">
            <legend className="sr-only">选择答案</legend>
            {q.options.map((option, i) => (
              <label className={answers.value === String(i) ? 'selected' : ''} key={option}>
                <input
                  type="radio"
                  name={q.id}
                  value={i}
                  required
                  checked={answers.value === String(i)}
                  onChange={() => {
                    setAnswers({ value: String(i) });
                    setGrade(undefined);
                  }}
                />
                {q.type !== 'judgement' && <span>{String.fromCharCode(65 + i)}</span>}
                {option}
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="answer-fields">
            {q.fields.map((f) => (
              <label key={f.key}>
                {f.label}
                <span>
                  <input
                    required
                    inputMode="numeric"
                    type="text"
                    maxLength={40}
                    autoComplete="off"
                    name={`${q.id}-${f.key}`}
                    value={answers[f.key] ?? ''}
                    onChange={(e) => {
                      setAnswers({ ...answers, [f.key]: e.target.value });
                      setGrade(undefined);
                    }}
                    aria-label={f.label}
                  />
                  {f.suffix && <small>{f.suffix}</small>}
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="question-actions">
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? '正在核对…' : '核对答案'}
            <Icon name="Check" size={17} />
          </button>
          <button
            type="button"
            className="button subtle"
            aria-expanded={hint}
            onClick={() => {
              if (!hint && !usedHint) {
                setUsedHint(true);
                recordAssistance(q.id);
              }
              setHint(!hint);
            }}
          >
            <Icon name="Lightbulb" size={17} />
            {hint ? '收起提示' : '提示'}
          </button>
          {!explanation && (
            <button
              type="button"
              className="text-link reveal-link"
              disabled={busy}
              onClick={reveal}
            >
              解析
            </button>
          )}
        </div>
      </form>
      {hint && (
        <div className="hint-box">
          <Icon name="Lightbulb" />
          <p>{q.hint}</p>
        </div>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error} 输入已保留，请重试。
        </p>
      )}
      {grade && (
        <div className={`grade-feedback ${grade.correct ? 'correct' : 'incorrect'}`} role="status">
          <Icon name={grade.correct ? 'CheckCircle2' : 'CircleHelp'} />
          <span>{grade.feedback}</span>
        </div>
      )}
      {explanation && (
        <section className="answer-explanation">
          <div className="explanation-summary">
            <p>{explanation.analysis}</p>
            <button
              className="button secondary"
              aria-expanded={details}
              onClick={() => setDetails(!details)}
            >
              {details ? '收起解析' : '展开解析'}
            </button>
          </div>
          {details && (
            <div className="explanation-details">
              <button
                className="button secondary"
                onClick={() => {
                  setAnswers(q.construction ? { cells: initialDrawing(q.construction) } : {});
                  setHint(false);
                  setUsedHint(false);
                  setGrade(undefined);
                  setExplanation(undefined);
                  setRevealed(false);
                  setError('');
                  setDetails(false);
                }}
              >
                重做
                <Icon name="RotateCcw" size={17} />
              </button>
              {explanation.visual ? (
                <>
                  <VisualExplanation
                    visual={explanation.visual}
                    hideTitle={explanation.visual.title === q.title}
                  />
                  <details className="text-solution">
                    <summary>文字解答</summary>
                    <ol>
                      {explanation.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </details>
                </>
              ) : (
                <>
                  <h4>解答</h4>
                  <ol>
                    {explanation.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </>
              )}
              <div className="answer-result">
                <span>答案</span>
                <strong>{explanation.answer}</strong>
              </div>
              {explanation.pitfall && (
                <div className="pitfall">
                  <Icon name="Flag" size={17} />
                  <p>
                    <b>易错点：</b>
                    {explanation.pitfall}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </article>
  );
}
