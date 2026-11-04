\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(27128001);
CREATE TABLE IF NOT EXISTS blend_schema_migrations (
    version integer PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO blend_schema_migrations (version) VALUES (1) ON CONFLICT DO NOTHING;
COMMIT;
