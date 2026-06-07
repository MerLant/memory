#!/usr/bin/env bash
set -e

if [ ! -f database/database.sqlite ]; then
  touch database/database.sqlite
fi

php artisan migrate --force --no-interaction
php artisan config:clear >/dev/null 2>&1 || true

exec "$@"
