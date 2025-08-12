#!/usr/bin/env bash
# scripts/wait-for-it.sh
# -----------------------------------------------------------------------------
# Waits for a host:port to become available before running a subsequent command.
# -----------------------------------------------------------------------------
# Usage: ./wait-for-it.sh host:port [-t timeout] [-- command args...]
# Example: ./wait-for-it.sh db:5432 -- npm run dev
# -----------------------------------------------------------------------------

set -e

HOST=""
PORT=""
TIMEOUT=15
QUIET=0

echoerr() {
  if [ "$QUIET" -ne 1 ]; then
    echo "$@" 1>&2
  fi
}

usage() {
  exitcode="$1"
  cat << USAGE >&2
Usage:
  $0 host:port [-t timeout] [-- command args...]
  -h HOST | --host=HOST       Host or IP under test
  -p PORT | --port=PORT       TCP port under test
  -t TIMEOUT                  Timeout in seconds (default: 15s)
  -q                          Quiet mode
  -- COMMAND ARGS             Execute command after host is reachable
USAGE
  exit "$exitcode"
}

while [ $# -gt 0 ]; do
  case "$1" in
    *:* )
      HOST=$(echo "$1" | cut -d : -f 1)
      PORT=$(echo "$1" | cut -d : -f 2)
      shift
      ;;
    -h)
      HOST="$2"
      shift 2
      ;;
    --host=*)
      HOST="${1#*=}"
      shift
      ;;
    -p)
      PORT="$2"
      shift 2
      ;;
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    -t)
      TIMEOUT="$2"
      shift 2
      ;;
    -q)
      QUIET=1
      shift
      ;;
    --)
      shift
      break
      ;;
    --help)
      usage 0
      ;;
    *)
      echoerr "Unknown argument: $1"
      usage 1
      ;;
  esac
done

if [ -z "$HOST" ] || [ -z "$PORT" ]; then
  echoerr "Error: You need to provide a host and port."
  usage 1
fi

start_ts=$(date +%s)
end_ts=$((start_ts + TIMEOUT))

while : ; do
  if nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
    end_ts=$(date +%s)
    echoerr "✅ $HOST:$PORT is available after $((end_ts - start_ts)) seconds"
    break
  fi
  now_ts=$(date +%s)
  if [ $now_ts -ge $end_ts ]; then
    echoerr "❌ Timeout after waiting $TIMEOUT seconds for $HOST:$PORT"
    exit 1
  fi
  sleep 1
done

if [ $# -gt 0 ]; then
  exec "$@"
fi
