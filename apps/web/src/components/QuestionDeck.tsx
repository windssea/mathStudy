import { useState } from 'react';
import type { QuestionPublic, PracticeTopic } from '@mathstudy/contracts';
import QuestionRunner from './QuestionRunner';

/** Keep visited questions mounted so a jump preserves inputs, hints and grading. */
export default function QuestionDeck({
  items,
  index,
  onAttempt,
  onResult,
  topics = [],
}: {
  items: QuestionPublic[];
  index: number;
  onAttempt?: (id: string) => void;
  topics?: PracticeTopic[];
  onResult?: (id: string, status: 'correct' | 'incorrect' | 'revealed', assisted: boolean) => void;
}) {
  const [visited, setVisited] = useState([index]);
  if (!visited.includes(index)) setVisited([...visited, index]);
  return (
    <div className="question-deck">
      {visited.map(
        (i) =>
          items[i] && (
            <section key={items[i].id} hidden={i !== index} className="question-deck-item">
              <QuestionRunner
                question={items[i]}
                headingLevel={2}
                onAttempt={onAttempt}
                method={topics.find((topic) => items[i].topicIds?.includes(topic.id))}
                onResult={(status, assisted) => onResult?.(items[i].id, status, assisted)}
              />
            </section>
          ),
      )}
    </div>
  );
}
