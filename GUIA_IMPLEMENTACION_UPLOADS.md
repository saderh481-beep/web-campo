# Guía de Implementación - Uploads de Bitácoras

## 📋 Resumen

Se agregaron endpoints para subir imágenes, firmas y PDFs a las bitácoras. El frontend ya está actualizado para enviar y mostrar estos archivos.

---

## 🔧 Endpoints Requeridos (Backend)

### 1. Beneficiarios - Foto del Rostro

```typescript
// POST /api/v1/beneficiarios/:id/foto-rostro
// Body: FormData con campo 'archivo' (imagen)
// Response: { url: string, secure_url: string }

router.post('/:id/foto-rostro', upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const file = req.file
  
  // 1. Validar que el archivo sea imagen
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Solo se permiten imágenes' })
  }
  
  // 2. Subir a Cloudflare R2
  const key = `beneficiarios/${id}/foto-rostro/${Date.now()}-${file.originalname}`
  await r2.upload(file.buffer, key, file.mimetype)
  
  // 3. Guardar URL en la base de datos (tabla beneficiarios)
  await db.beneficiarios.update({
    where: { id: parseInt(id) },
    data: { foto_rostro_key: key }
  })
  
  // 4. Retornar URL pública
  const url = `${R2_PUBLIC_URL}/${key}`
  res.json({ url, secure_url: url })
})

// GET /api/v1/beneficiarios/:id/foto-rostro
router.get('/:id/foto-rostro', async (req, res) => {
  const beneficiario = await db.beneficiarios.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  if (!beneficiario?.foto_rostro_key) {
    return res.status(404).json({ error: 'No encontrada' })
  }
  res.json({ url: `${R2_PUBLIC_URL}/${beneficiario.foto_rostro_key}` })
})

// DELETE /api/v1/beneficiarios/:id/foto-rostro
router.delete('/:id/foto-rostro', async (req, res) => {
  const beneficiario = await db.beneficiarios.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  if (beneficiario?.foto_rostro_key) {
    await r2.delete(beneficiario.foto_rostro_key)
    await db.beneficiarios.update({
      where: { id: parseInt(req.params.id) },
      data: { foto_rostro_key: null }
    })
  }
  res.json({ success: true })
})
```

### 2. Beneficiarios - Firma

```typescript
// POST /api/v1/beneficiarios/:id/firma
// Misma estructura que foto-rostro, pero guardar en campo 'firma_key'

router.post('/:id/firma', upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const file = req.file
  
  const key = `beneficiarios/${id}/firma/${Date.now()}-${file.originalname}`
  await r2.upload(file.buffer, key, file.mimetype)
  
  await db.beneficiarios.update({
    where: { id: parseInt(id) },
    data: { firma_key: key }
  })
  
  const url = `${R2_PUBLIC_URL}/${key}`
  res.json({ url, secure_url: url })
})
```

### 3. Bitácoras - Foto del Rostro

```typescript
// POST /api/v1/bitacoras/:id/foto-rostro

router.post('/:id/foto-rostro', authRequired, upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const file = req.file
  
  const key = `bitacoras/${id}/foto-rostro/${Date.now()}-${file.originalname}`
  await r2.upload(file.buffer, key, file.mimetype)
  
  await db.bitacoras.update({
    where: { id: parseInt(id) },
    data: { foto_rostro_url: `${R2_PUBLIC_URL}/${key}` }
  })
  
  res.json({ url: `${R2_PUBLIC_URL}/${key}`, secure_url: `${R2_PUBLIC_URL}/${key}` })
})

// GET /api/v1/bitacoras/:id/foto-rostro

router.get('/:id/foto-rostro', async (req, res) => {
  const bitacora = await db.bitacoras.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  if (!bitacora?.foto_rostro_url) {
    return res.status(404).json({ error: 'No encontrada' })
  }
  res.json({ url: bitacora.foto_rostro_url })
})

// DELETE /api/v1/bitacoras/:id/foto-rostro

router.delete('/:id/foto-rostro', authRequired, async (req, res) => {
  const bitacora = await db.bitacoras.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  if (bitacora?.foto_rostro_url) {
    await r2.delete(bitacora.foto_rostro_url.replace(R2_PUBLIC_URL + '/', ''))
    await db.bitacoras.update({
      where: { id: parseInt(req.params.id) },
      data: { foto_rostro_url: null }
    })
  }
  res.json({ success: true })
})
```

### 4. Bitácoras - Firma

```typescript
// POST /api/v1/bitacoras/:id/firma
// Misma estructura, guardar en campo 'firma_url'

router.post('/:id/firma', authRequired, upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const file = req.file
  
  const key = `bitacoras/${id}/firma/${Date.now()}-${file.originalname}`
  await r2.upload(file.buffer, key, file.mimetype)
  
  await db.bitacoras.update({
    where: { id: parseInt(id) },
    data: { firma_url: `${R2_PUBLIC_URL}/${key}` }
  })
  
  res.json({ url: `${R2_PUBLIC_URL}/${key}` })
})
```

### 5. Bitácoras - Fotos de Campo (Múltiples)

```typescript
// POST /api/v1/bitacoras/:id/fotos-campo
// Body: FormData con campo 'archivos' (múltiples archivos)

router.post('/:id/fotos-campo', authRequired, upload.array('archivos', 10), async (req, res) => {
  const { id } = req.params
  const files = req.files as Express.Multer.File[]
  
  const urls = await Promise.all(files.map(async (file) => {
    const key = `bitacoras/${id}/fotos-campo/${Date.now()}-${file.originalname}`
    await r2.upload(file.buffer, key, file.mimetype)
    return { url: `${R2_PUBLIC_URL}/${key}`, label: file.originalname }
  }))
  
  // Obtener fotos existentes y agregar nuevas
  const bitacora = await db.bitacoras.findUnique({ where: { id: parseInt(id) } })
  const fotosExistentes = bitacora?.fotos_campo_urls ? JSON.parse(bitacora.fotos_campo_urls) : []
  const nuevasFotos = [...fotosExistentes, ...urls]
  
  await db.bitacoras.update({
    where: { id: parseInt(id) },
    data: { fotos_campo_urls: JSON.stringify(nuevasFotos) }
  })
  
  res.json(nuevasFotos)
})

// GET /api/v1/bitacoras/:id/fotos-campo
router.get('/:id/fotos-campo', async (req, res) => {
  const bitacora = await db.bitacoras.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  const fotos = bitacora?.fotos_campo_urls ? JSON.parse(bitacora.fotos_campo_urls) : []
  res.json(fotos)
})

// DELETE /api/v1/bitacoras/:id/fotos-campo/:idx
router.delete('/:id/fotos-campo/:idx', authRequired, async (req, res) => {
  const { id, idx } = req.params
  const bitacora = await db.bitacoras.findUnique({ where: { id: parseInt(id) } })
  const fotos = bitacora?.fotos_campo_urls ? JSON.parse(bitacora.fotos_campo_urls) : []
  
  if (fotos[idx]) {
    await r2.delete(fotos[idx].url.replace(R2_PUBLIC_URL + '/', ''))
    fotos.splice(parseInt(idx), 1)
    
    await db.bitacoras.update({
      where: { id: parseInt(id) },
      data: { fotos_campo_urls: JSON.stringify(fotos) }
    })
  }
  
  res.json({ success: true })
})
```

### 6. Bitácoras - PDF de Actividades

```typescript
// POST /api/v1/bitacoras/:id/pdf-actividades
router.post('/:id/pdf-actividades', authRequired, upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const file = req.file
  
  if (file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Solo se permiten PDFs' })
  }
  
  const key = `bitacoras/${id}/pdf-actividades/${Date.now()}-${file.originalname}`
  await r2.upload(file.buffer, key, file.mimetype)
  
  await db.bitacoras.update({
    where: { id: parseInt(id) },
    data: { pdf_actividades_url: `${R2_PUBLIC_URL}/${key}` }
  })
  
  res.json({ url: `${R2_PUBLIC_URL}/${key}` })
})

// GET /api/v1/bitacoras/:id/pdf-actividades
router.get('/:id/pdf-actividades', async (req, res) => {
  const bitacora = await db.bitacoras.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  if (!bitacora?.pdf_actividades_url) {
    return res.status(404).json({ error: 'No encontrado' })
  }
  res.json({ url: bitacora.pdf_actividades_url })
})

// DELETE /api/v1/bitacoras/:id/pdf-actividades
router.delete('/:id/pdf-actividades', authRequired, async (req, res) => {
  const bitacora = await db.bitacoras.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  if (bitacora?.pdf_actividades_url) {
    await r2.delete(bitacora.pdf_actividades_url.replace(R2_PUBLIC_URL + '/', ''))
    await db.bitacoras.update({
      where: { id: parseInt(req.params.id) },
      data: { pdf_actividades_url: null }
    })
  }
  res.json({ success: true })
})
```

---

## 🗄️ Cambios en Base de Datos (Prisma)

```prisma
model Bitacora {
  id                Int      @id @default(autoincrement())
  // ... otros campos
  
  // Nuevos campos para archivos
  foto_rostro_url    String?  @db.Text
  firma_url          String?  @db.Text
  fotos_campo_urls   String?  @db.Text  // JSON array
  pdf_actividades_url String?  @db.Text
}

model Beneficiario {
  id                Int      @id @default(autoincrement())
  // ... otros campos
  
  // Nuevos campos
  foto_rostro_key   String?
  firma_key         String?
}
```

---

## 🔐 Permisos

| Endpoint | Admin | Coordinador | Técnico |
|----------|-------|-------------|---------|
| POST /bitacoras/:id/foto-rostro | ✓ | ✓ | ✓ |
| DELETE /bitacoras/:id/foto-rostro | ✓ | ✓ | ✗ |
| POST /bitacoras/:id/firma | ✓ | ✓ | ✓ |
| DELETE /bitacoras/:id/firma | ✓ | ✓ | ✗ |
| POST /bitacoras/:id/fotos-campo | ✓ | ✓ | ✓ |
| DELETE /bitacoras/:id/fotos-campo/:idx | ✓ | ✓ | ✗ |
| POST /bitacoras/:id/pdf-actividades | ✓ | ✓ | ✓ |
| DELETE /bitacoras/:id/pdf-actividades | ✓ | ✓ | ✗ |

---

## 📝 Resumen de Archivos a Modificar

1. **Rutas** - Agregar los nuevos endpoints
2. **Controlador** - Lógica de upload a R2
3. **Prisma Schema** - Agregar nuevos campos
4. **Middleware de upload** - Configurar multer para múltiples archivos

---

## ✅ Checklist de Implementación

- [ ] Agregar campos a `Bitacora` en Prisma
- [ ] Agregar campos a `Beneficiario` en Prisma  
- [ ] Configurar middleware de upload (multer)
- [ ] Implementar POST /bitacoras/:id/foto-rostro
- [ ] Implementar GET/DELETE /bitacoras/:id/foto-rostro
- [ ] Implementar POST /bitacoras/:id/firma
- [ ] Implementar GET/DELETE /bitacoras/:id/firma
- [ ] Implementar POST /bitacoras/:id/fotos-campo
- [ ] Implementar GET/DELETE /bitacoras/:id/fotos-campo/:idx
- [ ] Implementar POST /bitacoras/:id/pdf-actividades
- [ ] Implementar GET/DELETE /bitacoras/:id/pdf-actividades
- [ ] Implementar POST /beneficiarios/:id/foto-rostro
- [ ] Implementar GET/DELETE /beneficiarios/:id/foto-rostro
- [ ] Implementar POST /beneficiarios/:id/firma
- [ ] Implementar GET/DELETE /beneficiarios/:id/firma
- [ ] Verificar que /bitacoras/:id retorne los nuevos campos
- [ ] Verificar que PDF incluya las imágenes embebidas