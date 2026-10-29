import { useEffect, useRef, useState } from 'react';
import { methodStory } from '@mathstudy/animation-engine';
import { Dialog } from 'radix-ui';
import { Button } from './ui/button';
import { Icon } from './ui';
import MethodDiagram from './MethodDiagram';

export default function MethodDemonstration({
  topicId,
  title,
  active = true,
  questionId,
}: {
  topicId: string;
  title: string;
  active?: boolean;
  questionId?: string;
}) {
  const story = methodStory(topicId, questionId);
  const [step, setStep] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [choice, setChoice] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setStep(0);
    setMistake(false);
    setTransfer(false);
    setChoice(undefined);
    setPlaying(false);
    setExpanded(false);
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
    setPlaying(false);
  };
  // TopicMethod is keyed by topic ID: the current step and mistake answer reset on topic change.
  const check = transfer && story.transfer ? story.transfer : story.mistake;
  const content = (inDialog: boolean) => (
    <div className={`method-demonstration ${expanded ? 'is-expanded' : ''}`}>
      <div className="demo-topline">
        <p className="demo-mode">
          {mistake ? (transfer ? '例题自查' : '易错对照') : '分步图解'}
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
        <Button
          ref={inDialog ? undefined : expandTrigger}
          variant="ghost"
          size="sm"
          className="method-expand-trigger"
          aria-label={inDialog ? '收起演示' : '放大演示'}
          aria-haspopup={inDialog ? undefined : 'dialog'}
          onClick={() => {
            setPlaying(false);
            setExpanded(!expanded);
          }}
        >
          <Icon name={inDialog ? 'X' : 'MoveUpRight'} size={19} />
          {inDialog ? '收起' : '放大'}
        </Button>
      </div>
      <div className={`demo-stage pane-scroll ${mistake ? 'is-mistake' : ''}`}>
        <div className="demo-visual">
          <MethodDiagram
            nodes={mistake ? check.nodes : current.nodes}
            label={mistake ? check.question : current.title}
          />
          <div className="diagram-key" aria-label="图例">
            <span className="key-known">已知</span>
            <span className="key-focus">本步</span>
            {mistake && <span className="key-error">错误 / 不计入</span>}
            <small>示意图，数量看标注</small>
          </div>
        </div>
        <div className="demo-reason" aria-live="polite" aria-atomic="true">
          <h4>{mistake ? check.question : current.title}</h4>
          {mistake ? (
            <>
              <div className="mistake-options" role="group" aria-label="易错判断">
                {/* Position alternates deterministically: the right answer is not always the second choice. */}
                {(topicId.length % 2 ? [check.right, check.wrong] : [check.wrong, check.right]).map(
                  (option) => (
                    <Button
                      type="button"
                      variant="outline"
                      key={option}
                      className={choice === option ? 'is-picked' : ''}
                      aria-pressed={choice === option}
                      onClick={() => setChoice(option)}
                    >
                      {option}
                    </Button>
                  ),
                )}
              </div>
              {choice && (
                <div
                  className={`mistake-feedback ${choice === check.right ? 'is-correct' : 'try-again'}`}
                  role="status"
                >
                  <strong>
                    {choice === check.right ? '对，关键就在这里' : '再看图，换个角度想'}
                  </strong>
                  <p>{check.why}</p>
                  {choice !== check.right && <p>正确的想法：{check.right}</p>}
                </div>
              )}
              {choice && story.transfer && !transfer && (
                <div className="method-transfer">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTransfer(true);
                      setChoice(undefined);
                    }}
                  >
                    换一组数试试
                    <Icon name="ArrowRight" size={18} />
                  </Button>
                </div>
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
          variant={mistake ? 'outline' : 'default'}
          onClick={() => {
            setPlaying(false);
            if (mistake) {
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
          {mistake ? '重看图解' : step === story.frames.length - 1 ? '易错对照' : '下一步'}
          <Icon name={mistake ? 'RotateCcw' : 'ArrowRight'} size={18} />
        </Button>
      </div>
    </div>
  );
  return (
    <div className="method-demo-shell">
      <div className="method-inline" hidden={expanded}>
        {content(false)}
      </div>
      <Dialog.Root
        open={expanded}
        onOpenChange={(open) => {
          setExpanded(open);
          setPlaying(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="method-dialog-overlay" />
          <Dialog.Content
            className="method-dialog"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              window.setTimeout(() => expandTrigger.current?.focus(), 0);
            }}
          >
            <Dialog.Title className="method-dialog-title">{title}</Dialog.Title>
            <Dialog.Description className="method-dialog-prompt">{story.prompt}</Dialog.Description>
            {expanded && content(true)}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
