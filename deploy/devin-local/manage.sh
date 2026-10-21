#!/bin/sh
set -eu

DEPLOY_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo "Missing local credentials: $DEPLOY_DIR/.env" >&2
  exit 1
fi
compose() {
  docker compose --project-name sub2api-devin-local --env-file "$DEPLOY_DIR/.env" -f "$DEPLOY_DIR/compose.yaml" "$@"
}
case "${1:-status}" in
  start) compose up -d --no-build ;;
  stop) compose stop ;;
  restart) compose restart ;;
  status) compose ps ;;
  logs) compose logs --tail 100 sub2api ;;
  rebuild) compose build sub2api; compose up -d --no-build ;;
  *) echo "Usage: $0 {start|stop|restart|status|logs|rebuild}" >&2; exit 2 ;;
esac
