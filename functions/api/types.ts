// Shared types for Cloudflare Functions
export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export interface AuditStateRow {
  id: string;
  level: string;
  last_modified: string;
}

export interface ControlStateRow {
  control_id: string;
  status: string;
  comment: string;
  last_modified: string;
}

export interface EvidenceLinkRow {
  id: string;
  control_id: string;
  url: string;
  label: string;
  added_at: string;
}

export interface EvidenceFileRow {
  id: string;
  control_id: string;
  filename: string;
  mime_type: string;
  size: number;
  r2_key: string;
  added_at: string;
}
