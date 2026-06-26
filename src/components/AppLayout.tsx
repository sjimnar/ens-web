import { useState, useMemo } from 'react';
import { Outlet, useParams, useNavigate, Link } from 'react-router-dom';
import { controlsService } from '@/services/ControlsService';
import { storageService } from '@/services/StorageService';
import { useAuditState } from '@/hooks/useAuditState';
import { useControlFilter } from '@/hooks/useControlFilter';
import { AuditFiltersContext } from '@/hooks/useAuditFilters';
import { GlobalSearch } from '@/components/GlobalSearch';
import type { ComplianceStatus, ControlENS } from '@/types';
import './AppLayout.css';

/**
 * AppLayout — Two-panel layout wrapping authenticated routes.
 *
 * Renders:
 * - A header bar with app title, level badge, "Cambiar nivel" button, and GlobalSearch
 * - A sidebar (left, ~300px) with controls list grouped by category and status indicators
 * - A main content area with <Outlet /> for nested route content
 *
 * Responsive: sidebar hidden below 1024px viewport width.
 * Active control highlighted based on current route params.
 */
export function AppLayout() {
  const navigate = useNavigate();
  const { id: activeControlId } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [responsibleFilter, setResponsibleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { level, controlStates } = useAuditState();

  // Load all controls filtered by level
  const allControls = useMemo(() => controlsService.loadControls(), []);
  const levelControls = useMemo(
    () => controlsService.filterByLevel(allControls, level),
    [allControls, level]
  );

  // Sidebar filtering
  const {
    filters,
    setSearchText,
    filteredControls: textFilteredControls,
  } = useControlFilter(levelControls, controlStates);

  // Apply all filters on top of text filter
  const filteredControls = useMemo(() => {
    let result = textFilteredControls;
    if (responsibleFilter) {
      result = result.filter((c) => (controlStates[c.control_id]?.responsible ?? '') === responsibleFilter);
    }
    if (statusFilter) {
      result = result.filter((c) => (controlStates[c.control_id]?.status ?? 'Pendiente') === statusFilter);
    }
    if (categoryFilter) {
      result = result.filter((c) => c.category === categoryFilter);
    }
    return result;
  }, [textFilteredControls, controlStates, responsibleFilter, statusFilter, categoryFilter]);

  // Group controls by category for sidebar display
  const groupedControls = useMemo(() => {
    const groups: { category: string; categoryName: string; controls: ControlENS[] }[] = [];
    const categoryMap = new Map<string, ControlENS[]>();

    for (const control of filteredControls) {
      const existing = categoryMap.get(control.category);
      if (existing) {
        existing.push(control);
      } else {
        categoryMap.set(control.category, [control]);
      }
    }

    for (const [category, controls] of categoryMap) {
      groups.push({
        category,
        categoryName: controls[0].category_name,
        controls,
      });
    }

    return groups;
  }, [filteredControls]);

  // Get compliance status for a control
  function getControlStatus(controlId: string) {
    return controlStates[controlId]?.status ?? 'Pendiente';
  }

  // Map status to a CSS modifier
  function getStatusModifier(controlId: string): string {
    const status = getControlStatus(controlId);
    switch (status) {
      case 'En progreso':
        return 'en-progreso';
      case 'Cumplido':
        return 'cumplido';
      case 'No aplica':
        return 'no-aplica';
      default:
        return 'pendiente';
    }
  }

  // Handle "Cambiar nivel"
  function handleChangeLevel() {
    storageService.removeLevel();
    navigate('/');
  }

  // Toggle sidebar visibility
  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-layout__header">
        <div className="app-layout__header-left">
          <button
            type="button"
            className="app-layout__sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
            aria-expanded={sidebarOpen}
          >
            ☰
          </button>
          <Link to="/controls" className="app-layout__title-link">
            <h1 className="app-layout__title">Auditoría ENS</h1>
          </Link>
          <span className="app-layout__level-badge">{level}</span>
          <button
            type="button"
            className="app-layout__change-level-btn"
            onClick={handleChangeLevel}
            aria-label="Cambiar nivel ENS"
          >
            Cambiar nivel
          </button>
        </div>
        <div className="app-layout__header-right">
          <GlobalSearch />
        </div>
      </header>

      {/* Main content area */}
      <div className="app-layout__body">
        {/* Sidebar */}
        <nav
          className={`app-layout__sidebar${sidebarOpen ? '' : ' app-layout__sidebar--collapsed'}`}
          aria-label="Lista de controles"
        >
          {/* Sidebar search filter */}
          <div className="app-layout__sidebar-filter">
            <input
              type="text"
              className="app-layout__sidebar-search"
              placeholder="Filtrar controles..."
              value={filters.searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Filtrar controles en panel lateral"
            />
            <select
              className="app-layout__sidebar-responsible-filter"
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              aria-label="Filtrar por responsable"
            >
              <option value="">Todos los responsables</option>
              <option value="Infraestructuras">Infraestructuras</option>
              <option value="Security">Security</option>
              <option value="Cloud">Cloud</option>
              <option value="Desarrollo">Desarrollo</option>
              <option value="RRHH">RRHH</option>
              <option value="Dirección">Dirección</option>
            </select>
          </div>

          {/* Active filters badges */}
          {(statusFilter || categoryFilter) && (
            <div className="app-layout__sidebar-badges">
              {statusFilter && (
                <span className="app-layout__sidebar-badge">
                  {statusFilter}
                  <button type="button" onClick={() => setStatusFilter(null)} aria-label="Quitar filtro de estado">✕</button>
                </span>
              )}
              {categoryFilter && (
                <span className="app-layout__sidebar-badge">
                  {categoryFilter}
                  <button type="button" onClick={() => setCategoryFilter(null)} aria-label="Quitar filtro de categoría">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Controls list grouped by category */}
          <div className="app-layout__sidebar-list">
            {groupedControls.length === 0 ? (
              <p className="app-layout__sidebar-empty">Sin resultados</p>
            ) : (
              groupedControls.map((group) => (
                <div key={group.category} className="app-layout__sidebar-group">
                  <h3 className="app-layout__sidebar-category">
                    {group.categoryName}
                  </h3>
                  <ul className="app-layout__sidebar-controls">
                    {group.controls.map((control) => (
                      <li
                        key={control.control_id}
                        className={`app-layout__sidebar-item${
                          control.control_id === activeControlId
                            ? ' app-layout__sidebar-item--active'
                            : ''
                        }`}
                      >
                        <Link
                          to={`/controls/${control.control_id}`}
                          className="app-layout__sidebar-link"
                        >
                          <span
                            className={`app-layout__sidebar-status app-layout__sidebar-status--${getStatusModifier(control.control_id)}`}
                            aria-label={getControlStatus(control.control_id)}
                          />
                          <span className="app-layout__sidebar-control-id">
                            {control.control_id}
                          </span>
                          <span className="app-layout__sidebar-control-name">
                            {control.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </nav>

        {/* Main panel */}
        <main className="app-layout__main">
          <AuditFiltersContext.Provider value={{ statusFilter, categoryFilter, setStatusFilter, setCategoryFilter }}>
            <Outlet />
          </AuditFiltersContext.Provider>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
