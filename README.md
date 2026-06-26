# ENS Audit — Herramienta de autoevaluación del Esquema Nacional de Seguridad

Herramienta web para llevar el control y seguimiento de la autoevaluación ENS (RD 311/2022). Pensada para equipos de seguridad y TI que necesitan preparar su organización para la certificación ENS sin depender de herramientas externas complejas.

## Propósito

Facilitar la autoevaluación y preparación de la auditoría ENS proporcionando un checklist interactivo con los 73 controles del Anexo II, donde el equipo puede:

- **Recopilar y adjuntar evidencias** (URLs y archivos) directamente en cada control
- **Llevar el control del progreso** de la evaluación con un panel visual por estados
- **Documentar comentarios y observaciones** por control para el auditor
- **Exportar e importar** el estado completo de la auditoría como JSON (portabilidad y backup)
- **Iniciar nuevas auditorías** reseteando el estado para cada ejercicio de certificación

## Características principales

- **Controles ENS completos**: los 73 controles del Anexo II con requisitos BOE, refuerzos por nivel, guía de documentación y ejemplos de evidencias válidas
- **Tres niveles**: Básico (52 controles), Medio (68) y Alto (73) — selecciona el que aplique a tu sistema
- **Gestión de evidencias**: adjunta URLs (enlaces a Confluence, Jira, SharePoint...) y archivos locales (capturas, PDFs) por control
- **Progreso visual**: gráfico interactivo que muestra el estado global y permite filtrar por Pendiente / En progreso / Cumplido / No aplica
- **Navegación cruzada**: las referencias entre controles y guías CCN-STIC son clicables
- **Búsqueda global**: encuentra cualquier control desde cualquier vista
- **Sidebar con lista de controles**: navega entre controles sin perder contexto
- **Cambio de nivel**: cambia de nivel preservando toda la auditoría existente
- **Exportar/Importar**: guarda el estado como JSON para compartir con el equipo o continuar en otro momento
- **Sin dependencias externas**: funciona completamente en local (localStorage + IndexedDB), no envía datos a ningún servidor
- **Despliegue sencillo**: imagen Docker lista para ejecutar en cualquier máquina

## Requisitos

- Node.js 22+
- npm 10+

O bien:

- Docker

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Arrancar servidor de desarrollo
npm run dev

# Ejecutar tests
npm test

# Build de producción
npm run build
```

## Docker (uso local)

### Construir la imagen

```bash
docker build -t ens-audit .
```

### Ejecutar el contenedor

```bash
docker run -d -p 8080:80 --name ens-audit ens-audit
```

La aplicación estará disponible en **http://localhost:8080**.

### Parar y eliminar

```bash
docker stop ens-audit
docker rm ens-audit
```

### Reconstruir tras cambios

```bash
docker build -t ens-audit .
docker run -d -p 8080:80 --name ens-audit ens-audit
```

## Cloudflare Pages (despliegue compartido con autenticación)

Para que todo el equipo acceda con estado compartido y autenticación por email:

### Requisitos

- Cuenta en [Cloudflare](https://dash.cloudflare.com) (gratis)
- Wrangler CLI: `npm install -g wrangler`

### 1. Login y crear recursos

```bash
wrangler login

# Crear base de datos D1
wrangler d1 create ens-audit-db
# Copia el database_id que te devuelve y pégalo en wrangler.toml

# Crear bucket R2
wrangler r2 bucket create ens-audit-files

# Aplicar esquema SQL
wrangler d1 execute ens-audit-db --file=schema.sql
```

### 2. Actualizar wrangler.toml

Pega el `database_id` devuelto por el comando anterior en `wrangler.toml`.

### 3. Desplegar

```bash
npm run build
wrangler pages deploy ./dist --project-name ens-audit
```

### 4. Proteger con Cloudflare Access (solo tu equipo)

1. Ve a [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → Zero Trust (gratis)
2. **Access** → **Applications** → **Add an application** → Self-hosted
3. Domain: `ens-audit.pages.dev`
4. Policy: emails ending in `@aktios.com`
5. Method: One-time PIN

Resultado: solo personas con email `@aktios.com` pueden acceder.

## Uso

1. Selecciona el nivel ENS del sistema (Básico, Medio o Alto)
2. Navega por los controles en el sidebar o usa el buscador global
3. Para cada control: revisa los requisitos, marca el estado de cumplimiento, añade comentarios y evidencias
4. El gráfico de progreso muestra el estado global; clica un segmento para filtrar por estado
5. Exporta la auditoría como JSON para respaldo o compartirla
6. Importa una auditoría previa para continuarla

## Tecnologías

- React 19, TypeScript, Vite
- react-router-dom 7
- Chart.js (gráfico de progreso)
- Vitest + Testing Library + fast-check (tests)
- nginx alpine (producción/Docker)

## Estructura

```
src/
├── components/   # Componentes reutilizables (AppLayout, GlobalSearch, PieChart...)
├── data/         # JSON con los 73 controles ENS completos
├── hooks/        # Custom hooks (useAuditState, useControlFilter, useProgressStats)
├── pages/        # Páginas (ControlListPage, ControlDetailPage, LevelSelector)
├── services/     # Servicios (StorageService, ControlsService, ExportImportService)
├── types/        # Tipos TypeScript
└── utils/        # Utilidades (textParser para enlaces entre controles)
```

## Licencia

Uso interno.
