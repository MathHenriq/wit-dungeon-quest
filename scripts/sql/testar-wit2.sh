#!/usr/bin/env bash
# Testa docs/sql/wit2-banco.sql + wit2-seed.sql num Postgres 16 local (temporário).
#   bash scripts/sql/testar-wit2.sh
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
PGBIN=/usr/lib/postgresql/16/bin
DIR=$(mktemp -d)
chown postgres "$DIR" 2>/dev/null || true
run() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
run "$PGBIN/initdb -D $DIR/db -A trust -U postgres >/dev/null"
run "$PGBIN/pg_ctl -D $DIR/db -o '-p 54329 -k $DIR' -l $DIR/log start >/dev/null"
trap 'run "$PGBIN/pg_ctl -D $DIR/db stop -m fast >/dev/null"; rm -rf "$DIR"' EXIT
sleep 2
P="env PGOPTIONS=-cclient_min_messages=warning psql -h $DIR -p 54329 -U postgres -v ON_ERROR_STOP=1 -q"
$P -f "$ROOT/scripts/sql/stubs-supabase.sql" >/dev/null
$P -f "$ROOT/docs/sql/wit2-banco.sql" >/dev/null
$P -f "$ROOT/docs/sql/wit2-seed.sql" >/dev/null
OUT=$($P -t -A -f "$ROOT/scripts/sql/teste-wit2.sql" | grep -vE '^[0-9a-f-]{36}$')
echo "$OUT" | grep -c '^t$' | xargs -I{} echo "{} verificações"
if echo "$OUT" | grep -q '^f$'; then echo "FALHOU: alguma verificação deu falso"; echo "$OUT"; exit 1; fi
echo "ok: wit2-banco.sql passou"
