import type { PracticeCatalog, Question } from '@mathstudy/contracts';
import paperData from '../../../content/practice/papers.json';
import topicData from '../../../content/practice/topics.json';
import teaching from '../../../content/practice/teaching.json';
import { topicGuideSchema, unitTeachingSchema } from '@mathstudy/contracts';

const section = (n: string) =>
  n.startsWith('附')
    ? 20
    : /^[一二三四五六七八九十]/.test(n)
      ? '一二三四五六七八九十'.indexOf(n[0]) + 1
      : 0;
export function practiceQuestions(questions: Question[]) {
  const seen = new Set<string>();
  return questions
    .filter((q) => !q.sourceIssue && (!q.sources?.length || q.id.startsWith('full-')))
    .filter((q) => {
      const key = JSON.stringify([
        q.unitId,
        q.type,
        q.stem,
        q.expected,
        q.fields.map((f) => f.label),
      ]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const rank = { basic: 0, advanced: 1, challenge: 2 };
      return (
        rank[a.difficulty] - rank[b.difficulty] || a.id.localeCompare(b.id, 'en', { numeric: true })
      );
    });
}
export function buildPracticeCatalog(questions: Question[]): PracticeCatalog {
  const bank = practiceQuestions(questions);
  return {
    units: teaching.units.map((unit) => unitTeachingSchema.parse(unit)),
    topics: topicData.map((topic) => ({
      ...topic,
      guide: topicGuideSchema.parse(teaching.topics[topic.id as keyof typeof teaching.topics]),
      questionIds: bank.filter((q) => q.topicIds?.includes(topic.id)).map((q) => q.id),
    })),
    papers: paperData.map((paper) => ({
      ...paper,
      questionIds: questions
        .filter((q) => q.id.startsWith('full-') && q.sources?.some((s) => s.paperId === paper.id))
        .sort((a, b) => {
          const sa = a.sources!.find((s) => s.paperId === paper.id)!,
            sb = b.sources!.find((s) => s.paperId === paper.id)!;
          return (
            sa.page - sb.page ||
            section(sa.number) - section(sb.number) ||
            sa.number.localeCompare(sb.number, 'zh-CN', { numeric: true })
          );
        })
        .map((q) => q.id),
    })),
  };
}
