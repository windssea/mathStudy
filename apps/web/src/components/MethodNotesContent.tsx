import type { TopicGuide } from '@mathstudy/contracts';
import type { MethodStory } from '@mathstudy/animation-engine';
import { Icon } from './ui';

/** The compact popover and focus view share the same, question-matched explanation. */
export default function MethodNotesContent({
  guide,
  story,
}: {
  guide: TopicGuide;
  story?: MethodStory;
}) {
  const steps =
    story?.frames.map((frame) => ({ title: frame.title, detail: frame.why })) ?? guide.steps;
  return (
    <div className="method-notes-layout">
      <ol className="method-steps">
        {steps.map((step, i) => (
          <li key={step.title}>
            <span aria-hidden="true">{i + 1}</span>
            <div>
              <h4>{step.title}</h4>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="method-notes-checks">
        {!story && (
          <details className="method-example">
            <summary>
              <Icon name="BookOpen" size={17} />
              看一道例题
            </summary>
            <p>{guide.example.prompt}</p>
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
            {story?.mistake.why ?? guide.pitfall}
          </p>
        </div>
        <div className="method-self-check">
          <Icon name="CheckCircle2" size={17} />
          <p>
            <b>{story?.transfer ? '再想一题' : '做完检查'}</b>
            {story?.transfer?.question ?? guide.selfCheck}
          </p>
        </div>
      </div>
    </div>
  );
}
