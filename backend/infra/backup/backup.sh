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
#   BACKUP_VERIFY_RESTORE=1    after each dump, restore it into a throwaway database and query it
#   BACKUP_MEDIA_DIR           optional: directory (e.g. SeaweedFS /data mounted read-only) mirrored
#                              to the off-site remote under <prefix>/media
#   restore-test               `sh /backup.sh restore-test` restores the newest local dump into a
#                              throwaway DB and exits 0/1
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

# Restores a dump into a throwaway database and checks that core tables are readable.
# Needs CREATEDB rights for the PG* user. Returns non-zero when the dump is not restorable.
verify_restore() {
  dump="$1"
  scratch="ncs_restore_test_$$"
  psql -d postgres -v ON_ERROR_STOP=1 -qc "CREATE DATABASE \"${scratch}\"" || return 1
  ok=0
  if pg_restore -d "${scratch}" --no-owner --exit-on-error "${dump}" >/dev/null 2>&1      && psql -d "${scratch}" -v ON_ERROR_STOP=1 -tAc 'SELECT count(*) FROM "Order"' >/dev/null 2>&1; then
    ok=1
  fi
  psql -d postgres -qc "DROP DATABASE IF EXISTS \"${scratch}\"" >/dev/null 2>&1 || echo "[backup] could not drop ${scratch}" >&2
  [ "$ok" = 1 ]
}

# Returns non-zero (after pinging /fail) on any failure; the loop below keeps running, but
# BACKUP_RUN_NOW exits non-zero so manual runs and cron-style wrappers notice.
run_backup() {
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  file="/backups/ncs-${stamp}.dump"
  status=0
  echo "[backup] starting ${file}"
  if pg_dump --format=custom --no-owner --file="${file}.partial" && pg_restore --list "${file}.partial" >/dev/null; then
    mv "${file}.partial" "${file}"
    echo "[backup] wrote ${file} ($(du -h "${file}" | cut -f1))"
  else
    echo "[backup] FAILED: pg_dump or archive check" >&2
    rm -f "${file}.partial"
    ping /fail
    return 1
  fi

  # Local retention is independent of upload success.
  find /backups -name 'ncs-*.dump' -mtime +"${RETENTION_DAYS:-14}" -delete     || { echo "[backup] local retention FAILED" >&2; status=1; }

  if [ "${BACKUP_VERIFY_RESTORE:-0}" = "1" ]; then
    if verify_restore "${file}"; then echo "[backup] restore verification passed"
    else echo "[backup] restore verification FAILED" >&2; status=1; fi
  fi

  if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    if ! command -v rclone >/dev/null 2>&1; then
      echo "[backup] off-site upload FAILED: rclone is not installed" >&2
      status=1
    else
      dest="offsite:${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-ncs}"
      if rclone copyto --s3-no-check-bucket "${file}" "${dest}/$(basename "${file}")"; then
        echo "[backup] uploaded to ${dest}"
        rclone delete --min-age "${BACKUP_S3_RETENTION_DAYS:-30}d" --include 'ncs-*.dump' "${dest}"           || { echo "[backup] off-site retention FAILED" >&2; status=1; }
      else
        echo "[backup] off-site upload FAILED" >&2
        status=1
      fi
      # Media: SeaweedFS keeps objects on its own volume. Mount that volume read-only at
      # BACKUP_MEDIA_DIR (see README) and it is mirrored here; AWS S3/Spaces/R2 need no copy.
      if [ -n "${BACKUP_MEDIA_DIR:-}" ]; then
        if [ -d "${BACKUP_MEDIA_DIR}" ] && rclone sync --s3-no-check-bucket "${BACKUP_MEDIA_DIR}" "${dest}/media"; then
          echo "[backup] media mirrored to ${dest}/media"
        else
          echo "[backup] media backup FAILED" >&2
          status=1
        fi
      fi
    fi
  fi

  if [ "$status" -ne 0 ]; then ping /fail; return 1; fi
  ping ""
}

if [ "${BACKUP_RUN_NOW:-0}" = "1" ]; then
  run_backup
  exit $?
fi

# Verify the newest local dump restores cleanly, then exit (does not take a new backup).
if [ "${1:-}" = "restore-test" ] || [ "${BACKUP_RESTORE_TEST:-0}" = "1" ]; then
  latest=$(ls -1t /backups/ncs-*.dump 2>/dev/null | head -n1)
  [ -n "${latest}" ] || { echo "[backup] no dump found" >&2; exit 1; }
  if verify_restore "${latest}"; then echo "[backup] restore-test OK: ${latest}"; exit 0; fi
  echo "[backup] restore-test FAILED: ${latest}" >&2
  exit 1
fi

hour="${BACKUP_HOUR_UTC:-21}"
while true; do
  now=$(date -u +%s)
  next=$(date -u -d "$(date -u +%Y-%m-%d) ${hour}:00:00" +%s)
  [ "$next" -gt "$now" ] || next=$((next + 86400))
  echo "[backup] next backup at $(date -u -d "@${next}" '+%Y-%m-%d %H:%M UTC')"
  sleep $((next - now))
  run_backup || echo "[backup] run failed; will retry at the next scheduled time" >&2
done
