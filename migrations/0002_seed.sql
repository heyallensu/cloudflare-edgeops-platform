INSERT INTO services (id, name, environment, status, updated_at) VALUES
  ('edge-api', 'Edge API', 'production', 'healthy', '2026-07-16T08:00:00.000Z'),
  ('web-console', 'Web Console', 'production', 'healthy', '2026-07-16T08:00:00.000Z'),
  ('event-worker', 'Event Worker', 'staging', 'degraded', '2026-07-16T08:00:00.000Z');

INSERT INTO deployments (
  idempotency_key,
  service_id,
  version,
  commit_sha,
  result,
  deployed_at
) VALUES
  ('seed-edge-api-1', 'edge-api', '2026.07.16.1', '7ab21cd', 'succeeded', '2026-07-16T07:45:00.000Z'),
  ('seed-web-console-1', 'web-console', '2026.07.16.1', 'cb493e1', 'succeeded', '2026-07-16T07:30:00.000Z'),
  ('seed-event-worker-1', 'event-worker', '2026.07.16.1', 'f124aa8', 'failed', '2026-07-16T07:15:00.000Z');

INSERT INTO incidents (service_id, title, status, started_at, resolved_at) VALUES
  ('event-worker', 'Synthetic queue processing delay', 'open', '2026-07-16T07:20:00.000Z', NULL),
  ('edge-api', 'Synthetic elevated latency', 'resolved', '2026-07-15T22:00:00.000Z', '2026-07-15T22:18:00.000Z');
