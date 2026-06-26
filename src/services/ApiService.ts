import type { AuditState, ComplianceStatus, EvidenceLink } from '@/types';

const API_BASE = '/api';

/**
 * ApiService — Comunicación con el backend Cloudflare Functions.
 * Reemplaza localStorage/IndexedDB cuando se despliega en Cloudflare.
 */
class ApiService {
  async getAuditState(): Promise<AuditState> {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) throw new Error('Error cargando estado de auditoría');
    return res.json();
  }

  async setLevel(level: string): Promise<void> {
    await fetch(`${API_BASE}/audit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
  }

  async resetAudit(level: string): Promise<void> {
    await fetch(`${API_BASE}/audit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true, level }),
    });
  }

  async updateControl(controlId: string, data: { status?: ComplianceStatus; comment?: string; responsible?: string }): Promise<void> {
    await fetch(`${API_BASE}/controls/${controlId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async addEvidenceLink(link: EvidenceLink): Promise<void> {
    await fetch(`${API_BASE}/evidence/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(link),
    });
  }

  async removeEvidenceLink(id: string): Promise<void> {
    await fetch(`${API_BASE}/evidence/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async uploadFile(controlId: string, fileId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('controlId', controlId);
    formData.append('id', fileId);

    await fetch(`${API_BASE}/evidence/files`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteFile(id: string): Promise<void> {
    await fetch(`${API_BASE}/evidence/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  getFileDownloadUrl(id: string): string {
    return `${API_BASE}/evidence/files/${id}`;
  }

  async importAudit(data: unknown): Promise<{ ok: boolean; imported?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }
}

export const apiService = new ApiService();
