import type { TopicGuide, UnitTeaching } from '@mathstudy/contracts';
import { Icon } from './ui';
import { methodStory } from '@mathstudy/animation-engine';
import MethodDemonstration from './MethodDemonstration';
import { Popover } from 'radix-ui';
import { Button } from './ui/button';

export function UnitMethodMap({ unit }: { unit: UnitTeaching }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="outline" aria-label="知识联系与单元自查">
          <Icon name="Blocks" size={18} />
          单元联系
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="method-notes-body pane-scroll"
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-label="单元方法图谱"
        >
          <h3 className="method-notes-title">
            单元联系
            <Popover.Close asChild>
              <Button variant="ghost" aria-label="关闭单元联系">
                <Icon name="X" size={18} />
              </Button>
            </Popover.Close>
          </h3>
          <p>{unit.goal}</p>
          <div className="unit-method-columns">
            <div>
              <h3>把知识连起来</h3>
              <ul>
                {unit.connections.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>学完能做到</h3>
              <ul>
                {unit.selfCheck.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** A worked example teaches the method, independently of the current question's answer. */
export default function TopicMethod({
  topicId,
  title,
  guide,
  active = true,
  questionId,
}: {
  topicId: string;
  title: string;
  guide: TopicGuide;
  active?: boolean;
  questionId?: string;
}) {
  const story = methodStory(topicId, questionId);
  return (
    <Popover.Root>
      <section className="topic-method" aria-label={`${title}方法卡`}>
        <header className="method-heading">
          <div className="method-heading-top">
            <h3>{title}</h3>
            <Popover.Trigger asChild>
              <Button variant="ghost" aria-label="方法要点与自查">
                <Icon name="BookOpen" size={18} />
                要点
              </Button>
            </Popover.Trigger>
          </div>
          <p>
            <span className="method-example-label">例题</span>
            {story?.prompt ?? guide.recognize}
          </p>
        </header>
        <MethodDemonstration
          key={`${topicId}:${questionId ?? ''}`}
          topicId={topicId}
          questionId={questionId}
          title={title}
          active={active}
        />
        <Popover.Portal>
          <Popover.Content
            className="method-notes-body pane-scroll"
            side="bottom"
            align="end"
            sideOffset={8}
            collisionPadding={16}
            aria-label="方法要点与自查"
          >
            <h4 className="method-notes-title">
              方法要点
              <Popover.Close asChild>
                <Button variant="ghost" aria-label="关闭方法要点">
                  <Icon name="X" size={18} />
                </Button>
              </Popover.Close>
            </h4>
            <ol className="method-steps">
              {guide.steps.map((step, i) => (
                <li key={step.title}>
                  <span aria-hidden="true">{i + 1}</span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            {!story && (
              <details className="method-example">
                <summary>
                  <Icon name="BookOpen" size={17} />
                  看一道例题
                  <Icon name="ChevronDown" size={16} />
                </summary>
                <p className="method-example-prompt">{guide.example.prompt}</p>
                <ol>
                  {guide.example.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="method-example-answer">{guide.example.answer}</p>
              </details>
            )}
            <div className="method-pitfall">
              <Icon name="Flag" size={17} />
              <p>
                <b>容易错在</b>
                {guide.pitfall}
              </p>
            </div>
            <div className="method-self-check">
              <Icon name="CheckCircle2" size={17} />
              <p>
                <b>做完检查</b>
                {guide.selfCheck}
              </p>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </section>
    </Popover.Root>
  );
}
