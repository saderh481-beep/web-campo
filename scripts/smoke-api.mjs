import fs from 'node:fs'
import path from 'node:path'
import axios from 'axios'

function readApiUrl() {
  if (process.env.VITE_API_URL?.trim()) {
    return process.env.VITE_API_URL.trim()
  }

  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return ''

  const content = fs.readFileSync(envPath, 'utf8')
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith('VITE_API_URL='))

  return line ? line.split('=').slice(1).join('=').trim() : ''
}

function normalizeApiBaseUrl(rawUrl) {
  const cleaned = rawUrl.replace(/\/+$/, '')
  if (/\/api\/v1$/i.test(cleaned)) return cleaned
  return `${cleaned}/api/v1`
}

function toLegacyBaseUrl(rawUrl) {
  return rawUrl.replace(/\/+$/, '').replace(/\/api\/v1$/i, '')
}

async function detectApiBaseUrl(rawUrl) {
  const versioned = normalizeApiBaseUrl(rawUrl)
  const legacy = toLegacyBaseUrl(rawUrl)

  const probe = axios.create({ timeout: 8000, validateStatus: () => true })

  const versionedHealth = await probe.get(`${versioned}/health`)
  if (versionedHealth.status >= 200 && versionedHealth.status < 300) return versioned

  const legacyHealth = await probe.get(`${legacy}/health`)
  if (legacyHealth.status >= 200 && legacyHealth.status < 300) return legacy

  return versioned
}

const rawBaseURL = readApiUrl()
const baseURL = rawBaseURL ? await detectApiBaseUrl(rawBaseURL) : ''

if (!baseURL) {
  console.error('No se encontro VITE_API_URL. Define la variable o agrega .env.')
  process.exit(1)
}

const client = axios.create({
  baseURL,
  timeout: 15000,
  validateStatus: () => true,
})

const checks = [
  { method: 'post', path: '/auth/request-otp', data: { correo: '' }, expected: [400, 401, 422] },
  { method: 'post', path: '/auth/verify-otp', data: { correo: '', otp: '' }, expected: [400, 401, 422] },
  { method: 'post', path: '/auth/logout', data: {}, expected: [200, 204, 401] },
  { method: 'get', path: '/usuarios/me', expected: [200, 401] },
  { method: 'get', path: '/usuarios', expected: [200, 401] },
  { method: 'get', path: '/usuarios/perfil', expected: [200, 401] },
  { method: 'get', path: '/tecnicos', expected: [200, 401] },
  { method: 'get', path: '/cadenas-productivas', expected: [200, 401] },
  { method: 'get', path: '/actividades', expected: [200, 401] },
  { method: 'get', path: '/beneficiarios', expected: [200, 401] },
  { method: 'get', path: '/bitacoras', expected: [200, 401] },
  { method: 'get', path: '/bitacoras/1/pdf', expected: [200, 401, 404] },
  { method: 'get', path: '/bitacoras/1/pdf/descargar', expected: [200, 401, 404] },
  { method: 'get', path: '/reportes/mensual', expected: [200, 401] },
  { method: 'get', path: '/notificaciones', expected: [200, 401] },
  { method: 'options', path: '/asignaciones/beneficiario', expected: [200, 204] },
  { method: 'options', path: '/asignaciones/actividad', expected: [200, 204] },
  { method: 'options', path: '/beneficiarios/1/cadenas', expected: [200, 204] },
  { method: 'options', path: '/notificaciones/1/leer', expected: [200, 204] },
  { method: 'options', path: '/notificaciones/leer-todas', expected: [200, 204] },
]

let failures = 0

console.log(`API base URL: ${baseURL}`)

for (const check of checks) {
  const started = Date.now()
  try {
    const response = await client.request({
      method: check.method,
      url: check.path,
      data: check.data,
    })
    const duration = Date.now() - started
    const isOk = check.expected.includes(response.status)
    const marker = isOk ? 'OK' : 'FAIL'
    const expected = check.expected.join('/')

    console.log(
      `${check.method.toUpperCase().padEnd(7)} ${check.path.padEnd(34)} -> ${String(response.status).padEnd(3)} ${marker} (${duration}ms, esperado: ${expected})`
    )

    if (!isOk) failures += 1
  } catch (error) {
    failures += 1
    const duration = Date.now() - started
    const message = error instanceof Error ? error.message : String(error)
    console.log(
      `${check.method.toUpperCase().padEnd(7)} ${check.path.padEnd(34)} -> ERROR FAIL (${duration}ms, ${message})`
    )
  }
}

if (failures > 0) {
  console.error(`Smoke API finalizo con ${failures} fallo(s).`)
  process.exit(1)
}

console.log('Smoke API exitoso: no se detectaron rutas caidas.')
