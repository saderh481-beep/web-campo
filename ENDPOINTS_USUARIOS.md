# Endpoints para División de Usuarios

## 1. GESTIÓN DE USUARIOS (Admin/Coordinadores)
**Ruta Frontend:** `/usuarios` (solo accesible para admin/coordinador)

### Endpoints Backend Requeridos:

#### GET `/api/usuarios`
- **Autenticación:** Requerida (Admin/Coordinador)
- **Descripción:** Listar todos los usuarios del sistema
- **Response:**
```json
{
  "success": true,
  "usuarios": [
    {
      "usuario_id": "1",
      "nombre": "Juan",
      "correo": "juan@example.com",
      "rol": "coordinador",
      "telefono": "3001234567",
      "coordinador_id": null,
      "fecha_limite": "2026-12-31",
      "activo": true,
      "created_at": "2026-01-01",
      "updated_at": "2026-04-08"
    }
  ]
}
```

#### POST `/api/usuarios`
- **Autenticación:** Requerida (Admin/Coordinador)
- **Descripción:** Crear nuevo usuario en el sistema
- **Request Body:**
```json
{
  "nombre": "Nuevo Usuario",
  "correo": "nuevo@example.com",
  "rol": "tecnico",
  "codigo_acceso": "TECH-12345",
  "telefono": "3009876543",
  "coordinador_id": "1",
  "fecha_limite": "2026-12-31"
}
```
- **Response:** 201 Created
```json
{
  "success": true,
  "usuario": {
    "usuario_id": "2",
    "nombre": "Nuevo Usuario",
    "correo": "nuevo@example.com",
    "rol": "tecnico",
    "activo": true,
    "created_at": "2026-04-08"
  }
}
```

#### PATCH `/api/usuarios/{id}`
- **Autenticación:** Requerida (Admin/Coordinador)
- **Descripción:** Actualizar usuario existente
- **Request Body:**
```json
{
  "nombre": "Nombre Actualizado",
  "correo": "actualizado@example.com",
  "activo": true,
  "telefono": "3005555555",
  "fecha_limite": "2027-12-31"
}
```
- **Response:** 200 OK
```json
{
  "success": true,
  "usuario": {
    "usuario_id": "2",
    "nombre": "Nombre Actualizado",
    "correo": "actualizado@example.com",
    "rol": "tecnico",
    "activo": true
  }
}
```

#### DELETE `/api/usuarios/{id}`
- **Autenticación:** Requerida (Admin)
- **Descripción:** Eliminar usuario (soft delete)
- **Response:** 200 OK
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente"
}
```

#### DELETE `/api/usuarios/{id}/force`
- **Autenticación:** Requerida (Admin)
- **Descripción:** Eliminar usuario (hard delete)
- **Response:** 200 OK

---

## 2. REGISTRO DE USUARIOS (Público)
**Ruta Frontend:** `/registro` o `/auth/register` (SIN autenticación requerida)

### Endpoints Backend Requeridos:

#### POST `/api/auth/register`
- **Autenticación:** NO Requerida (Pública)
- **Descripción:** Registrar nuevo usuario en el sistema
- **Request Body:**
```json
{
  "nombre": "Juan Pérez",
  "correo": "juan.perez@example.com",
  "password": "contrasena_segura_123",
  "telefono": "3001234567"
}
```
- **Response:** 201 Created
```json
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "usuario": {
    "usuario_id": "123",
    "nombre": "Juan Pérez",
    "correo": "juan.perez@example.com",
    "rol": "tecnico",
    "activo": false,
    "created_at": "2026-04-08"
  }
}
```
- **Errores:**
```json
{
  "success": false,
  "error": "El correo ya está registrado"
}
```

#### POST `/api/auth/verify-email`
- **Autenticación:** NO Requerida
- **Descripción:** Verificar email para activación de cuenta
- **Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```
- **Response:** 200 OK
```json
{
  "success": true,
  "message": "Email verificado correctamente"
}
```

#### POST `/api/auth/resend-verification`
- **Autenticación:** NO Requerida (pero requiere correo)
- **Descripción:** Reenviar correo de verificación
- **Request Body:**
```json
{
  "correo": "juan.perez@example.com"
}
```

---

## Comparativa de Endpoints

| Operación | Gestión Usuarios | Registro Público |
|-----------|------------------|-----------------|
| Crear Usuario | POST `/api/usuarios` (Auth: Admin/Coord) | POST `/api/auth/register` (Sin Auth) |
| Listar Usuarios | GET `/api/usuarios` (Auth: Admin/Coord) | N/A |
| Actualizar Usuario | PATCH `/api/usuarios/{id}` (Auth: Admin) | N/A |
| Eliminar Usuario | DELETE `/api/usuarios/{id}` (Auth: Admin) | N/A |
| Verificar Email | N/A | POST `/api/auth/verify-email` |

---

## Consideraciones Importantes:

1. **Roles diferentes en registro:**
   - Admin/Coordinador crean usuarios con cualquier rol y permisos específicos
   - Usuarios que se registran públicamente siempre empiezan como "tecnico" con estatus inactivo hasta verificación

2. **Validaciones:**
   - Registro público: validar email único, contraseña fuerte, teléfono (opcional)
   - Gestión admin: validar todos los campos, verificar pertenencia a coordinador

3. **Seguridad:**
   - Los endpoints de gestión deben verificar permisos (solo admin/coordinador)
   - El registro público debe tener rate limiting
   - Las contraseñas NUNCA deben viajar sin HTTPS

4. **Códigos de Acceso:**
   - Los administradores/coordinadores cuentan con código_acceso generado y específico
   - Los usuarios que se registran públicamente NO tienen código de acceso (usan contraseña)
