import { textbook, lessons, questions } from '@mathstudy/content';
import { lessonSchema, visualSchema } from '@mathstudy/contracts';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const issues: string[] = [];
const ids = new Set<string>();
for (const question of questions) {
  if (ids.has(question.id)) issues.push(`Duplicate question: ${question.id}`);
  ids.add(question.id);
  if (
    question.difficulty === 'challenge' &&
    !visualSchema.safeParse(question.explanation.visual).success
  )
    issues.push(`Missing valid visualization: ${question.id}`);
  if (!question.explanation.analysis || !question.explanation.steps.length)
    issues.push(`Missing explanation: ${question.id}`);
}
for (const lesson of lessons) {
  if (!lessonSchema.safeParse(lesson).success) issues.push(`Invalid lesson: ${lesson.id}`);
  const node = textbook.catalog.find((n) => n.id === lesson.unitId);
  const summary = node?.lessons.find((l) => l.id === lesson.id);
  if (
    !summary?.available ||
    summary.title !== lesson.title ||
    summary.pages.join() !== lesson.pages.join()
  )
    issues.push(`Lesson/catalog mismatch: ${lesson.id}`);
  for (const id of lesson.questionIds) {
    const question = questions.find((q) => q.id === id);
    if (!question) issues.push(`Missing question ${id} in ${lesson.id}`);
    else if (question.unitId !== (lesson.unitId === 'A01' ? 'U02' : lesson.unitId))
      issues.push(`Wrong-unit question ${id} in ${lesson.id}`);
  }
}
for (const summary of textbook.catalog.flatMap((n) => n.lessons))
  if (summary.available !== lessons.some((l) => l.id === summary.id))
    issues.push(`Invalid availability: ${summary.id}`);
const manifest = JSON.parse(readFileSync('doc/specs/textbook-manifest.example.json', 'utf8'));
const skipSource = process.argv.includes('--skip-source');
if (!skipSource) {
  const hash = createHash('sha256')
    .update(readFileSync(manifest.source.sourceLocalPath))
    .digest('hex');
  if (hash !== manifest.source.sha256) issues.push('Source textbook hash mismatch');
}
for (const [i, node] of textbook.catalog.entries()) {
  if (node.id !== manifest.catalog[i].id || node.title !== manifest.catalog[i].title)
    issues.push(`Catalog mismatch: ${node.id}`);
  if (
    node.pdfRange[0] !== node.printedRange[0] + 8 ||
    node.pdfRange[1] !== node.printedRange[1] + 8
  )
    issues.push(`Page mismatch: ${node.id}`);
}
if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Content valid: ${textbook.catalog.length} catalog entries, ${lessons.length} open lessons, ${questions.length} original questions, ${questions.filter((q) => q.hasVisual).length} visual explanations. ${skipSource ? 'Source PDF hash check explicitly skipped (CI).' : 'Source SHA-256 verified.'}`,
  );
}
