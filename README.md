# Research OS

Herramienta para entrevistas, validación de hipótesis y mini-CRM de venta.

## Plan de cambios

### Fase 1 (implementada en esta entrega)
- UX crítica: estados de carga/error/empty + CTA + confirmaciones + toasts.
- Persistencia real de hipótesis, entrevistas, sesiones/notas, flujos y mini-CRM.
- Integración frontend-backend estandarizada con cliente API único.
- Layout dashboard persistente (sidebar responsive + breadcrumb).

### Fase 2 (TODO)
- Analytics avanzadas: records con filtros y paginación server-side.
- Quality gates: lint, typecheck, pruebas API integrales.
- Documentación por hipótesis (timeline de decisiones/cambios).
- Sistema de componentes UI reutilizables más completo.

## Estructura
- `backend/`: FastAPI + SQLAlchemy + servicios de scoring.
- `frontend/`: Next.js App Router + TanStack Query + Zustand + Recharts + React Flow.

## Variables de entorno

Backend (`backend/.env.example`):

```env
DATABASE_URL=sqlite:///./research_os.db
```

Frontend (`frontend/.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Ejecutar (manual)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Ejecutar ambos (opcional)

```bash
npm install
npm run dev
```

> Usa `concurrently` desde la raíz para levantar backend y frontend.

## Criterios Fase 1 cubiertos
- Cada sección tiene lista o empty state con CTA.
- CRUD mínimo de hipótesis/flujos/ofertas/scripts/objeciones funcional.
- Entrevista en vivo guiada con sesión + nota + score básico persistido.
- Embudo con explicación, métricas y fallback cuando no hay datos.
- Manejo de errores/loading centralizado en UI.

## Limpieza de artefactos temporales

```bash
./scripts/dev-clean.sh
```
