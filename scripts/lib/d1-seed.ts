import { createHash } from 'node:crypto';
import { textbook, lessons, questions, siteSettings } from '@mathstudy/content';

const literal = (value: unknown) => `'${String(value).replaceAll("'", "''")}'`;
export function buildContentSeed() {
  const sourceHash = createHash('sha256')
    .update(JSON.stringify({ textbook, lessons, questions, siteSettings }))
    .digest('hex');
  const manifest = {
    textbook,
    siteSettings,
    lessonCount: lessons.length,
    questionCount: questions.length,
    sourceHash,
  };
  const statements = [
    `INSERT INTO textbook_editions(id,title,edition_label) VALUES (${literal(textbook.id)},${literal(textbook.title)},${literal(textbook.editionLabel)}) ON CONFLICT(id) DO UPDATE SET title=excluded.title,edition_label=excluded.edition_label;`,
    `INSERT INTO content_releases(id,edition_id,manifest_json,status) VALUES (${literal(textbook.releaseId)},${literal(textbook.id)},${literal(JSON.stringify(manifest))},'active') ON CONFLICT(id) DO UPDATE SET manifest_json=excluded.manifest_json,status=excluded.status;`,
    ...lessons.map(
      (lesson) =>
        `INSERT INTO released_lessons(release_id,lesson_id,body_json) VALUES (${literal(textbook.releaseId)},${literal(lesson.id)},${literal(JSON.stringify(lesson))}) ON CONFLICT(release_id,lesson_id) DO UPDATE SET body_json=excluded.body_json;`,
    ),
    ...questions.map(
      (question) =>
        `INSERT INTO released_questions(release_id,question_id,body_json) VALUES (${literal(textbook.releaseId)},${literal(question.id)},${literal(JSON.stringify(question))}) ON CONFLICT(release_id,question_id) DO UPDATE SET body_json=excluded.body_json;`,
    ),
    `INSERT INTO site_settings(key,value_json) VALUES ('defaultEditionId',${literal(JSON.stringify(siteSettings.defaultEditionId))}) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json;`,
    `UPDATE textbook_editions SET active_release_id=${literal(textbook.releaseId)} WHERE id=${literal(textbook.id)};`,
  ];
  return { sql: statements.join('\n'), sourceHash };
}
