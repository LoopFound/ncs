#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Zero-downtime release on a single VPS (run from the app directory, e.g. /opt/ncs).
# CI calls this over SSH (.github/workflows/deploy-vps.yml); it also works by hand:
#
#   infra/vps/deploy.sh <app-image> <migrate-image>   # release new images
#   infra/vps/deploy.sh rollback                      # back to the previous release
#
# Steps: pull → pre-deploy backup → migrations → start new app containers next to the
# old ones → wait until healthy → retire the old ones → restart worker → reconcile the
# rest of the stack. If the new containers never become healthy they are removed and
# the old release keeps serving.
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/../.."

export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
STATE_DIR="${STATE_DIR:-.deploy}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"

compose() { docker compose --env-file "$ENV_FILE" "$@"; }
log() { printf '[deploy %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

[ -f "$ENV_FILE" ] || die "$ENV_FILE not found in $(pwd)"
mkdir -p "$STATE_DIR"

# One deploy at a time.
if command -v flock >/dev/null; then
  exec 9>"$STATE_DIR/lock"
  flock -n 9 || die "another deploy is running"
fi

MODE=release
if [ "${1:-}" = "rollback" ]; then
  MODE=rollback
  [ -s "$STATE_DIR/previous" ] || die "no previous release recorded"
  read -r APP_IMAGE MIGRATE_IMAGE < "$STATE_DIR/previous"
else
  APP_IMAGE="${1:?usage: deploy.sh <app-image> <migrate-image> | rollback}"
  MIGRATE_IMAGE="${2:?usage: deploy.sh <app-image> <migrate-image> | rollback}"
fi
export APP_IMAGE MIGRATE_IMAGE
log "$MODE: app=$APP_IMAGE migrate=$MIGRATE_IMAGE"

if [ "${SKIP_PULL:-0}" != "1" ]; then
  log "pulling images"
  docker pull -q "$APP_IMAGE" >/dev/null
  [ "$MODE" = rollback ] || docker pull -q "$MIGRATE_IMAGE" >/dev/null
fi

log "ensuring database, cache and pooler are up"
compose up -d --wait postgres redis pgbouncer

if [ "$MODE" = release ]; then
  log "pre-deploy backup"
  compose run --rm --no-deps -T --entrypoint sh backup -c \
    'f=/backups/ncs-predeploy-$(date -u +%Y%m%dT%H%M%SZ).dump; pg_dump --format=custom --no-owner --file="$f" && echo "wrote $f"'

  log "running migrations"
  compose run --rm --no-deps -T migrate
else
  log "rollback: skipping migrations (they are forward-only; keep them backward-compatible)"
fi

# Waits until every given container reports healthy; fails fast if one exits or turns unhealthy.
wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT)) id status pending
  while :; do
    pending=0
    for id in "$@"; do
      status=$(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$id" 2>/dev/null || echo "missing missing")
      case "$status" in
        "running healthy" | "running none") ;;
        "running starting") pending=1 ;;
        *) log "container ${id:0:12} is $status"; return 1 ;;
      esac
    done
    [ "$pending" = 0 ] && return 0
    [ "$SECONDS" -ge "$deadline" ] && { log "timed out after ${HEALTH_TIMEOUT}s"; return 1; }
    sleep 3
  done
}

mapfile -t OLD < <(compose ps -q app)
if [ "${#OLD[@]}" -eq 0 ]; then
  log "no running app containers: starting fresh"
  compose up -d --no-deps app
  mapfile -t NEW < <(compose ps -q app)
  wait_healthy "${NEW[@]}" || { compose logs --tail 50 app >&2 || true; die "app did not become healthy"; }
else
  log "starting ${#OLD[@]} new app container(s) alongside the current ones"
  compose up -d --no-deps --no-recreate --scale app=$((${#OLD[@]} * 2)) app
  mapfile -t NEW < <(compose ps -q app | grep -v -x -F -f <(printf '%s\n' "${OLD[@]}") || true)
  [ "${#NEW[@]}" -gt 0 ] || die "no new app containers were created"
  if ! wait_healthy "${NEW[@]}"; then
    for id in "${NEW[@]}"; do docker logs --tail 40 "$id" >&2 2>&1 || true; done
    docker rm -f "${NEW[@]}" >/dev/null
    die "new release unhealthy; removed it, the previous release is still serving"
  fi
  log "new containers healthy; retiring the old ones"
  # Caddy retries a refused connection on another replica, so in-flight traffic is not lost.
  docker stop -t 30 "${OLD[@]}" >/dev/null
  docker rm "${OLD[@]}" >/dev/null
fi

log "restarting worker (finishes in-flight jobs first)"
compose up -d --no-deps worker

# Apply config changes to everything else (no-op when unchanged) and reload Caddy's config.
mapfile -t OTHERS < <(compose config --services | grep -v -x -e app -e worker -e migrate)
log "reconciling: ${OTHERS[*]}"
compose up -d --no-deps "${OTHERS[@]}"
compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || log "caddy reload skipped"

# Remember releases for rollback.
if [ "$MODE" = release ]; then
  if [ -s "$STATE_DIR/current" ]; then cp "$STATE_DIR/current" "$STATE_DIR/previous"; fi
  echo "$APP_IMAGE $MIGRATE_IMAGE" > "$STATE_DIR/current"
else
  cp "$STATE_DIR/current" "$STATE_DIR/previous.tmp"
  echo "$APP_IMAGE $MIGRATE_IMAGE" > "$STATE_DIR/current"
  mv "$STATE_DIR/previous.tmp" "$STATE_DIR/previous"
fi

# Free disk: keep only the current and previous releases of each image.
keep=$(cat "$STATE_DIR/current" "$STATE_DIR/previous" 2>/dev/null | tr ' ' '\n' | sort -u || true)
for image in "$APP_IMAGE" "$MIGRATE_IMAGE"; do
  docker images --format '{{.Repository}}:{{.Tag}}' "${image%:*}" | grep -v -x -F "$keep" | xargs -r docker rmi >/dev/null 2>&1 || true
done
docker image prune -f >/dev/null

log "done: $(compose ps --format '{{.Service}} {{.Status}}' app worker | sort | uniq -c | tr -s ' ' | paste -sd ';' -)"
