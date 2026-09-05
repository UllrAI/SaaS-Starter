#!/usr/bin/env bash
set -euo pipefail
: "${MIGRATION_SSH_HOST:?Configure the production SSH host}"
: "${MIGRATION_DB_HOST:?Configure the PostgreSQL private address}"
: "${MIGRATION_SSH_KEY:?Configure the migration-only SSH key}"
: "${MIGRATION_SSH_KNOWN_HOSTS:?Configure the verified SSH host key}"
umask 077
tunnel_dir="$(mktemp -d)"
cleanup() {
  ssh -S "$tunnel_dir/control" -O exit "saas-migrator@$MIGRATION_SSH_HOST" 2>/dev/null || true
  rm -rf "$tunnel_dir"
}
trap cleanup EXIT
printf '%s\n' "$MIGRATION_SSH_KEY" > "$tunnel_dir/key"
printf '%s\n' "$MIGRATION_SSH_KNOWN_HOSTS" > "$tunnel_dir/known_hosts"
ssh -M -S "$tunnel_dir/control" -fnNT \
  -i "$tunnel_dir/key" -o IdentitiesOnly=yes -o BatchMode=yes \
  -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$tunnel_dir/known_hosts" \
  -o ExitOnForwardFailure=yes -o ConnectTimeout=15 \
  -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
  -L "127.0.0.1:55432:$MIGRATION_DB_HOST:5432" \
  "saas-migrator@$MIGRATION_SSH_HOST"
"$@"
