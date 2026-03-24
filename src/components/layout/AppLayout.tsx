import { NavLink, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, UserCheck, BookOpen, ChartBar as FileBarChart, Settings, LogOut, Bell, ChevronRight, Layers, Menu, X, ClipboardList, Link2, MapPin, FileBadge2, Archive, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canViewActividades, canViewAsignaciones, canViewBeneficiarios, canViewBitacoras, canViewCadenas, canViewDashboard, canViewNotifications, canViewReports, canViewTecnicos, canManageUsers, canViewLocalidades, canViewConfiguraciones, canViewDocumentosPlantilla, canViewArchive } from '../../lib/authz'
import { notificacionesApi } from '../../lib/api'
import { pickArray } from '../../lib/normalize'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Notificacion {
  id: number | string
  leida?: boolean
  mensaje?: string
  titulo?: string
  fecha?: string
}

interface NotificacionesResponse {
  notificaciones?: Notificacion[]
}

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true, allow: canViewDashboard },
  { to: '/usuarios', label: 'Usuarios', icon: Settings, allow: canManageUsers },
  { to: '/tecnicos', label: 'Técnicos', icon: UserCheck, allow: canViewTecnicos },
  { to: '/beneficiarios', label: 'Beneficiarios', icon: Users, allow: canViewBeneficiarios },
  { to: '/bitacoras', label: 'Bitácoras', icon: BookOpen, allow: canViewBitacoras },
  { to: '/cadenas', label: 'Cadenas Productivas', icon: Layers, allow: canViewCadenas },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart, allow: canViewReports },
  { to: '/actividades', label: 'Actividades', icon: ClipboardList, allow: canViewActividades },
  { to: '/asignaciones', label: 'Asignaciones', icon: Link2, allow: canViewAsignaciones },
  { to: '/localidades', label: 'Localidades', icon: MapPin, allow: canViewLocalidades },
  { to: '/documentos-plantilla', label: 'Documentos Plantilla', icon: FileBadge2, allow: canViewDocumentosPlantilla },
  { to: '/configuraciones', label: 'Configuraciones', icon: SlidersHorizontal, allow: canViewConfiguraciones },
  { to: '/archive', label: 'Archive', icon: Archive, allow: canViewArchive },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const [notifOpen, setNotifOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 980 : false
  )
  const [menuOpen, setMenuOpen] = useState(false)

  const canSeeNotifications = canViewNotifications(user?.rol)
  const visibleNav = NAV.filter(({ allow }) => allow(user?.rol))

  const notifData = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => notificacionesApi.list().then((r: { data: unknown }) => r.data),
    refetchInterval: 30000,
    enabled: canSeeNotifications,
  }).data

  const notifs = pickArray<Notificacion>(notifData as NotificacionesResponse | Notificacion[] | undefined, ['notificaciones', 'rows', 'data'])
  const unread = notifs.filter((n) => !n.leida).length

  const marcarTodas = useMutation({
    mutationFn: () => notificacionesApi.marcarTodas(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  const marcarLeida = useMutation({
    mutationFn: (id: string | number) => notificacionesApi.marcarLeida(String(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  useEffect(() => {
    if (!notifOpen) return
    const h = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-notif]')
      if (!el) setNotifOpen(false)
    }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [notifOpen])

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 980
      setIsMobile(mobile)
      if (!mobile) setMenuOpen(false)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div style={s.wrap}>
      {isMobile && menuOpen && (
        <div style={s.mobileOverlay} onClick={() => setMenuOpen(false)} />
      )}

      <aside
        style={{
          ...s.sidebar,
          ...(isMobile ? s.sidebarMobile : {}),
          ...(isMobile && !menuOpen ? s.sidebarMobileClosed : {}),
        }}
      >
        <div style={s.sidebarLogo}>
          <img src="/Mesa de trabajo 3.svg" alt="Logo CAMPO" style={s.logoImg} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.logoName}>CAMPO</div>
            <div style={s.logoSub}>Secretaría de Desarrollo Agropecuario</div>
            <div style={s.logoGov}>Primero el Pueblo 2022-2028</div>
          </div>
        </div>

        <nav style={s.nav}>
          {visibleNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
              onClick={() => isMobile && setMenuOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span style={s.activeLine} />}
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={s.sidebarUser}>
          <div style={s.avatarCircle}>
            {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.userName}>{user?.nombre}</div>
            <div style={s.userRole}>{user?.rol}</div>
          </div>
          <button style={s.logoutBtn} onClick={logout} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div style={{ ...s.main, ...(isMobile ? s.mainMobile : {}) }}>
        <header style={{ ...s.header, ...(isMobile ? s.headerMobile : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setMenuOpen((p) => !p)}
                style={{ border: '1px solid var(--gray-200)' }}
                aria-label="Abrir menú"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {canSeeNotifications && (
              <div style={{ position: 'relative' }} data-notif>
                <button
                  data-notif
                  style={{ ...s.iconBtn, ...(unread > 0 ? s.iconBtnActive : {}) }}
                  onClick={() => setNotifOpen(o => !o)}
                >
                  <Bell size={18} />
                  {unread > 0 && <span style={s.badge}>{unread}</span>}
                </button>
                {notifOpen && (
                  <div style={{ ...s.notifPanel, ...(isMobile ? s.notifPanelMobile : {}) }} data-notif>
                    <div style={s.notifHeader}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Notificaciones</span>
                      {unread > 0 && (
                        <button style={s.notifMark} onClick={() => marcarTodas.mutate()}>
                          Marcar todas leídas
                        </button>
                      )}
                    </div>
                    {notifs.length === 0 ? (
                      <div style={s.notifEmpty}>Sin notificaciones</div>
                    ) : (
                      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {notifs.map((n) => (
                          <div
                            key={n.id}
                            style={{ ...s.notifItem, ...(!n.leida ? s.notifUnread : {}) }}
                            onClick={() => !n.leida && marcarLeida.mutate(n.id)}
                          >
                            {!n.leida && <span style={s.dot} />}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: n.leida ? 400 : 500 }}>{n.mensaje ?? n.titulo}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                                {n.fecha ? new Date(n.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', height: '100vh', overflow: 'hidden', background: 'linear-gradient(180deg, #F5F5F5 0%, #FFFFFF 100%)' },
  mobileOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(74, 14, 31, 0.45)',
    zIndex: 18,
  },
  sidebar: {
    width: 'var(--sidebar-w)', flexShrink: 0,
    background: 'linear-gradient(180deg, #691B31 0%, #A02142 100%)',
    display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #BC955B',
    position: 'relative', zIndex: 10,
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 20,
    transition: 'transform 0.2s ease',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
  },
  sidebarMobileClosed: {
    transform: 'translateX(-100%)',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '20px 24px',
    borderBottom: '1px solid #BC955B',
  },
  logoImg: {
    width: 48, height: 48,
    objectFit: 'contain',
    flexShrink: 0,
  },
  logoName: { fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' },
  logoSub: { fontSize: 10, color: '#DDC9A3', fontWeight: 600, letterSpacing: '0.01em', textTransform: 'uppercase' },
  logoGov: { fontSize: 10, color: '#DDC9A3', fontWeight: 500, letterSpacing: '0.01em' },
  nav: { flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 4, fontSize: 13,
    fontWeight: 600, color: '#FFFFFF',
    textDecoration: 'none', transition: 'all 0.15s',
    position: 'relative', cursor: 'pointer',
  },
  navActive: {
    color: '#691B31', background: '#DDC9A3',
    fontWeight: 700,
  },
  activeLine: {
    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
    width: 3, height: 20, background: '#BC955B',
    borderRadius: '0 2px 2px 0',
  },
  sidebarUser: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 20px',
    borderTop: '1px solid #BC955B',
    margin: '0',
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: '50%',
    background: '#DDC9A3',
    border: '1px solid #BC955B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: '#691B31',
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 11, color: '#DDC9A3', textTransform: 'capitalize', letterSpacing: '0.01em' },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#DDC9A3', padding: 6, borderRadius: 4,
    display: 'flex', transition: 'color 0.15s',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  mainMobile: { width: '100%' },
  header: {
    height: 'var(--header-h)', background: 'linear-gradient(180deg, #691B31 0%, #A02142 100%)',
    borderBottom: '1px solid #BC955B',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', flexShrink: 0,
  },
  headerMobile: { padding: '0 16px' },
  content: { flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'linear-gradient(180deg, #F5F5F5 0%, #FFFFFF 100%)' },
  iconBtn: {
    position: 'relative', background: '#DDC9A3', border: '1px solid #BC955B',
    borderRadius: 4, padding: '8px 10px', cursor: 'pointer',
    color: '#691B31', display: 'flex', alignItems: 'center',
    transition: 'all 0.15s',
  },
  iconBtnActive: { borderColor: '#DDC9A3', color: '#FFFFFF', background: '#691B31' },
  badge: {
    position: 'absolute', top: -6, right: -6,
    background: '#A02142', color: '#FFFFFF',
    fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
  },
  notifPanel: {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
    width: 340, background: '#FFFFFF',
    borderRadius: 6, border: '1px solid #BC955B',
    boxShadow: '0 8px 22px rgba(105,27,49,0.2)',
    zIndex: 50,
  },
  notifPanelMobile: {
    width: 'min(92vw, 340px)',
    right: -8,
  },
  notifHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid #DDC9A3',
  },
  notifMark: { fontSize: 11, color: '#A02142', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' },
  notifEmpty: { padding: '24px', textAlign: 'center', color: '#6F7271', fontSize: 13 },
  notifItem: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderBottom: '1px solid #DDC9A3', cursor: 'pointer',
    transition: 'background 0.1s', alignItems: 'flex-start',
  },
  notifUnread: { background: '#F5F5F5' },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#A02142', flexShrink: 0, marginTop: 4 },
}



