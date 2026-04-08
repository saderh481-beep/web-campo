import { api } from '../axios'

export interface CadenaProductiva {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  created_at?: string
}

export interface Actividad {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface Localidad {
  id: string
  municipio: string
  nombre: string
  cp?: string
  activo: boolean
  zona_id?: string
}

export interface Zona {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
}

export const cadenasService = {
  list: () => api.get<CadenaProductiva[]>('/cadenas-productivas'),
  create: (data: { nombre: string; descripcion?: string }) => api.post<CadenaProductiva>('/cadenas-productivas', data),
  update: (id: string | number, data: { nombre?: string; descripcion?: string }) => api.patch<CadenaProductiva>(`/cadenas-productivas/${id}`, data),
  remove: (id: string | number) => api.delete(`/cadenas-productivas/${id}`),
}

export const actividadesService = {
  list: () => api.get<Actividad[]>('/actividades'),
  create: (data: { nombre: string; descripcion?: string }) => api.post<Actividad>('/actividades', data),
  update: (id: string | number, data: { nombre?: string; descripcion?: string }) => api.patch<Actividad>(`/actividades/${id}`, data),
  remove: (id: string | number) => api.delete(`/actividades/${id}`),
}

export const localidadesService = {
  list: () => api.get<Localidad[]>('/localidades'),
  create: (data: { municipio: string; nombre: string; cp?: string; zona_id?: string }) => api.post<Localidad>('/localidades', data),
  update: (id: string | number, data: { nombre?: string; cp?: string; zona_id?: string }) => api.patch<Localidad>(`/localidades/${id}`, data),
  remove: (id: string | number) => api.delete(`/localidades/${id}`),
}

export const zonasService = {
  list: () => api.get<Zona[]>('/zonas'),
  create: (data: { nombre: string; descripcion?: string }) => api.post<Zona>('/zonas', data),
  update: (id: string | number, data: { nombre?: string; descripcion?: string }) => api.patch<Zona>(`/zonas/${id}`, data),
  remove: (id: string | number) => api.delete(`/zonas/${id}`),
}
