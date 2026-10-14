#!/bin/sh
# Nightly pg_dump with retention. Runs inside the `backup` service.
#   BACKUP_HOUR_UTC            hour to run (default 21 = 02:30 IST)
#   RETENTION_DAYS             local copies to keep (default 14)
#   BACKUP_S3_BUCKET           when set, each dump is also uploaded off-site (any S3-compatible
#                              store: AWS S3, DigitalOcean Spaces, Cloudflare R2 …) via the
#                              rclone remote "offsite" configured by RCLONE_CONFIG_OFFSITE_* vars
#   BACKUP_S3_PREFIX           folder inside the bucket (default "ncs")
#   BACKUP_S3_RETENTION_DAYS   off-site copies to keep (default 30)
#   BACKUP_PING_URL            optional dead-man's switch (e.g. healthchecks.io); "/fail" is
#                              appended on failure
#   BACKUP_RUN_NOW=1           take one backup immediately, then exit (manual runs / tests)
set -eu
mkdir -p /backups

if [ -n "${BACKUP_S3_BUCKET:-}" ] && ! command -v rclone >/dev/null 2>&1; then
  apk add --no-cache rclone >/dev/null 2>&1 || echo "[backup] WARNING: could not install rclone; off-site upload disabled" >&2
fi

ping() {
  [ -n "${BACKUP_PING_URL:-}" ] || return 0
  wget -q -T 10 -O /dev/null "${BACKUP_PING_URL}$1" || echo "[backup] could not reach BACKUP_PING_URL" >&2
}

run_backup() {
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  file="/backups/ncs-${stamp}.dump"
  echo "[backup] starting ${file}"
  if pg_dump --format=custom --no-owner --file="${file}.partial" && pg_restore --list "${file}.partial" >/dev/null; then
    mv "${file}.partial" "${file}"
    echo "[backup] wrote ${file} ($(du -h "${file}" | cut -f1))"
  else
    echo "[backup] FAILED" >&2
    rm -f "${file}.partial"
    ping /fail
    return 0
  fi
  find /backups -name 'ncs-*.dump' -mtime +"${RETENTION_DAYS:-14}" -delete

  if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v rclone >/dev/null 2>&1; then
    dest="offsite:${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-ncs}"
    if rclone copyto --s3-no-check-bucket "${file}" "${dest}/$(basename "${file}")"; then
      echo "[backup] uploaded to ${dest}"
      rclone delete --min-age "${BACKUP_S3_RETENTION_DAYS:-30}d" --include 'ncs-*.dump' "${dest}" || true
    else
      echo "[backup] off-site upload FAILED" >&2
      ping /fail
      return 0
    fi
  fi
  ping ""
}

if [ "${BACKUP_RUN_NOW:-0}" = "1" ]; then
  run_backup
  exit 0
fi

hour="${BACKUP_HOUR_UTC:-21}"
while true; do
  now=$(date -u +%s)
  next=$(date -u -d "$(date -u +%Y-%m-%d) ${hour}:00:00" +%s)
  [ "$next" -gt "$now" ] || next=$((next + 86400))
  echo "[backup] next backup at $(date -u -d "@${next}" '+%Y-%m-%d %H:%M UTC')"
  sleep $((next - now))
  run_backup
done
