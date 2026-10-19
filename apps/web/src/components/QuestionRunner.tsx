import { useState } from 'react';
import type { QuestionPublic, Explanation, Grade } from '@mathstudy/contracts';
import { difficultyLabels, typeLabels } from '@mathstudy/contracts';
import { request } from '../lib/api';
import { recordAnswer, isStorageAvailable } from '../lib/progress';
import { Icon } from './ui';
import VisualExplanation from './VisualExplanation';

export default function QuestionRunner({
  question: q,
  onAttempt,
}: {
  question: QuestionPublic;
  onAttempt?: (id: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<Grade>();
  const [explanation, setExplanation] = useState<Explanation>();
  const [revealed, setRevealed] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const g = await request<Grade>(`/questions/${q.id}/check`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
      setGrade(g);
      setExplanation(g.explanation);
      recordAnswer(q.id, g.correct, revealed || hint || !!explanation);
      onAttempt?.(q.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reveal() {
    setBusy(true);
    setError('');
    try {
      const e = await request<Explanation>(`/questions/${q.id}/explanation`, { method: 'POST' });
      setExplanation(e);
      setRevealed(true);
      recordAnswer(q.id, false, true);
      onAttempt?.(q.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
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
        <span className="original-tag">原创练习</span>
      </div>
      <h3>{q.title}</h3>
      <p className="question-stem">{q.stem}</p>
      <form onSubmit={submit}>
        {q.options ? (
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
                <span>{String.fromCharCode(65 + i)}</span>
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
            onClick={() => setHint(!hint)}
          >
            <Icon name="Lightbulb" size={17} />
            {hint ? '收起提示' : '给我一个提示'}
          </button>
          {!explanation && (
            <button
              type="button"
              className="text-link reveal-link"
              disabled={busy}
              onClick={reveal}
            >
              我想先看讲解
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
          <h4>
            <Icon name="Search" size={18} />
            思路分析
          </h4>
          <p>{explanation.analysis}</p>
          <h4>
            <Icon name="ListChecks" size={18} />
            一步一步解
          </h4>
          <ol>
            {explanation.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <div className="answer-result">
            <span>参考答案</span>
            <strong>{explanation.answer}</strong>
          </div>
          {explanation.visual && <VisualExplanation visual={explanation.visual} />}
          <div className="pitfall">
            <Icon name="Flag" size={17} />
            <p>
              <b>别掉进这个小陷阱：</b>
              {explanation.pitfall}
            </p>
          </div>
          <p className="save-note">
            {isStorageAvailable()
              ? '练习记录保存在当前设备。'
              : '当前浏览器无法保存记录，本次结果仅在页面内保留。'}
            {(revealed || hint) && ' 使用提示或查看讲解后，不计作独立做对。'}
          </p>
        </section>
      )}
    </article>
  );
}
