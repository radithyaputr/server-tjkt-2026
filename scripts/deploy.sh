#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "============================================"
echo "  Manual Deploy — server-tjkt-2026"
echo "  Started: $(date)"
echo "============================================"

# 1. Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Aborting."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin is required. Aborting."; exit 1; }

# 2. Pull latest code
echo ""
echo "[1/5] Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# 3. Backup SQLite if exists
echo "[2/5] Backing up database..."
if [ -f database.sqlite ]; then
  cp database.sqlite "database.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
  echo "  -> Backup created."
fi

# 4. Rebuild containers
echo "[3/5] Rebuilding Docker containers..."
docker compose down --remove-orphans
docker compose pull
docker compose up --build -d

# 5. Health check
echo "[4/5] Running health check..."
for i in $(seq 1 30); do
  health=$(docker inspect --format='{{.State.Health.Status}}' tjkt-app 2>/dev/null || echo "unavailable")
  if [ "$health" = "healthy" ]; then
    echo "  -> App container is healthy!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  -> Health check FAILED after 90s. Rolling back..."
    git revert --no-edit HEAD
    docker compose up --build -d
    echo "  -> Rolled back to previous version."
    exit 1
  fi
  echo "  -> Attempt $i/30 — status: $health"
  sleep 3
done

sleep 2
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$status" != "200" ]; then
  echo "  -> HTTP health endpoint returned $status. Rolling back..."
  git revert --no-edit HEAD
  docker compose up --build -d
  exit 1
fi

# 6. Cleanup old backups (keep last 5)
echo "[5/5] Cleaning old backups..."
ls -t database.sqlite.backup.* 2>/dev/null | tail -n +6 | xargs -r rm

echo ""
echo "============================================"
echo "  DEPLOY SUCCESSFUL!"
echo "  Finished: $(date)"
echo "============================================"
