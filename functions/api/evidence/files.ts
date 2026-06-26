// POST /api/evidence/files — Subir archivo a R2
// DELETE /api/evidence/files — Eliminar archivo de R2

import type { Env } from '../types';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async ({ request, env }: PagesContext) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const controlId = formData.get('controlId') as string;
  const fileId = formData.get('id') as string;

  if (!file || !controlId || !fileId) {
    return Response.json({ error: 'Missing file, controlId, or id' }, { status: 400 });
  }

  const r2Key = `evidence/${controlId}/${fileId}-${file.name}`;

  // Upload to R2
  await env.BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { controlId, originalName: file.name },
  });

  // Asegurar que el control_state existe
  await env.DB.prepare(`
    INSERT OR IGNORE INTO control_states (control_id, status, comment)
    VALUES (?, 'Pendiente', '')
  `).bind(controlId).run();

  // Registrar en D1
  await env.DB.prepare(`
    INSERT INTO evidence_files (id, control_id, filename, mime_type, size, r2_key, added_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(fileId, controlId, file.name, file.type, file.size, r2Key).run();

  await env.DB.prepare("UPDATE audit_state SET last_modified = datetime('now') WHERE id = 'current'").run();

  return Response.json({ ok: true, r2Key });
};

export const onRequestDelete = async ({ request, env }: PagesContext) => {
  const body = await request.json() as { id: string };

  // Obtener r2_key antes de borrar
  const row = await env.DB.prepare('SELECT r2_key FROM evidence_files WHERE id = ?')
    .bind(body.id)
    .first<{ r2_key: string }>();

  if (row) {
    await env.BUCKET.delete(row.r2_key);
  }

  await env.DB.prepare('DELETE FROM evidence_files WHERE id = ?').bind(body.id).run();
  await env.DB.prepare("UPDATE audit_state SET last_modified = datetime('now') WHERE id = 'current'").run();

  return Response.json({ ok: true });
};
