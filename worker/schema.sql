-- Additive/idempotent initialization. Never resets existing results.
CREATE TABLE IF NOT EXISTS match_marks (
 match_id INTEGER PRIMARY KEY CHECK(match_id BETWEEN 1 AND 12),
 played INTEGER NOT NULL DEFAULT 0 CHECK(played IN (0,1)),
 score TEXT NOT NULL DEFAULT '' CHECK(length(score) <= 8),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS board_revision (
 id INTEGER PRIMARY KEY CHECK(id = 1), version INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO board_revision(id, version) VALUES(1, 0);
INSERT OR IGNORE INTO match_marks(match_id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12);
