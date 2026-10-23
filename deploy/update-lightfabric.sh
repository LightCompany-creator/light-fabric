#!/usr/bin/env bash
# LightFabric: обновление цехового приложения на сервере фабрики (Linux / Apache, nginx).
#
# То же, что update-lightfabric.ps1: берёт последний выпуск из GitHub Releases,
# сравнивает с version.json в папке приложения, скачивает архив и меняет папки
# местами. Предыдущая версия остаётся в <каталог>.prev, откат: --rollback.
#
#   ./update-lightfabric.sh                 # проверить и обновить
#   ./update-lightfabric.sh --force         # поставить заново ту же версию
#   ./update-lightfabric.sh --rollback      # вернуть предыдущую
#
# Переменные: SITE_ROOT (по умолчанию /var/www/html), FOLDER (lightfabric),
# REPO (LightCompany-creator/light-fabric). В cron, каждые 30 минут:
#   */30 * * * * /opt/lightfabric/update-lightfabric.sh >> /var/log/lightfabric-update.log 2>&1
set -euo pipefail

REPO="${REPO:-LightCompany-creator/light-fabric}"
SITE_ROOT="${SITE_ROOT:-/var/www/html}"
FOLDER="${FOLDER:-lightfabric}"
LIVE="$SITE_ROOT/$FOLDER"
PREV="$LIVE.prev"
NEW="$LIVE.new"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
installed() { [ -f "$LIVE/version.json" ] && sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$LIVE/version.json" || true; }

if [ "${1:-}" = "--rollback" ]; then
  [ -d "$PREV" ] || { log "Откатывать нечего: $PREV нет"; exit 1; }
  current=$(installed)
  [ -d "$LIVE" ] && mv "$LIVE" "$LIVE.rolledback"
  mv "$PREV" "$LIVE"
  [ -d "$LIVE.rolledback" ] && mv "$LIVE.rolledback" "$PREV"
  log "Откат: ${current:-ничего} -> $(installed)"
  exit 0
fi

current=$(installed)
json=$(curl -fsSL -H 'User-Agent: lightfabric-updater' "https://api.github.com/repos/$REPO/releases/latest")
version=$(printf '%s' "$json" | sed -n 's/.*"tag_name": *"v\{0,1\}\([^"]*\)".*/\1/p' | head -1)
[ -n "$version" ] || { log "Не удалось прочитать версию выпуска"; exit 1; }
if [ "$version" = "$current" ] && [ "${1:-}" != "--force" ]; then log "Стоит актуальная версия $current"; exit 0; fi

url=$(printf '%s' "$json" | grep -o "https://[^\"]*/$FOLDER-[^\"]*\.zip" | head -1)
[ -n "$url" ] || { log "В выпуске $version нет архива $FOLDER-*.zip"; exit 1; }

tmp=$(mktemp -d)
log "Скачиваю $url"
curl -fsSL -H 'User-Agent: lightfabric-updater' -o "$tmp/app.zip" "$url"
unzip -q "$tmp/app.zip" -d "$tmp/unpack"
[ -d "$tmp/unpack/$FOLDER" ] || { log "В архиве нет папки $FOLDER"; exit 1; }

rm -rf "$NEW" "$PREV"
mv "$tmp/unpack/$FOLDER" "$NEW"
[ -d "$LIVE" ] && mv "$LIVE" "$PREV"
mv "$NEW" "$LIVE"
rm -rf "$tmp"
log "Обновлено: ${current:-ничего} -> $(installed)"
