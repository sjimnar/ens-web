// POST /api/evidence/links — Añadir enlace de evidencia
// DELETE /api/evidence/links — Eliminar enlace de evidencia

import type { Env } from '../types';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async ({ request, env }: PagesContext) => {
  const body = await request.json() as {
    id: string;
    controlId: string;
    url: string;
    label: string;
  };

  // Asegurar que el control_state existe
  await env.DB.prepare(`
    INSERT OR IGNORE INTO control_states (control_id, status, comment)
    VALUES (?, 'Pendiente', '')
  `).bind(body.controlId).run();

  await env.DB.prepare(`
    INSERT INTO evidence_links (id, control_id, url, label, added_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(body.id, body.controlId, body.url, body.label).run();

  await env.DB.prepare("UPDATE audit_state SET last_modified = datetime('now') WHERE id = 'current'").run();

  return Response.json({ ok: true });
};

export const onRequestDelete = async ({ request, env }: PagesContext) => {
  const body = await request.json() as { id: string };

  await env.DB.prepare('DELETE FROM evidence_links WHERE id = ?')
    .bind(body.id)
    .run();

  await env.DB.prepare("UPDATE audit_state SET last_modified = datetime('now') WHERE id = 'current'").run();

  return Response.json({ ok: true });
};
