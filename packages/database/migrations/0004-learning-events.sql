CREATE TABLE learning_events (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  edition_id TEXT NOT NULL REFERENCES textbook_editions(id),
  entity_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('visit','complete','attempt','assist','legacy')),
  occurred_at TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(user_id,id)
);
CREATE INDEX learning_events_user_edition_time_idx ON learning_events(user_id,edition_id,occurred_at,id);
