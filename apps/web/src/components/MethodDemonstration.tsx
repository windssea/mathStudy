import { useEffect, useState } from 'react';
import { methodStory } from '@mathstudy/animation-engine';
import { Dialog } from 'radix-ui';
import { Button } from './ui/button';
import { Icon } from './ui';
import MethodDiagram from './MethodDiagram';

export default function MethodDemonstration({
  topicId,
  title,
  active = true,
}: {
  topicId: string;
  title: string;
  active?: boolean;
}) {
  const story = methodStory(topicId);
  const [step, setStep] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [choice, setChoice] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
  const current = story.frames[step];
  const go = (n: number) => {
    setStep(n);
    setMistake(false);
    setPlaying(false);
  };
  // TopicMethod is keyed by topic ID: the current step and mistake answer reset on topic change.
  const content = (
    <div className={`method-demonstration ${expanded ? 'is-expanded' : ''}`}>
      <div className="demo-topline">
        <p className="demo-mode">
          {mistake ? '易错对照' : '分步图解'}
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
          variant="ghost"
          size="sm"
          aria-label={expanded ? '收起演示' : '放大演示'}
          onClick={() => {
            setPlaying(false);
            setExpanded(!expanded);
          }}
        >
          <Icon name={expanded ? 'X' : 'MoveUpRight'} size={19} />
          {expanded ? '收起' : '放大'}
        </Button>
      </div>
      <div className={`demo-stage pane-scroll ${mistake ? 'is-mistake' : ''}`}>
        <div className="demo-visual">
          <MethodDiagram
            nodes={mistake ? story.mistake.nodes : current.nodes}
            label={mistake ? story.mistake.question : current.title}
          />
          <div className="diagram-key" aria-label="图例">
            <span className="key-known">已知</span>
            <span className="key-focus">本步</span>
            {mistake && <span className="key-error">错误 / 不计入</span>}
            <small>示意图，数量看标注</small>
          </div>
        </div>
        <div className="demo-reason" aria-live="polite" aria-atomic="true">
          <h4>{mistake ? story.mistake.question : current.title}</h4>
          {mistake ? (
            <>
              <div className="mistake-options" role="group" aria-label="易错判断">
                {/* Position alternates deterministically: the right answer is not always the second choice. */}
                {(topicId.length % 2
                  ? [story.mistake.right, story.mistake.wrong]
                  : [story.mistake.wrong, story.mistake.right]
                ).map((option) => (
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
                ))}
              </div>
              {choice && (
                <div
                  className={`mistake-feedback ${choice === story.mistake.right ? 'is-correct' : 'try-again'}`}
                  role="status"
                >
                  <strong>
                    {choice === story.mistake.right ? '对，关键就在这里' : '再看图，换个角度想'}
                  </strong>
                  <p>{story.mistake.why}</p>
                  {choice !== story.mistake.right && <p>正确的想法：{story.mistake.right}</p>}
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
          onClick={() => (mistake ? (setMistake(false), setChoice(undefined)) : go(step - 1))}
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
    <>
      {!expanded && content}
      <Dialog.Root
        open={expanded}
        onOpenChange={(open) => {
          setExpanded(open);
          setPlaying(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="method-dialog-overlay" />
          <Dialog.Content className="method-dialog" aria-describedby={undefined}>
            <Dialog.Title className="method-dialog-title">{title}</Dialog.Title>
            <Dialog.Description className="method-dialog-prompt">{story.prompt}</Dialog.Description>
            {expanded && content}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
