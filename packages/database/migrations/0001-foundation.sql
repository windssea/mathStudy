-- Foundation for later account-backed content and learning persistence.
-- Current preview serves a versioned, read-only content repository.
PRAGMA foreign_keys = ON;
CREATE TABLE textbook_editions (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, edition_label TEXT NOT NULL,
  active_release_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE content_releases (
  id TEXT PRIMARY KEY, edition_id TEXT NOT NULL REFERENCES textbook_editions(id),
  manifest_json TEXT NOT NULL CHECK(json_valid(manifest_json)),
  status TEXT NOT NULL CHECK(status IN ('draft','active','superseded','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE site_settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL CHECK(json_valid(value_json)));
CREATE TABLE lesson_revisions (
  id TEXT PRIMARY KEY, edition_id TEXT NOT NULL REFERENCES textbook_editions(id),
  lesson_id TEXT NOT NULL, revision_no INTEGER NOT NULL CHECK(revision_no > 0),
  body_json TEXT NOT NULL CHECK(json_valid(body_json)),
  UNIQUE(edition_id, lesson_id, revision_no)
);
CREATE INDEX lesson_edition_idx ON lesson_revisions(edition_id,lesson_id);
