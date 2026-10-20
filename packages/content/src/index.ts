import { lessonSchema, releaseId, type Textbook, type QuestionPublic } from '@mathstudy/contracts';
import catalog from '../../../content/textbooks/sj-math-g4-upper-2026-v1/catalog.json';
import lessonData from '../../../content/textbooks/sj-math-g4-upper-2026-v1/lessons.json';
import unit2Data from '../../../content/textbooks/sj-math-g4-upper-2026-v1/unit2-lessons.json';
import unit3Data from '../../../content/textbooks/sj-math-g4-upper-2026-v1/unit3-lessons.json';
import unit4Data from '../../../content/textbooks/sj-math-g4-upper-2026-v1/unit4-lessons.json';
import unit5Data from '../../../content/textbooks/sj-math-g4-upper-2026-v1/unit5-lessons.json';
import { questions } from './questions';
import { buildPracticeCatalog } from './practice';
export const practice = buildPracticeCatalog(questions);

export const lessons = [...lessonData, ...unit2Data, ...unit3Data, ...unit4Data, ...unit5Data].map(
  (lesson) => lessonSchema.parse(lesson),
);
const byId = new Map(lessons.map((l) => [l.id, l]));
export const textbook: Textbook = {
  ...catalog,
  releaseId,
  catalog: catalog.catalog.map((node) => ({
    ...node,
    kind: node.kind as Textbook['catalog'][number]['kind'],
    printedRange: node.printedRange as [number, number],
    pdfRange: node.pdfRange as [number, number],
    lessons: node.lessons.map((summary) => ({
      ...summary,
      ...(byId.has(summary.id)
        ? { summary: byId.get(summary.id)!.summary, minutes: byId.get(summary.id)!.minutes }
        : {}),
      pages: summary.pages as [number, number],
      available: byId.has(summary.id),
    })),
  })),
};
export { questions };
export function publicQuestion(question: (typeof questions)[number]): QuestionPublic {
  const {
    expected: _expected,
    explanation: _explanation,
    answerRules: _answerRules,
    ...safe
  } = question;
  return safe;
}
export const siteSettings = { defaultEditionId: textbook.id };
