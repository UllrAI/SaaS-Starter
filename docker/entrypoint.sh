#!/bin/sh

set -eu

if [ "$(id -u)" = "0" ]; then
  exec su-exec nextjs:nodejs "$@"
fi

exec "$@"
