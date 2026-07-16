PRAGMA foreign_keys = ON;

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL CHECK (environment IN ('production', 'staging')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  updated_at TEXT NOT NULL
);

CREATE TABLE deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT NOT NULL UNIQUE,
  service_id TEXT NOT NULL,
  version TEXT NOT NULL CHECK (length(version) BETWEEN 1 AND 64),
  commit_sha TEXT NOT NULL CHECK (length(commit_sha) BETWEEN 7 AND 12),
  result TEXT NOT NULL CHECK (result IN ('succeeded', 'failed', 'rolled_back')),
  deployed_at TEXT NOT NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

CREATE TABLE incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
  started_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  CHECK (
    (status = 'open' AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolved_at IS NOT NULL)
  )
);

CREATE INDEX deployments_service_deployed_at_idx
  ON deployments (service_id, deployed_at DESC);

CREATE INDEX incidents_status_started_at_idx
  ON incidents (status, started_at DESC);
