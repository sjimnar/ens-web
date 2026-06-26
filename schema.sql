-- Esquema D1 para ENS Audit

CREATE TABLE IF NOT EXISTS audit_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  level TEXT NOT NULL DEFAULT 'MEDIO',
  last_modified TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS control_states (
  control_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  comment TEXT NOT NULL DEFAULT '',
  responsible TEXT NOT NULL DEFAULT '',
  last_modified TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  control_id TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (control_id) REFERENCES control_states(control_id)
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY,
  control_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (control_id) REFERENCES control_states(control_id)
);

-- Insertar estado inicial
INSERT OR IGNORE INTO audit_state (id, level) VALUES ('current', 'MEDIO');
