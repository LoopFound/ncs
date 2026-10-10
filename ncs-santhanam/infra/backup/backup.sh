#!/bin/sh
# Nightly pg_dump with retention. Runs inside the `backup` service.
set -eu
mkdir -p /backups
while true; do
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  file="/backups/ncs-${stamp}.dump"
  echo "[backup] starting ${file}"
  if pg_dump --format=custom --no-owner --file="${file}.partial"; then
    mv "${file}.partial" "${file}"
    echo "[backup] wrote ${file} ($(du -h "${file}" | cut -f1))"
  else
    echo "[backup] FAILED" >&2
    rm -f "${file}.partial"
  fi
  find /backups -name 'ncs-*.dump' -mtime +"${RETENTION_DAYS:-14}" -delete
  sleep 86400
done
