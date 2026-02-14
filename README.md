# Market Gap Analyzer (NLP clásico, sin LLM)

Monorepo:
- `backend/`: FastAPI + DuckDB + scikit-learn + YAKE.
- `frontend/`: Next.js (App Router) + TypeScript + Tailwind + React Query.

## Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

Config opcional:
```bash
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Flujo MVP
1. Abrir `/upload` y subir CSV (ej: `youtube_comments_marketing_gaps.csv`).
2. Ejecutar `Ingestar`.
3. Ejecutar `Analizar`.
4. Revisar:
   - `/dataset/{id}/overview`
   - `/dataset/{id}/clusters`
   - `/dataset/{id}/signals`
   - `/dataset/{id}/export`

## Endpoints backend
- `POST /api/datasets/upload`
- `POST /api/datasets/{id}/ingest`
- `POST /api/datasets/{id}/analyze`
- `GET /api/jobs/{job_id}`
- `GET /api/datasets/{id}/summary`
- `GET /api/datasets/{id}/clusters`
- `GET /api/clusters/{cluster_id}?dataset_id=...`
- `GET /api/datasets/{id}/signals`
- `POST /api/datasets/{id}/signals/recompute`
- `GET /api/datasets/{id}/export/{type}`

## Notas técnicas
- Sin LLM/embeddings.
- Señales por regex + pesos configurables.
- TF-IDF (1,2) + SVD + KMeans con selección de K por silhouette.
- Etiquetado determinístico por YAKE + ngrams.
- Score de hueco vendible en frío priorizando impacto económico y urgencia.
