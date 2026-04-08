# Diagnóstico de Errores - Aplicación CAMPO Web

## Errores Reportados

### 1. **401 Unauthorized en `/usuarios`** ❌
**Causa:** El usuario actual no tiene permisos para listar usuarios
**Solución:**
- Verifica que el usuario logueado tenga rol de **admin**
- Si necesitas solo coordinadores, crea un endpoint específico `/usuarios/coordinadores`
- Alternativa: Filtra usuarios en el backend antes de enviar

### 2. **500 Internal Server Error en `/beneficiarios`** ❌
**Causa:** Error del backend al procesar la solicitud
**Acciones necesarias:**
- Revisa los logs del backend en Railway
- Verifica que los datos obligatorios se están enviando:
  - `nombre` (string requerido)
  - `municipio` (string requerido)
  - `tecnico_id` (uuid / número requerido)
- Valida que los IDs de técnicos existan en la base de datos

### 3. **400 Bad Request en `/asignaciones/coordinador-tecnico`** ✅ CORREGIDO
**Causa:** `fecha_limite` vacía o mal formada
**Solución implementada:**
- Ahora valida que `fecha_limite` no esté vacía
- Convierte correctamente a formato ISO 8601
- Lanza error si la fecha es inválida

### 4. **500 Internal Server Error en `/asignaciones/beneficiario` y `/asignaciones/actividad`** ❌
**Causa:** Problemas del backend
**Acciones necesarias:**
- Revisa logs del backend
- Verifica que existan registros relacionados:
  - El técnico debe existir
  - El beneficiario/actividad debe existir
  - No debe haber duplicados

---

## Checklist de Verificación

### En el Frontend (ya hecho) ✅
- [x] Mejorada validación de fecha_limite
- [x] Mejor manejo de errores en formularios
- [x] Validación de campos requeridos

### En el Backend (POR HACER) ⚠️
- [ ] Revisar y mejorar validación en endpoint `/usuarios`
- [ ] Revisar y mejorar validación en `/beneficiarios`
- [ ] Revisar y mejorar validación en `/asignaciones/beneficiario`
- [ ] Revisar y mejorar validación en `/asignaciones/actividad`
- [ ] Agregar mejor manejo de errores con mensajes descriptivos
- [ ] Revisar permisos del usuario según su rol

---

## Cómo Debuggear

### 1. Abre la consola del navegador (F12)
- Ve a la pestaña "Network"
- Intenta la operación que falla
- Haz click en la solicitud que falla
- Ve a la pestaña "Response" para ver el error exacto del backend

### 2. Revisa los logs del servidor Railway
- Ve a https://railway.app
- Selecciona el proyecto `campo-api-web-campo-saas`
- Visualiza los logs en tiempo real
- Busca los errores cuando hagas las peticiones fallidas

### 3. Verifica tu rol de usuario
```javascript
// En la consola del navegador:
localStorage.getItem('campo_auth_user')
// Revisa el campo 'rol'
```

---

## Próximas Acciones

1. **Publica los cambios del frontend** (validación mejorada)
2. **Revisa y corrige los errores del backend**
3. **Prueba nuevamente** cada funcionalidad
