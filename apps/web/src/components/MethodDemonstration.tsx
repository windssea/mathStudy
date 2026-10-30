import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { methodStory, methodQuestionSubskills } from '@mathstudy/animation-engine';
import { Dialog } from 'radix-ui';
import { Button } from './ui/button';
import { Icon } from './ui';
import MethodDiagram from './MethodDiagram';

export interface MethodQuestionReference {
  stem: string;
  figure?: ReactNode;
}

export default function MethodDemonstration({
  topicId,
  title,
  active = true,
  questionId,
  questionReference,
  onReturnToAnswer,
  notes,
}: {
  topicId: string;
  title: string;
  active?: boolean;
  questionId?: string;
  questionReference?: MethodQuestionReference;
  onReturnToAnswer?: () => void;
  notes?: ReactNode;
}) {
  const story = methodStory(topicId, questionId);
  const exampleLabel =
    questionId && methodQuestionSubskills[topicId]?.[questionId] ? '同类例题' : '例题';
  const questionLabel = useId();
  const [step, setStep] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [choice, setChoice] = useState<string>();
  const [showError, setShowError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [compact, setCompact] = useState(false);
  const [supportView, setSupportView] = useState<'diagram' | 'question' | 'notes'>('diagram');
  const shell = useRef<HTMLDivElement>(null);
  const hasQuestionReference = !!questionReference;
  const expandTrigger = useRef<HTMLButtonElement>(null);
  const inlineReviewFocus = useRef<HTMLButtonElement>(null);
  const dialogReviewFocus = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = shell.current;
    if (!element || !active || !hasQuestionReference) return;
    const observer = new ResizeObserver(() => {
      const width = element.getBoundingClientRect().width;
      if (width <= 0) return;
      // Keep the close action stable once focus mode opens. A later narrow resize
      // still needs to return to the answer instead of reopening an unreadable pane.
      if (expanded) {
        if (width < 620) setCompact(true);
        return;
      }
      const stage = element.querySelector('.method-inline .demo-stage')?.getBoundingClientRect();
      const drawing = element
        .querySelector('.method-inline .method-diagram')
        ?.getBoundingClientRect();
      const shortStage = !!stage && stage.height > 0 && stage.height < 280;
      const smallDrawing =
        !!drawing &&
        drawing.width > 0 &&
        drawing.height > 0 &&
        Math.min(drawing.width, drawing.height * 1.6) < 320;
      const needsSpace = width < 620 || shortStage || smallDrawing;
      setCompact(needsSpace);
      if (needsSpace) setExpanded(true);
    });
    observer.observe(element);
    if (!expanded) {
      for (const child of element.querySelectorAll(
        '.method-inline .demo-stage, .method-inline .method-diagram',
      ))
        observer.observe(child);
    }
    return () => observer.disconnect();
  }, [active, hasQuestionReference, expanded, step, mistake, transfer, choice, showError]);
  useEffect(() => {
    if (mistake && active) (expanded ? dialogReviewFocus : inlineReviewFocus).current?.focus();
  }, [choice, transfer, expanded, mistake, active]);
  useEffect(() => {
    setStep(0);
    setMistake(false);
    setTransfer(false);
    setChoice(undefined);
    setShowError(false);
    setPlaying(false);
    setExpanded(false);
    setSupportView('diagram');
  }, [topicId, questionId]);
  useEffect(() => {
    if (!active) {
      setPlaying(false);
      setExpanded(false);
    }
  }, [active]);
  useEffect(() => {
    if (!playing || !story) return;
    const timer = window.setTimeout(() => {
      if (step >= story.frames.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [playing, step, story]);
  if (!story) return null;
  const current = story.frames[Math.min(step, story.frames.length - 1)];
  const go = (n: number) => {
    setStep(n);
    setMistake(false);
    setTransfer(false);
    setShowError(false);
    setPlaying(false);
  };
  // TopicMethod is keyed by topic ID: the current step and mistake answer reset on topic change.
  const check = transfer && story.transfer ? story.transfer : story.mistake;
  const showingWrong = mistake && !!choice && showError && !!check.wrongNodes;
  const closeExpanded = () => {
    setExpanded(false);
    setPlaying(false);
    setSupportView('diagram');
    if (compact) onReturnToAnswer?.();
  };
  const content = (inDialog: boolean) => (
    <div className={`method-demonstration ${expanded ? 'is-expanded' : ''}`}>
      {(!mistake || choice) && (
        <p className="method-active-prompt">
          <span className="method-example-label">
            {mistake ? (transfer ? '换数自查' : '易错判断') : exampleLabel}
          </span>
          {mistake ? check.question : story.prompt}
        </p>
      )}
      <div className="demo-topline">
        <p className="demo-mode">
          {mistake ? (transfer ? '换数自查' : '易错对照') : '分步图解'}
          <span>{mistake ? '先选，再看原因' : `${step + 1} / ${story.frames.length}`}</span>
        </p>
        <div className="demo-step-nav" aria-label="演示步骤">
          {story.frames.map((f, i) => (
            <button
              type="button"
              key={f.title}
              aria-label={`第${i + 1}步：${f.title}`}
              aria-current={!mistake && i === step ? 'step' : undefined}
              onClick={() => go(i)}
            >
              <span>{i + 1}</span>
              <span>{f.title}</span>
            </button>
          ))}
        </div>
        {!inDialog && (
          <Button
            ref={expandTrigger}
            variant="ghost"
            size="sm"
            className="method-expand-trigger"
            aria-label="放大演示"
            aria-haspopup="dialog"
            onClick={() => {
              setPlaying(false);
              setExpanded(true);
            }}
          >
            <Icon name="MoveUpRight" size={19} />
            放大
          </Button>
        )}
      </div>
      <div className={`demo-stage pane-scroll ${mistake ? 'is-mistake' : ''}`}>
        <div className="demo-visual">
          {mistake && !choice ? (
            <div className="demo-check-question">
              <p id={`${questionLabel}-${inDialog ? 'dialog' : 'inline'}`}>{check.question}</p>
              <span>选好后，看图核对</span>
            </div>
          ) : (
            <MethodDiagram
              nodes={mistake ? (showingWrong ? check.wrongNodes! : check.nodes) : current.nodes}
              label={
                mistake ? `${showingWrong ? '错误示范：' : ''}${check.question}` : current.title
              }
            />
          )}
          {(!mistake || choice) && (
            <div className="diagram-key" aria-label="图例">
              {mistake && choice && check.wrongNodes && (
                <strong className={showingWrong ? 'key-error' : 'key-focus'}>
                  {showingWrong ? '错误示范' : '订正后的图'}
                </strong>
              )}
              <span className="key-known">已知</span>
              <span className="key-focus">本步</span>
              {mistake && <span className="key-error">错误 / 不计入</span>}
              <small>示意图，数量看标注</small>
            </div>
          )}
        </div>
        <div className="demo-reason" aria-live="polite" aria-atomic="true">
          {(!mistake || !choice) && <h4>{mistake ? '哪一种想法对？' : current.title}</h4>}
          {mistake ? (
            <>
              {!choice ? (
                <div
                  className="mistake-options"
                  role="group"
                  aria-label="易错判断"
                  aria-describedby={`${questionLabel}-${inDialog ? 'dialog' : 'inline'}`}
                >
                  {/* Position alternates deterministically: the right answer is not always the second choice. */}
                  {(topicId.length % 2
                    ? [check.right, check.wrong]
                    : [check.wrong, check.right]
                  ).map((option, optionIndex) => (
                    <Button
                      ref={
                        optionIndex === 0
                          ? inDialog
                            ? dialogReviewFocus
                            : inlineReviewFocus
                          : undefined
                      }
                      type="button"
                      variant="outline"
                      key={option}
                      className={choice === option ? 'is-picked' : ''}
                      aria-pressed={choice === option}
                      onClick={() => {
                        setChoice(option);
                        setShowError(option === check.wrong);
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <>
                  <div
                    className={`mistake-feedback ${choice === check.right ? 'is-correct' : 'try-again'}`}
                    role="status"
                  >
                    <strong>{choice === check.right ? '判断正确' : '看图找原因'}</strong>
                    <p>{check.why}</p>
                    <span className="sr-only">你选了：{choice}</span>
                  </div>
                  <div className="mistake-choice-summary">
                    <Button
                      ref={
                        check.wrongNodes
                          ? undefined
                          : inDialog
                            ? dialogReviewFocus
                            : inlineReviewFocus
                      }
                      variant="ghost"
                      onClick={() => {
                        setChoice(undefined);
                        setShowError(false);
                      }}
                    >
                      重选
                    </Button>
                    {check.wrongNodes && (
                      <Button
                        ref={inDialog ? dialogReviewFocus : inlineReviewFocus}
                        className="method-correction-toggle"
                        variant="outline"
                        aria-pressed={!showingWrong}
                        onClick={() => setShowError(!showingWrong)}
                      >
                        <Icon name={showingWrong ? 'ArrowRight' : 'RotateCcw'} size={18} />
                        {showingWrong ? '看图订正' : '对照错法'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p>{current.why}</p>
              <div className="demo-equation">{current.equation}</div>
            </>
          )}
        </div>
      </div>
      <div className="method-transport">
        <Button
          variant="outline"
          disabled={step === 0 && !mistake}
          onClick={() =>
            mistake ? (setMistake(false), setTransfer(false), setChoice(undefined)) : go(step - 1)
          }
        >
          <Icon name="ArrowLeft" size={18} />
          上一步
        </Button>
        <Button
          variant="ghost"
          className="demo-play"
          aria-label={playing ? '暂停演示' : '播放演示'}
          onClick={() => {
            setMistake(false);
            setTransfer(false);
            setChoice(undefined);
            if (!playing && step === story.frames.length - 1) setStep(0);
            setPlaying(!playing);
          }}
        >
          <Icon name={playing ? 'Pause' : 'Play'} size={18} />
          {playing ? '暂停' : '播放'}
        </Button>
        <Button
          variant={mistake && !(choice && story.transfer && !transfer) ? 'outline' : 'default'}
          onClick={() => {
            setPlaying(false);
            if (mistake && choice && story.transfer && !transfer) {
              setTransfer(true);
              setChoice(undefined);
              setShowError(false);
            } else if (mistake) {
              go(0);
              setChoice(undefined);
            } else if (step < story.frames.length - 1) go(step + 1);
            else {
              setMistake(true);
              setTransfer(false);
              setChoice(undefined);
            }
          }}
        >
          {mistake
            ? choice && story.transfer && !transfer
              ? '换一组数试试'
              : '重看图解'
            : step === story.frames.length - 1
              ? '易错对照'
              : '下一步'}
          <Icon name={mistake ? 'RotateCcw' : 'ArrowRight'} size={18} />
        </Button>
      </div>
    </div>
  );
  return (
    <div ref={shell} className="method-demo-shell">
      <div className="method-inline" hidden={expanded}>
        {content(false)}
      </div>
      <Dialog.Root
        open={expanded}
        onOpenChange={(open) => {
          if (!open) closeExpanded();
          else {
            setExpanded(true);
            setPlaying(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="method-dialog-overlay" />
          <Dialog.Content
            className="method-dialog"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!compact) window.setTimeout(() => expandTrigger.current?.focus(), 0);
            }}
          >
            <div className="method-dialog-heading">
              <Dialog.Title className="method-dialog-title">{title}</Dialog.Title>
              <Button
                variant="ghost"
                onClick={closeExpanded}
                aria-label={compact ? '返回作答' : '收起演示'}
              >
                <Icon name="X" size={18} />
                {compact ? '返回作答' : '收起'}
              </Button>
            </div>
            {(questionReference || notes) && (
              <div className="method-dialog-tools" role="group" aria-label="学习内容">
                {(
                  [
                    ['diagram', '分步图解', true],
                    ['question', '查看当前题目', !!questionReference],
                    ['notes', '方法要点与自查', !!notes],
                  ] as const
                )
                  .filter((item) => item[2])
                  .map(([view, label]) => (
                    <Button
                      key={view}
                      variant="outline"
                      aria-pressed={supportView === view}
                      onClick={() => {
                        setSupportView(view);
                        setPlaying(false);
                      }}
                    >
                      {label}
                    </Button>
                  ))}
              </div>
            )}
            <div className="method-dialog-diagram" hidden={supportView !== 'diagram'}>
              {expanded && content(true)}
            </div>
            {supportView === 'question' && questionReference && (
              <section
                className={`method-question-support ${questionReference.figure ? '' : 'is-text-only'}`}
                aria-label="当前题目参照"
              >
                <p>{questionReference.stem}</p>
                {questionReference.figure && (
                  <div className="method-reference-figure">{questionReference.figure}</div>
                )}
              </section>
            )}
            {supportView === 'notes' && (
              <section className="method-dialog-notes pane-scroll" aria-label="方法要点与自查">
                {notes}
              </section>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
