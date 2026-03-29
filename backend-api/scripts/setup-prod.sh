#!/bin/bash

# =============================================================================
# Script de Inicialización para Producción
# =============================================================================
# Este script configura el entorno de producción para el backend API.
# Uso: ./scripts/setup-prod.sh

set -e  # Salir si hay algún error

echo "🚀 Iniciando configuración del entorno de producción..."

# =============================================================================
# Verificar prerrequisitos
# =============================================================================
echo "📋 Verificando prerrequisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js 18 o superior."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versión 18 o superior es requerida. Versión actual: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    exit 1
fi
echo "✅ npm $(npm -v)"

# =============================================================================
# Verificar variables de entorno requeridas
# =============================================================================
echo ""
echo "🔐 Verificando variables de entorno requeridas..."

REQUIRED_VARS=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "CLOUDINARY_PRESET_IMAGENES"
    "CLOUDINARY_PRESET_DOCS"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Las siguientes variables de entorno requeridas no están configuradas:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 Configura estas variables de entorno antes de ejecutar este script."
    exit 1
fi

echo "✅ Todas las variables de entorno requeridas están configuradas"

# =============================================================================
# Instalar dependencias de producción
# =============================================================================
echo ""
echo "📦 Instalando dependencias de producción..."
npm ci --only=production
echo "✅ Dependencias de producción instaladas"

# =============================================================================
# Verificar conexión a base de datos
# =============================================================================
echo ""
echo "🗄️  Verificando conexión a base de datos..."

if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
        echo "✅ Conexión a base de datos exitosa"
    else
        echo "❌ No se pudo conectar a la base de datos."
        echo "   Verifica que PostgreSQL esté corriendo y la URL sea correcta."
        exit 1
    fi
else
    echo "⚠️  psql no está disponible, no se puede verificar la conexión a la base de datos."
fi

# =============================================================================
# Verificar conexión a Redis
# =============================================================================
echo ""
echo "🔴 Verificando conexión a Redis..."

if command -v redis-cli &> /dev/null; then
    if redis-cli -u "$REDIS_URL" ping &> /dev/null; then
        echo "✅ Conexión a Redis exitosa"
    else
        echo "❌ No se pudo conectar a Redis."
        echo "   Verifica que Redis esté corriendo y la URL sea correcta."
        exit 1
    fi
else
    echo "⚠️  redis-cli no está disponible, no se puede verificar la conexión a Redis."
fi

# =============================================================================
# Ejecutar typecheck
# =============================================================================
echo ""
echo "🔍 Ejecutando verificación de tipos..."
npm run typecheck
echo "✅ Verificación de tipos exitosa"

# =============================================================================
# Resumen
# =============================================================================
echo ""
echo "============================================================================= "
echo "✅ Configuración del entorno de producción completada"
echo "============================================================================= "
echo ""
echo "📝 Próximos pasos:"
echo "   1. Ejecuta 'npm run start' para iniciar el servidor en modo producción"
echo "   2. Configura un proceso manager (PM2, systemd, etc.) para mantener el servidor corriendo"
echo "   3. Configura un reverse proxy (Nginx, Caddy, etc.) para manejar SSL y balanceo de carga"
echo ""
echo "📚 Comandos útiles:"
echo "   npm run start    - Iniciar servidor en modo producción"
echo "   npm run typecheck - Verificar tipos de TypeScript"
echo ""
