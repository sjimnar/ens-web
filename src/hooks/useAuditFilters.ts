import { createContext, useContext } from 'react';
import type { ComplianceStatus } from '@/types';

export interface AuditFilters {
  statusFilter: ComplianceStatus | null;
  categoryFilter: string | null;
  setStatusFilter: (status: ComplianceStatus | null) => void;
  setCategoryFilter: (category: string | null) => void;
}

export const AuditFiltersContext = createContext<AuditFilters>({
  statusFilter: null,
  categoryFilter: null,
  setStatusFilter: () => {},
  setCategoryFilter: () => {},
});

export function useAuditFilters() {
  return useContext(AuditFiltersContext);
}
