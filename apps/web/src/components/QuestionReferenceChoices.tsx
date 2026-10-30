/** Original question choices for reference only; this surface never owns an answer. */
export default function QuestionReferenceChoices({ options }: { options: readonly string[] }) {
  if (!options.length) return null;
  return (
    <ol className="question-reference-choices" aria-label="题目选项" type="A">
      {options.map((option, index) => (
        <li key={`${index}:${option}`}>{option}</li>
      ))}
    </ol>
  );
}
