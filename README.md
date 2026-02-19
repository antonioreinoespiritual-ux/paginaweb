# Research OS

Research OS ahora funciona como herramienta operable con persistencia real en DB local para:
- Projects
- Hypotheses (campos ricos)
- Flows
- Interview Templates
- Interview Sessions
- Sales Playbooks

## Fase 0 — Diagnóstico

### 1) Rutas API existentes
Se pueden listar en runtime:

```bash
curl http://localhost:8000/api/routes
```

Incluye CRUD para:
- `/projects`
- `/hypotheses`
- `/flows`
- `/interview-templates`
- `/interviews`
- `/sales-playbooks`

### 2) Por qué antes no persistía
Causas típicas corregidas:
- Contrato frontend/backend inconsistente (rutas antiguas mezcladas con `/api/*`).
- Entidades de UI sin modelo persistente completo.
- Guardados parciales (sin PUT/PATCH consistente en todos los recursos).
- Falta de trazabilidad de errores y respuestas homogéneas.

### 3) Logging y manejo de errores
- Logging backend activado en `main.py`.
- Error handler uniforme para `HTTPException` y errores 500.

## Stack y ejecución

## Variables de entorno

Backend (`backend/.env.example`):

```env
DATABASE_URL=sqlite:///./research_os.db
```

Frontend (`frontend/.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Ejecutar backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

## Ejecutar ambos desde raíz

```bash
npm install
npm run dev
```

## Checklist manual de verificación (Fase 4)

1. Crear proyecto:
   - Dashboard -> “Guardar proyecto”.
   - Recargar: el proyecto sigue listado.
2. Crear hipótesis rica:
   - Hipótesis -> completar title, pain, persona, falsifiable statement, notes, success criteria JSON.
   - Guardar y recargar: persiste.
3. Crear plantilla de entrevista:
   - Entrevistas -> pestaña Plantillas -> guardar.
   - Recargar: persiste.
4. Iniciar entrevista y guardar respuestas:
   - Entrevistas -> pestaña Sesiones -> seleccionar hipótesis/plantilla -> guardar answers/notes.
   - Recargar: persiste.
5. Crear flow:
   - Flujos -> guardar nodes/edges JSON.
   - Recargar: versionado y datos persisten.
6. Crear playbook de ventas:
   - Ventas -> oferta + objeciones + scripts + follow-up -> guardar.
   - Recargar: persiste.

## Notas
- La DB local (`*.db`) está ignorada por Git.
- No se versionan entornos virtuales ni caches.

## Fix para error `no such column: hypotheses.project_id`

Ese error aparece cuando tienes una SQLite vieja con el esquema anterior.

- Desde esta versión, en startup el backend detecta el mismatch y hace backup + reset automático de esquema en SQLite.
- Backup generado como `research_os.bak-YYYYMMDD-HHMMSS.db`.

Si prefieres desactivar ese comportamiento:

```bash
export SQLITE_AUTO_RESET_ON_SCHEMA_MISMATCH=false
```

Y entonces migra manualmente o elimina el archivo `research_os.db` para regenerarlo.
