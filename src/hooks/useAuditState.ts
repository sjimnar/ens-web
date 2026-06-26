import { useState, useCallback, useEffect, useRef } from 'react';
import type { AuditState, ComplianceStatus, ControlAuditState, EvidenceLink, NivelENS } from '@/types';
import { storageService } from '@/services/StorageService';
import { apiService } from '@/services/ApiService';

const DEFAULT_LEVEL: NivelENS = 'MEDIO';

function createDefaultControlState(controlId: string): ControlAuditState {
  return {
    controlId,
    status: 'Pendiente',
    comment: '',
    evidenceLinks: [],
  };
}

function createDefaultAuditState(level: NivelENS): AuditState {
  return {
    level,
    controls: {},
    lastModified: new Date().toISOString(),
  };
}

/**
 * Detect if we're running on Cloudflare (API available) or locally (localStorage only).
 * We try to fetch /api/audit — if it works, we use the API.
 */
async function isApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/audit', { method: 'HEAD' });
    return res.ok || res.status === 405; // 405 means endpoint exists but HEAD not supported
  } catch {
    return false;
  }
}

export interface UseAuditStateReturn {
  level: NivelENS;
  controlStates: Record<string, ControlAuditState>;
  loading: boolean;
  setLevel: (level: NivelENS) => void;
  setControlStatus: (controlId: string, status: ComplianceStatus) => void;
  setComment: (controlId: string, comment: string) => void;
  setResponsible: (controlId: string, responsible: string) => void;
  addEvidenceLink: (controlId: string, link: EvidenceLink) => void;
  removeEvidenceLink: (controlId: string, linkId: string) => void;
  refresh: () => void;
}

export function useAuditState(): UseAuditStateReturn {
  const [auditState, setAuditState] = useState<AuditState>(() => {
    // Start with localStorage cache for instant render
    const saved = storageService.getAuditState();
    if (saved) return saved;
    const level = storageService.getLevel() ?? DEFAULT_LEVEL;
    return createDefaultAuditState(level);
  });

  const [loading, setLoading] = useState(false);
  const useApi = useRef<boolean | null>(null); // null = not yet determined
  const fetchedRef = useRef(false);

  // On mount: check if API is available and fetch remote state
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      const apiOk = await isApiAvailable();
      useApi.current = apiOk;

      if (apiOk) {
        setLoading(true);
        try {
          const remote = await apiService.getAuditState();
          setAuditState(remote);
          // Update local cache
          storageService.saveAuditState(remote);
          storageService.saveLevel(remote.level);
        } catch {
          // API failed, keep localStorage state
        } finally {
          setLoading(false);
        }
      }
    })();
  }, []);

  // Persist to localStorage as cache (always)
  useEffect(() => {
    storageService.saveAuditState(auditState);
    storageService.saveLevel(auditState.level);
  }, [auditState]);

  const refresh = useCallback(() => {
    if (useApi.current) {
      apiService.getAuditState().then((remote) => {
        setAuditState(remote);
        storageService.saveAuditState(remote);
      }).catch(() => {});
    }
  }, []);

  const setLevel = useCallback((newLevel: NivelENS) => {
    setAuditState((prev) => ({
      ...prev,
      level: newLevel,
      controls: prev.controls,
      lastModified: new Date().toISOString(),
    }));
    if (useApi.current) {
      apiService.setLevel(newLevel).catch(() => {});
    }
  }, []);

  const getOrCreateControlState = useCallback(
    (controlId: string, controls: Record<string, ControlAuditState>): ControlAuditState => {
      return controls[controlId] ?? createDefaultControlState(controlId);
    },
    []
  );

  const setControlStatus = useCallback((controlId: string, status: ComplianceStatus) => {
    setAuditState((prev) => {
      const existing = getOrCreateControlState(controlId, prev.controls);
      const updated = { ...existing, status };
      return {
        ...prev,
        controls: { ...prev.controls, [controlId]: updated },
        lastModified: new Date().toISOString(),
      };
    });
    if (useApi.current) {
      apiService.updateControl(controlId, { status }).catch(() => {});
    }
  }, [getOrCreateControlState]);

  const setComment = useCallback((controlId: string, comment: string) => {
    setAuditState((prev) => {
      const existing = getOrCreateControlState(controlId, prev.controls);
      return {
        ...prev,
        controls: { ...prev.controls, [controlId]: { ...existing, comment } },
        lastModified: new Date().toISOString(),
      };
    });
    if (useApi.current) {
      apiService.updateControl(controlId, { comment }).catch(() => {});
    }
  }, [getOrCreateControlState]);

  const setResponsible = useCallback((controlId: string, responsible: string) => {
    setAuditState((prev) => {
      const existing = getOrCreateControlState(controlId, prev.controls);
      return {
        ...prev,
        controls: { ...prev.controls, [controlId]: { ...existing, responsible } },
        lastModified: new Date().toISOString(),
      };
    });
    if (useApi.current) {
      apiService.updateControl(controlId, { responsible }).catch(() => {});
    }
  }, [getOrCreateControlState]);

  const addEvidenceLink = useCallback((controlId: string, link: EvidenceLink) => {
    setAuditState((prev) => {
      const existing = getOrCreateControlState(controlId, prev.controls);
      return {
        ...prev,
        controls: {
          ...prev.controls,
          [controlId]: { ...existing, evidenceLinks: [...existing.evidenceLinks, link] },
        },
        lastModified: new Date().toISOString(),
      };
    });
    if (useApi.current) {
      apiService.addEvidenceLink(link).catch(() => {});
    }
  }, [getOrCreateControlState]);

  const removeEvidenceLink = useCallback((controlId: string, linkId: string) => {
    setAuditState((prev) => {
      const existing = getOrCreateControlState(controlId, prev.controls);
      return {
        ...prev,
        controls: {
          ...prev.controls,
          [controlId]: {
            ...existing,
            evidenceLinks: existing.evidenceLinks.filter((l) => l.id !== linkId),
          },
        },
        lastModified: new Date().toISOString(),
      };
    });
    if (useApi.current) {
      apiService.removeEvidenceLink(linkId).catch(() => {});
    }
  }, [getOrCreateControlState]);

  return {
    level: auditState.level,
    controlStates: auditState.controls,
    loading,
    setLevel,
    setControlStatus,
    setComment,
    setResponsible,
    addEvidenceLink,
    removeEvidenceLink,
    refresh,
  };
}
