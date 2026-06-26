// GET /api/controls/:id — Devuelve estado de un control
// PUT /api/controls/:id — Actualiza estado/comentario de un control

import type { Env, ControlStateRow, EvidenceLinkRow } from '../types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

export const onRequestGet = async ({ env, params }: PagesContext) => {
  const controlId = params.id;

  const control = await env.DB.prepare('SELECT * FROM control_states WHERE control_id = ?')
    .bind(controlId)
    .first<ControlStateRow>();

  const links = await env.DB.prepare('SELECT * FROM evidence_links WHERE control_id = ?')
    .bind(controlId)
    .all<EvidenceLinkRow>();

  if (!control) {
    return Response.json({
      controlId,
      status: 'Pendiente',
      comment: '',
      evidenceLinks: [],
    });
  }

  return Response.json({
    controlId: control.control_id,
    status: control.status,
    comment: control.comment,
    evidenceLinks: links.results.map(l => ({
      id: l.id,
      controlId: l.control_id,
      url: l.url,
      label: l.label,
      addedAt: l.added_at,
    })),
  });
};

export const onRequestPut = async ({ request, env, params }: PagesContext) => {
  const controlId = params.id;
  const body = await request.json() as { status?: string; comment?: string; responsible?: string };

  // Upsert control state
  await env.DB.prepare(`
    INSERT INTO control_states (control_id, status, comment, responsible, last_modified)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(control_id) DO UPDATE SET
      status = COALESCE(excluded.status, control_states.status),
      comment = COALESCE(excluded.comment, control_states.comment),
      responsible = COALESCE(excluded.responsible, control_states.responsible),
      last_modified = datetime('now')
  `).bind(
    controlId,
    body.status || 'Pendiente',
    body.comment ?? '',
    body.responsible ?? ''
  ).run();

  await env.DB.prepare("UPDATE audit_state SET last_modified = datetime('now') WHERE id = 'current'").run();

  return Response.json({ ok: true });
};
