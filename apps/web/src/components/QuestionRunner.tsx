import { Button } from './ui/button';
import { Input } from './ui/input';
import { useEffect, useId, useRef, useState } from 'react';
import SplitWorkspace from './layout/SplitWorkspace';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import type { QuestionPublic, Explanation, Grade, PracticeTopic } from '@mathstudy/contracts';
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
import TopicMethod from './TopicMethod';
import QuestionReferenceChoices from './QuestionReferenceChoices';
import { questionDraftSchema, readDraft, writeDraft } from '../lib/practice-drafts';

function initialAnswers(q: QuestionPublic): Record<string, string> {
  return q.construction
    ? { cells: initialDrawing(q.construction) }
    : Object.fromEntries(
        q.fields.filter((f) => f.fixedValue !== undefined).map((f) => [f.key, f.fixedValue!]),
      );
}

export default function QuestionRunner({
  question: q,
  onAttempt,
  standalone = false,
  onResult,
  headingLevel,
  method,
  draftScope = 'question',
}: {
  question: QuestionPublic;
  standalone?: boolean;
  headingLevel?: 2 | 3;
  method?: PracticeTopic;
  draftScope?: string;
  onResult?: (result: 'correct' | 'incorrect' | 'revealed', assisted: boolean) => void;
  onAttempt?: (id: string) => void;
}) {
  const formId = useId();
  const answerTrigger = useRef<HTMLButtonElement>(null);
  const [owner] = useState(currentLearningOwner);
  const draftId = `${draftScope}:${q.id}`;
  const [draft] = useState(() => readDraft(owner, draftId, questionDraftSchema));
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => draft?.answers ?? initialAnswers(q),
  );
  const [hint, setHint] = useState(draft?.hint ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<Grade | undefined>(
    draft?.grade && draft.explanation
      ? { ...draft.grade, explanation: draft.explanation }
      : undefined,
  );
  const [explanation, setExplanation] = useState<Explanation | undefined>(draft?.explanation);
  const [revealed, setRevealed] = useState(draft?.revealed ?? false);
  const [view, setView] = useState<string>(draft?.view ?? 'answer');
  const [methodVisited, setMethodVisited] = useState(draft?.view === 'method');
  const details = view === 'explanation';
  const setDetails = (expanded: boolean) => {
    if (expanded) markHelp();
    setView(expanded ? 'explanation' : 'answer');
  };
  const [usedHint, setUsedHint] = useState(draft?.usedHelp ?? false);
  const helpViewed = useRef(draft?.usedHelp ?? false);
  useAccount();
  useEffect(() => {
    if (owner !== currentLearningOwner()) return;
    writeDraft(owner, draftId, {
      answers,
      hint,
      usedHelp: usedHint,
      revealed,
      view,
      grade: grade ? { correct: grade.correct, feedback: grade.feedback } : undefined,
      explanation,
    });
  }, [owner, draftId, answers, hint, usedHint, revealed, view, grade, explanation]);
  function markHelp() {
    if (!helpViewed.current && !q.sourceIssue) {
      helpViewed.current = true;
      setUsedHint(true);
      recordAssistance(q.id, owner);
      if (grade) onResult?.(grade.correct ? 'correct' : 'incorrect', true);
    }
  }
  async function submit(event?: React.FormEvent, override?: Record<string, string>) {
    event?.preventDefault();
    const submitted = override ?? answers;
    setBusy(true);
    setError('');
    const owner = currentLearningOwner();
    const eventData = makeLearningEvent(
      'attempt',
      q.id,
      submitted,
      q.responseMode === 'selfReview' || revealed || helpViewed.current,
    );
    try {
      const g = await request<Grade>(`/questions/${q.id}/check`, {
        method: 'POST',
        headers: currentAccountHeaders(),
        body: JSON.stringify({
          answers: submitted,
          attemptId: eventData.id,
          occurredAt: eventData.occurredAt,
          assisted: eventData.assisted,
        }),
      });
      setGrade(g);
      setExplanation(g.explanation);
      if (q.responseMode === 'selfReview') setDetails(false);
      recordAnswer(q.id, g.correct, eventData.assisted, eventData, owner);
      onAttempt?.(q.id);
      onResult?.(g.correct ? 'correct' : 'incorrect', eventData.assisted || helpViewed.current);
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
      setView('explanation');
      markHelp();
      onAttempt?.(q.id);
      onResult?.('revealed', true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const Heading = standalone ? 'h1' : headingLevel === 2 ? 'h2' : 'h3';
  const repeatsTitle =
    q.stem
      .replace(/^计算[：:]\s*/, '')
      .replace(/[。.]$/, '')
      .trim() === q.title.trim();
  const titleIsStemPreview = q.title.endsWith('…') && q.stem.startsWith(q.title.slice(0, -1));
  const compactEquation = repeatsTitle && /^[\d\s+＋\-－×xX*÷/＝=()（）□？?·.]+$/.test(q.title);
  return (
    <article className="question-runner">
      <SplitWorkspace
        focusSecondary={view === 'method'}
        primary={
          <section className="question-reading pane-scroll" aria-label="题目内容" tabIndex={0}>
            <div className="pane-label">
              <Icon name="NotebookPen" size={17} /> 题目
            </div>

            <div className="question-meta">
              <span className={`chip difficulty-${q.difficulty}`}>
                {difficultyLabels[q.difficulty]}
              </span>
              <span className="chip neutral">{typeLabels[q.type]}</span>
              {q.hasVisual && (
                <span className="visual-tag">
                  <Icon name="Shapes" size={15} />
                  分步图解
                </span>
              )}
            </div>
            <Heading
              className={
                titleIsStemPreview
                  ? 'sr-only'
                  : compactEquation
                    ? 'question-equation-title'
                    : repeatsTitle
                      ? 'question-stem-title'
                      : undefined
              }
            >
              {q.title}
            </Heading>
            {!repeatsTitle && <p className="question-stem">{q.stem}</p>}
            {(view === 'method' || view === 'explanation') && q.options && (
              <QuestionReferenceChoices options={q.options} />
            )}
            {q.promptImage && (
              <img className="question-diagram" src={q.promptImage.src} alt={q.promptImage.alt} />
            )}
            {q.figure && <GridFigureView figure={q.figure} />}
          </section>
        }
        secondary={
          <Tabs
            className="answer-workspace"
            activationMode="manual"
            value={view}
            onValueChange={(value) => {
              if (value === 'method') setMethodVisited(true);
              if (value === 'method' || value === 'explanation') markHelp();
              setView(value);
            }}
          >
            <div className="answer-tabbar">
              <TabsList aria-label="作答、方法与解析">
                <TabsTrigger ref={answerTrigger} value="answer">
                  作答
                </TabsTrigger>
                {method?.guide && <TabsTrigger value="method">方法</TabsTrigger>}
                <TabsTrigger value="explanation" disabled={!explanation}>
                  思路
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="answer"
              forceMount
              hidden={view !== 'answer'}
              className="answer-tab-content"
            >
              <form id={formId} onSubmit={submit} className="question-answer-form">
                <div className="answer-body pane-scroll">
                  {(q.options || q.construction) && (
                    <h3 className="answer-label">{q.construction ? '在方格上作图' : '选择答案'}</h3>
                  )}

                  {q.sourceIssue ? (
                    <p>{q.sourceIssue}</p>
                  ) : q.responseMode === 'selfReview' ? (
                    <p>先在草稿纸上完成，再核对解答。</p>
                  ) : q.construction ? (
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
                        <label
                          className={answers.value === String(i) ? 'selected' : ''}
                          key={option}
                        >
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
                      {q.fields
                        .filter((f) => f.fixedValue === undefined)
                        .map((f) => (
                          <label key={f.key}>
                            {f.label}
                            <span>
                              <Input
                                required
                                inputMode={f.inputMode ?? 'numeric'}
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
                    <div
                      className={`grade-feedback ${grade.correct ? 'correct' : 'incorrect'}`}
                      role="status"
                    >
                      <Icon name={grade.correct ? 'CheckCircle2' : 'CircleHelp'} />
                      <span>{grade.feedback}</span>
                    </div>
                  )}

                  {explanation && (
                    <Button
                      variant="outline"
                      type="button"
                      className="button secondary explanation-open"
                      aria-expanded={false}
                      onClick={() => setDetails(true)}
                    >
                      展开解析 <Icon name="ArrowRight" size={16} />
                    </Button>
                  )}
                </div>
                <div className="question-actions">
                  {!q.sourceIssue && q.responseMode !== 'selfReview' && (
                    <Button
                      variant="default"
                      className="button primary"
                      type="submit"
                      disabled={busy}
                    >
                      {busy ? '正在核对…' : '核对答案'}
                      <Icon name="Check" size={17} />
                    </Button>
                  )}
                  {q.sourceIssue
                    ? !explanation && (
                        <Button
                          variant="outline"
                          className="button secondary"
                          type="button"
                          disabled={busy}
                          onClick={reveal}
                        >
                          查看解题方法
                        </Button>
                      )
                    : q.responseMode === 'selfReview' &&
                      (explanation ? (
                        <>
                          <Button
                            variant="default"
                            className="button primary"
                            type="button"
                            disabled={busy}
                            onClick={() => void submit(undefined, { review: '已核对' })}
                          >
                            我做对了
                          </Button>
                          <Button
                            variant="outline"
                            className="button secondary"
                            type="button"
                            disabled={busy}
                            onClick={() => void submit(undefined, { review: '需要再练' })}
                          >
                            需要再练
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          className="button primary"
                          type="button"
                          disabled={busy}
                          onClick={reveal}
                        >
                          核对解答
                        </Button>
                      ))}
                  {!q.sourceIssue && (
                    <Button
                      variant="ghost"
                      type="button"
                      className="button subtle"
                      aria-expanded={hint}
                      onClick={() => {
                        if (!hint) markHelp();
                        setHint(!hint);
                      }}
                    >
                      <Icon name="Lightbulb" size={17} />
                      {hint ? '收起提示' : '提示'}
                    </Button>
                  )}
                  {!explanation && q.responseMode !== 'selfReview' && (
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
            </TabsContent>
            {method?.guide && methodVisited && (
              <TabsContent
                value="method"
                forceMount
                hidden={view !== 'method'}
                className="method-tab-content pane-scroll"
                tabIndex={0}
              >
                <p className="method-assistance-note">本题已使用方法辅助</p>
                <TopicMethod
                  topicId={method.id}
                  questionId={q.id}
                  title={method.title}
                  guide={method.guide}
                  active={view === 'method'}
                  onReturnToAnswer={() => {
                    setView('answer');
                    window.setTimeout(() => answerTrigger.current?.focus(), 0);
                  }}
                  questionReference={{
                    stem: q.stem,
                    options: q.options,
                    figure:
                      q.promptImage || q.figure ? (
                        <>
                          {q.promptImage && (
                            <img
                              className="question-diagram"
                              src={q.promptImage.src}
                              alt={q.promptImage.alt}
                            />
                          )}
                          {q.figure && <GridFigureView figure={q.figure} />}
                        </>
                      ) : undefined,
                  }}
                />
              </TabsContent>
            )}
            <TabsContent
              value="explanation"
              forceMount
              hidden={!details}
              className="explanation-tab-content pane-scroll"
              tabIndex={0}
            >
              {explanation && (
                <section className="answer-explanation">
                  <div className="explanation-summary">
                    <h3>解题思路</h3>
                    <Button
                      variant="ghost"
                      className="button subtle"
                      aria-expanded={true}
                      onClick={() => setDetails(false)}
                    >
                      收起解析
                    </Button>
                  </div>
                  {!explanation.steps.includes(explanation.analysis) && (
                    <p className="explanation-analysis">{explanation.analysis}</p>
                  )}
                  <div className="explanation-details">
                    <Button
                      variant="outline"
                      className="button secondary"
                      onClick={() => {
                        setAnswers(initialAnswers(q));
                        setHint(false);
                        setUsedHint(false);
                        helpViewed.current = false;
                        setGrade(undefined);
                        setExplanation(undefined);
                        setRevealed(false);
                        setError('');
                        setDetails(false);
                      }}
                    >
                      重做
                      <Icon name="RotateCcw" size={17} />
                    </Button>
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
                </section>
              )}
            </TabsContent>
            {details && explanation && q.responseMode === 'selfReview' && !q.sourceIssue && (
              <div className="question-actions">
                <Button
                  disabled={busy}
                  onClick={() => void submit(undefined, { review: '已核对' })}
                >
                  我做对了
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void submit(undefined, { review: '需要再练' })}
                >
                  需要再练
                </Button>
                {error && (
                  <p className="inline-error" role="alert">
                    {error} 请重试。
                  </p>
                )}
              </div>
            )}
          </Tabs>
        }
      />
    </article>
  );
}
