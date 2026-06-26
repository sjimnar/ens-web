// GET /api/audit — Devuelve estado completo de la auditoría
// PUT /api/audit — Actualiza nivel o resetea

import type { Env, AuditStateRow, ControlStateRow, EvidenceLinkRow } from './types';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestGet = async ({ env }: PagesContext) => {
  const audit = await env.DB.prepare('SELECT * FROM audit_state WHERE id = ?')
    .bind('current')
    .first<AuditStateRow>();

  const controls = await env.DB.prepare('SELECT * FROM control_states')
    .all<ControlStateRow>();

  const links = await env.DB.prepare('SELECT * FROM evidence_links')
    .all<EvidenceLinkRow>();

  // Agrupar links por control
  const linksByControl: Record<string, EvidenceLinkRow[]> = {};
  for (const link of links.results) {
    if (!linksByControl[link.control_id]) linksByControl[link.control_id] = [];
    linksByControl[link.control_id].push(link);
  }

  // Construir respuesta
  const controlStates: Record<string, unknown> = {};
  for (const c of controls.results) {
    controlStates[c.control_id] = {
      controlId: c.control_id,
      status: c.status,
      comment: c.comment,
      responsible: (c as unknown as Record<string, string>).responsible || '',
      evidenceLinks: (linksByControl[c.control_id] || []).map(l => ({
        id: l.id,
        controlId: l.control_id,
        url: l.url,
        label: l.label,
        addedAt: l.added_at,
      })),
    };
  }

  return Response.json({
    level: audit?.level || 'MEDIO',
    controls: controlStates,
    lastModified: audit?.last_modified || new Date().toISOString(),
  });
};

export const onRequestPut = async ({ request, env }: PagesContext) => {
  const body = await request.json() as { level?: string; reset?: boolean };

  if (body.reset) {
    // Resetear toda la auditoría
    await env.DB.batch([
      env.DB.prepare('DELETE FROM evidence_links'),
      env.DB.prepare('DELETE FROM evidence_files'),
      env.DB.prepare('DELETE FROM control_states'),
      env.DB.prepare("UPDATE audit_state SET level = ?, last_modified = datetime('now') WHERE id = 'current'")
        .bind(body.level || 'MEDIO'),
    ]);
    return Response.json({ ok: true });
  }

  if (body.level) {
    await env.DB.prepare("UPDATE audit_state SET level = ?, last_modified = datetime('now') WHERE id = 'current'")
      .bind(body.level)
      .run();
  }

  return Response.json({ ok: true });
};
