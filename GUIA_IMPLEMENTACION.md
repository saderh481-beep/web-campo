# Guía de Implementación - División de Usuarios

## 📋 Resumen de cambios

Se ha dividido la funcionalidad de usuarios en **dos secciones completamente independientes**:

1. **Gestión de Usuarios** (Admin/Coordinadores)
2. **Registro Público** (Usuarios nuevos)

---

## 🗂️ Estructura de archivos creados

### Servicios
```
src/
├── lib/
│   └── servicios/
│       ├── gestion-usuarios.ts    ✨ NUEVO - Gestión de usuarios (requiere autenticación)
│       ├── registro.ts             ✨ NUEVO - Registro público (sin autenticación)
│       ├── usuarios.ts             (mantener para compatibilidad hacia atrás)
│       └── index.ts                (actualizar importaciones)
```

### Páginas
```
src/
└── pages/
    ├── GestionUsuariosPage.tsx     ✨ NUEVO - Gestión de usuarios (Admin/Coordinadores)
    ├── RegistroPage.tsx             ✨ NUEVO - Registro público (sin autenticación)
    ├── UsuariosPage.tsx             (puede eliminarse o mantener para compatibilidad)
    └── LoginPage.tsx                (mantener igual)
```

### Documentación
```
├── ENDPOINTS_USUARIOS.md            ✨ NUEVO - Especificación de endpoints
└── GUIA_IMPLEMENTACION.md           ✨ NUEVO - Esta guía
```

---

## 🎯 Pasos de implementación

### Paso 1: Exportar nuevos servicios en índice

Actualizar [src/lib/servicios/index.ts](src/lib/servicios/index.ts):

```typescript
// Servicios de usuarios
export * from './gestion-usuarios'
export { gestionUsuariosService } from './gestion-usuarios'
export { registroService } from './registro'

// Mantener compatibilidad hacia atrás
export * from './usuarios'
export { usuariosService } from './usuarios'
```

### Paso 2: Agregar rutas a tu router

En tu archivo de configuración de rutas (ej: `App.tsx` o `router.tsx`):

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/auth/AuthGuard'
import GestionUsuariosPage from './pages/GestionUsuariosPage'
import RegistroPage from './pages/RegistroPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      {/* Ruta pública - Registro sin autenticación */}
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/auth/register" element={<RegistroPage />} />

      {/* Ruta protegida - Gestión de usuarios (solo admin/coordinador) */}
      <Route
        path="/usuarios"
        element={
          <AuthGuard requiredRoles={['admin', 'coordinador']}>
            <GestionUsuariosPage />
          </AuthGuard>
        }
      />

      {/* Rutas existentes */}
      <Route path="/login" element={<LoginPage />} />
      {/* ... resto de rutas */}
    </Routes>
  )
}
```

### Paso 3: Actualizar la navegación (si corresponde)

Si tienes un menú de navegación, actualizar para que:

- **Usuarios registrados sin autenticación** vean: `/registro` o `/auth/register`
- **Admin/Coordinadores autenticados** vean: `/usuarios` (Gestión de usuarios)

```typescript
// En tu componente de menú/navegación
import { useAuth } from './hooks/useAuth'

export function Navigation() {
  const { user } = useAuth()
  
  return (
    <nav>
      {!user ? (
        <>
          <a href="/login">Iniciar Sesión</a>
          <a href="/registro">Registrarse</a>
        </>
      ) : user.rol === 'admin' || user.rol === 'coordinador' ? (
        <>
          <a href="/usuarios">Gestionar Usuarios</a>
          {/* ... más opciones de admin */}
        </>
      ) : null}
    </nav>
  )
}
```

### Paso 4: Implementar endpoints en backend

Usar la especificación en [ENDPOINTS_USUARIOS.md](../ENDPOINTS_USUARIOS.md) para crear:

#### Para Gestión (rutas protegidas):
- ✅ `GET /api/usuarios` - Listar usuarios
- ✅ `POST /api/usuarios` - Crear usuario (Admin/Coordinador)
- ✅ `PATCH /api/usuarios/{id}` - Actualizar usuario
- ✅ `DELETE /api/usuarios/{id}` - Eliminar usuario (soft delete)
- ✅ `DELETE /api/usuarios/{id}/force` - Eliminar permanentemente

#### Para Registro (rutas públicas):
- ✅ `POST /api/auth/register` - Registrar nuevo usuario
- ✅ `POST /api/auth/verify-email` - Verificar email
- ✅ `POST /api/auth/resend-verification` - Reenviar correo

---

## 🔐 Consideraciones de Seguridad

### Gestión de Usuarios (Protegida)
```typescript
// AuthGuard debe verificar:
- Usuario está autenticado ✅
- Usuario tiene rol 'admin' o 'coordinador' ✅
```

### Registro Público (Sin protección)
```typescript
// Rate limiting en backend para:
- POST /api/auth/register (máximo 5 intentos por IP por hora)
- POST /api/auth/resend-verification (máximo 3 intentos por correo)

// Validaciones de servidor:
- Correo único ✅
- Contraseña mínimo 8 caracteres ✅
- Verificación de email antes de activar ✅
```

---

## 📱 Diferencias entre servicios

### `gestionUsuariosService` (protegido)

```typescript
// Uso en GestionUsuariosPage
const { data: usuarios } = await gestionUsuariosService.list()

// Crear usuario con rol y códigos específicos
await gestionUsuariosService.create({
  nombre: "Juan",
  correo: "juan@example.com",
  rol: "coordinador",
  codigo_acceso: "COORD-123",
  coordinador_id: "5",
  fecha_limite: "2026-12-31"
})
```

### `registroService` (público)

```typescript
// Uso en RegistroPage
const { usuario } = await registroService.register({
  nombre: "Juan Pérez",
  correo: "juan@example.com",
  password: "MiContraseña123",
  telefono: "3001234567"
})

// Usuario recién registrado siempre tiene:
// - rol: "tecnico"
// - activo: false (hasta verificar email)
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Registro Público
```
1. Usuario accede a /registro (sin autenticación)
2. Completa formulario (nombre, correo, contraseña)
3. POST /api/auth/register
4. Recibe correo de verificación
5. Hace clic en enlace o ingresa token
6. POST /api/auth/verify-email
7. Cuenta activada con rol "tecnico"
8. Puede iniciar sesión
```

### Flujo 2: Creación por Admin/Coordinador
```
1. Admin accede a /usuarios (debe estar autenticado)
2. Hace clic en "Nuevo Usuario"
3. Completa formulario (incluye rol y código de acceso)
4. POST /api/usuarios
5. Usuario creado inmediatamente activo
6. Sistema envía credenciales al correo (opcional)
```

---

## ⚠️ Checklist de Implementación

- [ ] Crear archivos de servicios (`gestion-usuarios.ts`, `registro.ts`)
- [ ] Crear páginas (`GestionUsuariosPage.tsx`, `RegistroPage.tsx`)
- [ ] Actualizar `src/lib/servicios/index.ts`
- [ ] Agregar rutas en `App.tsx` o router
- [ ] Actualizar navegación/menú
- [ ] Implementar endpoints backend (ver `ENDPOINTS_USUARIOS.md`)
- [ ] Agregar rate limiting en endpoints públicos
- [ ] Configurar verificación de email
- [ ] Probar flujo de registro
- [ ] Probar gestión de usuarios (como admin)
- [ ] Actualizar AuthGuard si es necesario
- [ ] Documentar en REAME.md

---

## 📚 Referencias

- [Especificación de Endpoints](../ENDPOINTS_USUARIOS.md)
- [Validaciones](src/lib/validation.ts)
- [Auth Guard](src/components/auth/AuthGuard.tsx)
- [Servicio de Usuarios Original](src/lib/servicios/usuarios.ts)

---

## ✨ Ventajas de esta implementación

✅ **Seguridad mejorada** - Endpoints públicos y privados claramente separados  
✅ **Sin conflictos** - Rutas y servicios distintos evitan confusiones  
✅ **Escalabilidad** - Fácil agregar más funcionalidades en cada sección  
✅ **Mantenibilidad** - Código más organizado y modular  
✅ **Compatibilidad** - Servicio anterior se mantiene para transición suave
