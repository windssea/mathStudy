import type { PracticeCatalog, Question } from '@mathstudy/contracts';
import paperData from '../../../content/practice/papers.json';
import topicData from '../../../content/practice/topics.json';

const section = (n: string) =>
  n.startsWith('附')
    ? 20
    : /^[一二三四五六七八九十]/.test(n)
      ? '一二三四五六七八九十'.indexOf(n[0]) + 1
      : 0;
export function buildPracticeCatalog(questions: Question[]): PracticeCatalog {
  return {
    topics: topicData.map((topic) => ({
      ...topic,
      questionIds: questions.filter((q) => q.topicIds?.includes(topic.id)).map((q) => q.id),
    })),
    papers: paperData.map((paper) => ({
      ...paper,
      questionIds: questions
        .filter((q) => q.sources?.some((s) => s.paperId === paper.id))
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
