#!/bin/sh
set -e

# Ignora argumentos externos (por ejemplo, Start Command viejo en Railway)
# y arranca siempre Caddy con la configuracion del proyecto.
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
