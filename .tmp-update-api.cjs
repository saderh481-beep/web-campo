const fs = require('fs')
const path = 'src/lib/api.ts'
let c = fs.readFileSync(path, 'utf8')

c = c.replace(/\n\s*remove: \(id: string \| number\) => withFallback\([\s\S]*?\n\s*asignarCadenas:/m, '\n  asignarCadenas:')
c = c.replace('{ cadena_ids: cadenaIds, cadenas_ids: cadenaIds }', '{ cadena_ids: cadenaIds }')
c = c.replace(
  "  pdfDownloadUrl: (id: string | number) => `${apiBaseUrl}/bitacoras/${id}/pdf/descargar`,\n}",
  "  pdfDownloadUrl: (id: string | number) => `${apiBaseUrl}/bitacoras/${id}/pdf/descargar`,\n  imprimirPdf: (id: string | number) => api.post(`/bitacoras/${id}/pdf/imprimir`),\n  versiones: (id: string | number) => api.get(`/bitacoras/${id}/versiones`),\n}"
)
const reportesStart = c.indexOf('// ── REPORTES')
const notificacionesStart = c.indexOf('// ── NOTIFICACIONES')
if (reportesStart !== -1 && notificacionesStart !== -1) {
  c = c.slice(0, reportesStart) + `// ── REPORTES ──────────────────────────────────────────────────────
export const reportesApi = {
  mensual: (params?: { mes?: string; anio?: number }) =>
    api.get('/reportes/mensual', { params: normalizeMonthlyParams(params) }),
  tecnico: (id: string | number, params?: { desde?: string; hasta?: string }) =>
    api.get(\`/reportes/tecnico/\${id}\`, { params }),
}

// ── ARCHIVE ───────────────────────────────────────────────────────
export const archiveApi = {
  list: () => api.get('/archive'),
  descargar: (periodo: string) => api.get(\`/archive/\${periodo}/descargar\`),
  confirmar: (periodo: string) => api.post(\`/archive/\${periodo}/confirmar\`, { confirmar: true }),
  forzar: (periodo: string) => api.post(\`/archive/\${periodo}/forzar\`),
}

` + c.slice(notificacionesStart)
}
fs.writeFileSync(path, c)
console.log('api.ts actualizado')
