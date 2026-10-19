-- Published payloads are isolated by release so an earlier Worker can still roll back.
CREATE TABLE released_lessons (
  release_id TEXT NOT NULL REFERENCES content_releases(id),
  lesson_id TEXT NOT NULL,
  body_json TEXT NOT NULL CHECK(json_valid(body_json)),
  PRIMARY KEY (release_id, lesson_id)
);
CREATE TABLE released_questions (
  release_id TEXT NOT NULL REFERENCES content_releases(id),
  question_id TEXT NOT NULL,
  body_json TEXT NOT NULL CHECK(json_valid(body_json)),
  PRIMARY KEY (release_id, question_id)
);
