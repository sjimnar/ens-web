// GET /api/evidence/files/:id — Descargar archivo desde R2

import type { Env } from '../../types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

export const onRequestGet = async ({ env, params }: PagesContext) => {
  const fileId = params.id;

  const row = await env.DB.prepare('SELECT r2_key, filename, mime_type FROM evidence_files WHERE id = ?')
    .bind(fileId)
    .first<{ r2_key: string; filename: string; mime_type: string }>();

  if (!row) {
    return new Response('Not found', { status: 404 });
  }

  const object = await env.BUCKET.get(row.r2_key);
  if (!object) {
    return new Response('File not found in storage', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': row.mime_type,
      'Content-Disposition': `attachment; filename="${row.filename}"`,
    },
  });
};
