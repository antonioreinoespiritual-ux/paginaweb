#!/usr/bin/env bash
set -euo pipefail

find backend -type d -name '__pycache__' -prune -exec rm -rf {} +
find backend -name '*.pyc' -delete
rm -rf frontend/.next frontend/node_modules/.cache

echo "Caches temporales limpiados (sin artefactos binarios versionados)."
