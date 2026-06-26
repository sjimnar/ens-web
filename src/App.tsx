import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { storageService } from '@/services/StorageService';
import { apiService } from '@/services/ApiService';
import { LevelSelector } from '@/pages/LevelSelector';
import { ControlListPage } from '@/pages/ControlListPage';
import { ControlDetailPage } from '@/pages/ControlDetailPage';
import { AppLayout } from '@/components/AppLayout';
import type { NivelENS } from '@/types';

/**
 * Componente raíz de la aplicación de auditoría ENS.
 * Gestiona el enrutamiento entre las tres vistas principales:
 * - / → Selección de nivel (o redirect a /controls si ya hay nivel guardado)
 * - /controls → Lista de controles
 * - /controls/:id → Detalle de un control
 */
function App() {
  return (
    <Routes>
      {/* Página de selección de nivel */}
      <Route path="/" element={<HomePage />} />

      {/* Ruta explícita de selección de nivel (sin redirect check) */}
      <Route path="/select-level" element={<SelectLevelPage />} />

      {/* Rutas protegidas con AppLayout (sidebar + detail) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/controls" element={<ControlListPage />} />
        <Route path="/controls/:id" element={<ControlDetailPage />} />
      </Route>

      {/* Cualquier otra ruta redirige a inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Página de inicio: si ya hay un nivel guardado, redirige a /controls.
 * Si no, muestra el selector de nivel.
 */
function HomePage() {
  const navigate = useNavigate();
  const savedLevel = storageService.getLevel();

  if (savedLevel) {
    return <Navigate to="/controls" replace />;
  }

  const handleSelectLevel = (level: NivelENS) => {
    storageService.saveLevel(level);
    const existingState = storageService.getAuditState();
    if (existingState) {
      storageService.saveAuditState({ ...existingState, level, lastModified: new Date().toISOString() });
    } else {
      storageService.saveAuditState({ level, controls: {}, lastModified: new Date().toISOString() });
    }
    apiService.setLevel(level).catch(() => {});
    navigate('/controls');
  };

  return <LevelSelector onSelectLevel={handleSelectLevel} />;
}

/**
 * Página de selección de nivel (ruta directa, sin redirect check).
 * Siempre muestra el selector de nivel independientemente del estado guardado.
 */
function SelectLevelPage() {
  const navigate = useNavigate();

  const handleSelectLevel = (level: NivelENS) => {
    storageService.saveLevel(level);
    const existingState = storageService.getAuditState();
    if (existingState) {
      storageService.saveAuditState({ ...existingState, level, lastModified: new Date().toISOString() });
    } else {
      storageService.saveAuditState({ level, controls: {}, lastModified: new Date().toISOString() });
    }
    apiService.setLevel(level).catch(() => {});
    navigate('/controls');
  };

  return <LevelSelector onSelectLevel={handleSelectLevel} />;
}

/**
 * Ruta protegida: redirige a / si no hay nivel seleccionado.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const savedLevel = storageService.getLevel();

  if (!savedLevel) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default App;
