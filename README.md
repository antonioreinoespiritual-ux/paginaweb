# Research OS

Monorepo con frontend (Next.js) y backend (FastAPI) para entrevistas, validación de hipótesis y modo venta.

## Arquitectura

- `backend/app/models`: tablas SQLAlchemy 2.0 (incluye `embeddings_store` con pgvector).
- `backend/app/services`: motor de reglas/scoring/analytics/clustering/ventas/embeddings.
- `backend/app/routers`: endpoints REST y SSE en vivo.
- `backend/app/jobs`: scheduler APScheduler.
- `backend/app/migrations`: Alembic + revisión inicial.
- `frontend/app`: páginas App Router (`dashboard`, `hypotheses`, `interviews`, `flows`, `sales`).

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Variables:

- `DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/research_os`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Variables:

- `NEXT_PUBLIC_API_URL=http://localhost:8000`

## Jobs

El scheduler se inicia automáticamente en `startup` de FastAPI.

## Tests

```bash
cd backend
pytest
```

## Limpieza de artefactos temporales

Para evitar problemas con archivos binarios no admitidos (por ejemplo `__pycache__`/`.pyc`), usa:

```bash
./scripts/dev-clean.sh
```

