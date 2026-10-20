import { textbook, lessons, questions, practice } from '@mathstudy/content';
import { lessonSchema, visualSchema } from '@mathstudy/contracts';
import {
  arithmeticScenes,
  calculationFrames,
  countingFrames,
  readingFrames,
  approximationFrames,
} from '@mathstudy/animation-engine';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import coverage from '../content/practice/coverage.json';

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
  if (question.promptImage && !existsSync(`apps/web/public${question.promptImage.src}`))
    issues.push(`Missing prompt figure: ${question.id}`);
  for (const stage of question.explanation.visual?.stages ?? [])
    if (stage.kind === 'image' && (!stage.image || !existsSync(`apps/web/public${stage.image}`)))
      issues.push(`Missing diagram stage: ${question.id}`);
}
for (const lesson of lessons) {
  const demo = lesson.demo;
  if (!lessonSchema.safeParse(lesson).success) issues.push(`Invalid lesson: ${lesson.id}`);
  if ('initialNumber' in demo) {
    try {
      if (demo.kind === 'countingUnits' || demo.kind === 'decimalSystem')
        countingFrames(demo.initialNumber, demo.kind === 'decimalSystem' ? 4 : 0);
      else if (demo.kind === 'roundingNumbers') approximationFrames(demo.initialNumber, 4, 'round');
      else readingFrames(demo.initialNumber);
    } catch {
      issues.push(`Invalid large number demo: ${lesson.id}`);
    }
  }
  if (
    'exampleId' in demo &&
    !arithmeticScenes.some((scene) => scene.id === demo.exampleId && scene.kind === demo.kind)
  )
    issues.push(`Missing arithmetic scene: ${lesson.id}`);
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
for (const scene of arithmeticScenes) {
  try {
    const frames = calculationFrames(scene.expression);
    const result = frames.at(-1)!.root;
    if (result.kind !== 'number') issues.push(`Incomplete expression: ${scene.id}`);
    for (const choice of scene.problem?.choices.filter((choice) => choice.valid) ?? []) {
      const alternative = calculationFrames(choice.expression).at(-1)!.root;
      if (
        alternative.kind !== 'number' ||
        result.kind !== 'number' ||
        alternative.value !== result.value
      )
        issues.push(`Invalid alternative: ${scene.id}`);
    }
    if (
      scene.problem &&
      scene.problem.parts.reduce((sum, part) => sum + part.value, 0) !== scene.problem.total
    )
      issues.push(`Quantity bar mismatch: ${scene.id}`);
  } catch {
    issues.push(`Invalid arithmetic scene: ${scene.id}`);
  }
}
for (const summary of textbook.catalog.flatMap((n) => n.lessons))
  if (summary.available !== lessons.some((l) => l.id === summary.id))
    issues.push(`Invalid availability: ${summary.id}`);
for (const topic of practice.topics) {
  if (!topic.questionIds.length) issues.push(`Empty topic: ${topic.id}`);
  for (const id of topic.questionIds)
    if (questions.find((q) => q.id === id)?.unitId !== topic.unitId)
      issues.push(`Wrong topic unit: ${id}`);
}
for (const paper of practice.papers) {
  const inventory = coverage.find((item) => item.paperId === paper.id);
  const actual = paper.questionIds.map(
    (id) =>
      questions.find((q) => q.id === id)!.sources!.find((s) => s.paperId === paper.id)!.number,
  );
  if (
    !inventory ||
    JSON.stringify([...actual].sort()) !== JSON.stringify([...inventory.expectedNumbers].sort())
  )
    issues.push(`Original question coverage mismatch: ${paper.id}`);
  if (!paper.questionIds.length) issues.push(`Empty paper: ${paper.id}`);
  for (const page of paper.pages)
    if (!existsSync(`apps/web/public${page.image}`)) issues.push(`Missing scan: ${page.image}`);
  for (const id of paper.questionIds) {
    const source = questions.find((q) => q.id === id)?.sources?.find((s) => s.paperId === paper.id);
    if (!source || source.page > paper.pages.length) issues.push(`Invalid paper source: ${id}`);
  }
}
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
    `Content valid: ${textbook.catalog.length} catalog entries, ${lessons.length} open lessons, ${questions.length} questions, ${questions.filter((q) => q.hasVisual).length} visual explanations. ${skipSource ? 'Source PDF hash check explicitly skipped (CI).' : 'Source SHA-256 verified.'}`,
  );
}
