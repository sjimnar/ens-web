// POST /api/import — Importar estado de auditoría desde JSON

import type { Env } from './types';

interface PagesContext {
  request: Request;
  env: Env;
}

interface ImportedControl {
  controlId: string;
  status: string;
  comment: string;
  evidenceLinks: { id: string; controlId: string; url: string; label: string; addedAt: string }[];
}

interface ImportData {
  version: string;
  level: string;
  controls: Record<string, ImportedControl>;
}

export const onRequestPost = async ({ request, env }: PagesContext) => {
  const data = await request.json() as ImportData;

  if (!data.version || !data.level || !data.controls) {
    return Response.json({ error: 'Invalid import format' }, { status: 400 });
  }

  // Actualizar nivel
  await env.DB.prepare("UPDATE audit_state SET level = ?, last_modified = datetime('now') WHERE id = 'current'")
    .bind(data.level)
    .run();

  // Insertar/actualizar controles
  const statements = [];
  for (const [controlId, ctrl] of Object.entries(data.controls)) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO control_states (control_id, status, comment, last_modified)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(control_id) DO UPDATE SET
          status = excluded.status,
          comment = excluded.comment,
          last_modified = datetime('now')
      `).bind(controlId, ctrl.status, ctrl.comment)
    );

    // Insertar evidence links
    for (const link of ctrl.evidenceLinks || []) {
      statements.push(
        env.DB.prepare(`
          INSERT OR IGNORE INTO evidence_links (id, control_id, url, label, added_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(link.id, controlId, link.url, link.label, link.addedAt || new Date().toISOString())
      );
    }
  }

  // D1 batch supports up to 100 statements at a time
  for (let i = 0; i < statements.length; i += 100) {
    await env.DB.batch(statements.slice(i, i + 100));
  }

  return Response.json({ ok: true, imported: Object.keys(data.controls).length });
};
