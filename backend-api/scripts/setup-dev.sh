#!/bin/bash

# =============================================================================
# Script de Inicialización para Desarrollo
# =============================================================================
# Este script configura el entorno de desarrollo para el backend API.
# Uso: ./scripts/setup-dev.sh

set -e  # Salir si hay algún error

echo "🚀 Iniciando configuración del entorno de desarrollo..."

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

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL no está instalado o no está en el PATH."
    echo "   Puedes instalarlo o usar Docker: docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:alpine"
fi

# Verificar Redis
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis no está instalado o no está en el PATH."
    echo "   Puedes instalarlo o usar Docker: docker run -d --name redis -p 6379:6379 redis:alpine"
fi

# =============================================================================
# Configurar variables de entorno
# =============================================================================
echo ""
echo "📝 Configurando variables de entorno..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado desde .env.example"
        echo "⚠️  Por favor, edita el archivo .env con tus configuraciones locales."
    else
        echo "❌ No se encontró .env.example"
        exit 1
    fi
else
    echo "✅ Archivo .env ya existe"
fi

# =============================================================================
# Instalar dependencias
# =============================================================================
echo ""
echo "📦 Instalando dependencias..."
npm install
echo "✅ Dependencias instaladas"

# =============================================================================
# Verificar conexión a base de datos
# =============================================================================
echo ""
echo "🗄️  Verificando conexión a base de datos..."

# Extraer DATABASE_URL del .env
if [ -f .env ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)
    if [ -n "$DATABASE_URL" ]; then
        echo "   DATABASE_URL configurada"
        # Intentar conectar a la base de datos
        if command -v psql &> /dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
                echo "✅ Conexión a base de datos exitosa"
            else
                echo "⚠️  No se pudo conectar a la base de datos."
                echo "   Verifica que PostgreSQL esté corriendo y la URL sea correcta."
            fi
        fi
    else
        echo "⚠️  DATABASE_URL no está configurada en .env"
    fi
fi

# =============================================================================
# Verificar conexión a Redis
# =============================================================================
echo ""
echo "🔴 Verificando conexión a Redis..."

# Extraer REDIS_URL del .env
if [ -f .env ]; then
    REDIS_URL=$(grep "^REDIS_URL=" .env | cut -d'=' -f2-)
    if [ -n "$REDIS_URL" ]; then
        echo "   REDIS_URL configurada"
        # Intentar conectar a Redis
        if command -v redis-cli &> /dev/null; then
            if redis-cli -u "$REDIS_URL" ping &> /dev/null; then
                echo "✅ Conexión a Redis exitosa"
            else
                echo "⚠️  No se pudo conectar a Redis."
                echo "   Verifica que Redis esté corriendo y la URL sea correcta."
            fi
        fi
    else
        echo "⚠️  REDIS_URL no está configurada en .env"
    fi
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
echo "✅ Configuración del entorno de desarrollo completada"
echo "============================================================================= "
echo ""
echo "📝 Próximos pasos:"
echo "   1. Edita el archivo .env con tus configuraciones locales"
echo "   2. Asegúrate de que PostgreSQL y Redis estén corriendo"
echo "   3. Ejecuta 'npm run dev' para iniciar el servidor en modo desarrollo"
echo ""
echo "📚 Comandos útiles:"
echo "   npm run dev      - Iniciar servidor en modo desarrollo (con hot reload)"
echo "   npm run start    - Iniciar servidor en modo producción"
echo "   npm run typecheck - Verificar tipos de TypeScript"
echo ""
