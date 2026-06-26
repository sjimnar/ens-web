import { useMemo } from 'react';
import type { ComplianceStatus } from '@/types';
import { controlsService } from '@/services/ControlsService';
import { exportImportService } from '@/services/ExportImportService';
import { storageService } from '@/services/StorageService';
import { apiService } from '@/services/ApiService';
import { useAuditState } from '@/hooks/useAuditState';
import { useAuditFilters } from '@/hooks/useAuditFilters';
import { useProgressStats } from '@/hooks/useProgressStats';
import { PieChart } from '@/components/PieChart';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import './ControlListPage.css';

export function ControlListPage() {
  const { level, controlStates } = useAuditState();
  const { statusFilter, categoryFilter, setStatusFilter, setCategoryFilter } = useAuditFilters();

  // Load all controls and filter by current level
  const allControls = useMemo(() => controlsService.loadControls(), []);
  const levelControls = useMemo(
    () => controlsService.filterByLevel(allControls, level),
    [allControls, level]
  );

  // Progress stats
  const progressDistribution = useProgressStats(levelControls, controlStates);

  // Stats by category
  const categoryStats = useMemo(() => {
    const stats: { category: string; categoryName: string; total: number; cumplido: number; enProgreso: number; pendiente: number; noAplica: number }[] = [];
    const categoryMap = new Map<string, typeof stats[number]>();

    for (const control of levelControls) {
      let entry = categoryMap.get(control.category);
      if (!entry) {
        entry = { category: control.category, categoryName: control.category_name, total: 0, cumplido: 0, enProgreso: 0, pendiente: 0, noAplica: 0 };
        categoryMap.set(control.category, entry);
      }
      entry.total++;
      const status: ComplianceStatus = controlStates[control.control_id]?.status ?? 'Pendiente';
      if (status === 'Cumplido') entry.cumplido++;
      else if (status === 'En progreso') entry.enProgreso++;
      else if (status === 'No aplica') entry.noAplica++;
      else entry.pendiente++;
    }

    return Array.from(categoryMap.values()).sort((a, b) => a.category.localeCompare(b.category));
  }, [levelControls, controlStates]);

  // Export handler
  function handleExport() {
    const auditState = {
      level,
      controls: controlStates,
      lastModified: new Date().toISOString(),
    };
    const exportData = exportImportService.exportAuditData(auditState);
    const filename = exportImportService.generateFilename(level, new Date());
    exportImportService.downloadAsJson(exportData, filename);
  }

  // Import handler
  function handleImport(fileContent: string): { success: boolean; error?: string } {
    const parsed = exportImportService.parseImportFile(fileContent);
    if (!parsed) {
      return { success: false, error: 'El formato del archivo importado no es válido.' };
    }

    apiService.importAudit(parsed).then(() => {
      window.location.reload();
    }).catch(() => {
      const currentState = { level, controls: controlStates, lastModified: new Date().toISOString() };
      const merged = exportImportService.mergeImportedData(currentState, parsed);
      storageService.saveAuditState(merged);
      window.location.reload();
    });

    return { success: true };
  }

  // New audit handler
  function handleNewAudit() {
    apiService.resetAudit(level).then(() => {
      window.location.reload();
    }).catch(() => {
      storageService.saveAuditState({ level, controls: {}, lastModified: new Date().toISOString() });
      window.location.reload();
    });
  }

  function getPercentage(completed: number, total: number): string {
    if (total === 0) return '0';
    return ((completed / total) * 100).toFixed(0);
  }

  return (
    <div className="control-list-page">
      {/* Dashboard header */}
      <section className="control-list-page__stats">
        <PieChart
          distribution={progressDistribution}
          activeStatus={statusFilter}
          onStatusClick={(status) => setStatusFilter(status === statusFilter ? null : status)}
        />
        <ExportImportButtons onExport={handleExport} onImport={handleImport} onNewAudit={handleNewAudit} />
      </section>

      {/* Category breakdown */}
      <section className="control-list-page__categories">
        <h3 className="control-list-page__section-title">Progreso por categoría</h3>
        <div className="control-list-page__category-grid">
          {categoryStats.map((cat) => {
            const pct = getPercentage(cat.cumplido + cat.noAplica, cat.total);
            const isActive = categoryFilter === cat.category;
            return (
              <button
                key={cat.category}
                type="button"
                className={`category-card${isActive ? ' category-card--active' : ''}`}
                onClick={() => setCategoryFilter(isActive ? null : cat.category)}
                aria-pressed={isActive}
              >
                <div className="category-card__header">
                  <span className="category-card__name">{cat.categoryName}</span>
                  <span className="category-card__code">{cat.category}</span>
                </div>
                <div className="category-card__bar">
                  <div
                    className="category-card__bar-fill category-card__bar-fill--cumplido"
                    style={{ width: `${getPercentage(cat.cumplido, cat.total)}%` }}
                  />
                  <div
                    className="category-card__bar-fill category-card__bar-fill--no-aplica"
                    style={{ width: `${getPercentage(cat.noAplica, cat.total)}%` }}
                  />
                  <div
                    className="category-card__bar-fill category-card__bar-fill--en-progreso"
                    style={{ width: `${getPercentage(cat.enProgreso, cat.total)}%` }}
                  />
                </div>
                <div className="category-card__meta">
                  <span className="category-card__pct">{pct}% completado</span>
                  <span className="category-card__count">{cat.cumplido + cat.noAplica}/{cat.total}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Placeholder for when no control is selected */}
      <section className="control-list-page__placeholder">
        <p>← Selecciona un control del panel lateral para ver su detalle</p>
      </section>
    </div>
  );
}

export default ControlListPage;
