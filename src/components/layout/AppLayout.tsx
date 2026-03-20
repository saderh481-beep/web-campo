import { NavLink, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, UserCheck, BookOpen,
  FileBarChart, Settings, LogOut, Bell, ChevronRight,
  Wheat, Layers, Menu, X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
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
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tecnicos', label: 'Técnicos', icon: UserCheck },
  { to: '/beneficiarios', label: 'Beneficiarios', icon: Users },
  { to: '/bitacoras', label: 'Bitácoras', icon: BookOpen },
  { to: '/cadenas', label: 'Cadenas Productivas', icon: Layers },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart },
  { to: '/usuarios', label: 'Usuarios', icon: Settings },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const [notifOpen, setNotifOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 980 : false
  )
  const [menuOpen, setMenuOpen] = useState(false)

  const notifData = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => notificacionesApi.list().then((r: { data: unknown }) => r.data),
    refetchInterval: 30000,
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

  // Close notif on outside click
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

      {/* SIDEBAR */}
      <aside
        style={{
          ...s.sidebar,
          ...(isMobile ? s.sidebarMobile : {}),
          ...(isMobile && !menuOpen ? s.sidebarMobileClosed : {}),
        }}
      >
        {/* Logo */}
        <div style={s.sidebarLogo}>
          <div style={s.logoMark}>
            <Wheat size={20} color="var(--dorado)" />
          </div>
          <div>
            <div style={s.logoName}>CAMPO</div>
            <div style={s.logoSub}>Sistema de gestión</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
              onClick={() => isMobile && setMenuOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span style={s.activeLine} />}
                  <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={s.sidebarUser}>
          <div style={s.avatarCircle}>
            {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.userName}>{user?.nombre}</div>
            <div style={s.userRole}>{user?.rol}</div>
          </div>
          <button style={s.logoutBtn} onClick={logout} title="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ ...s.main, ...(isMobile ? s.mainMobile : {}) }}>
        {/* Top bar */}
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
            {/* Notifications */}
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
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Notificaciones</span>
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
                            <div style={{ fontSize: 12, fontWeight: n.leida ? 400 : 600 }}>{n.mensaje ?? n.titulo}</div>
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
          </div>
        </header>

        {/* Page content */}
        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', height: '100vh', overflow: 'hidden' },
  mobileOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.35)',
    zIndex: 18,
  },
  sidebar: {
    width: 'var(--sidebar-w)', flexShrink: 0,
    background: 'var(--guinda-deeper)',
    display: 'flex', flexDirection: 'column',
    borderRight: '1px solid rgba(212,193,156,0.1)',
    position: 'relative', zIndex: 10,
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 20,
    transition: 'transform 0.2s ease',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.2)',
  },
  sidebarMobileClosed: {
    transform: 'translateX(-100%)',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 18px 16px',
    borderBottom: '1px solid rgba(212,193,156,0.12)',
  },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    background: 'rgba(212,193,156,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(212,193,156,0.2)',
    flexShrink: 0,
  },
  logoName: { fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' },
  logoSub: { fontSize: 10, color: 'rgba(212,193,156,0.6)', fontWeight: 500, letterSpacing: '0.04em' },
  nav: { flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '9px 12px', borderRadius: 8, fontSize: 13,
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none', transition: 'all 0.15s',
    position: 'relative', cursor: 'pointer',
  },
  navActive: {
    color: 'white', background: 'rgba(212,193,156,0.12)',
    fontWeight: 600,
  },
  activeLine: {
    position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
    width: 3, height: 20, background: 'var(--dorado)',
    borderRadius: '0 2px 2px 0',
  },
  sidebarUser: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px',
    borderTop: '1px solid rgba(212,193,156,0.12)',
    margin: '0 0 0',
  },
  avatarCircle: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'rgba(212,193,156,0.2)',
    border: '1.5px solid rgba(212,193,156,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: 'var(--dorado)',
    flexShrink: 0,
  },
  userName: { fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 10, color: 'rgba(212,193,156,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6,
    display: 'flex', transition: 'color 0.15s',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  mainMobile: { width: '100%' },
  header: {
    height: 'var(--header-h)', background: 'white',
    borderBottom: '1px solid var(--gray-200)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', flexShrink: 0,
  },
  headerMobile: { padding: '0 12px' },
  content: { flex: 1, overflowY: 'auto', overflowX: 'hidden' },
  iconBtn: {
    position: 'relative', background: 'none', border: '1.5px solid var(--gray-200)',
    borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
    color: 'var(--gray-500)', display: 'flex', alignItems: 'center',
    transition: 'all 0.15s',
  },
  iconBtnActive: { borderColor: 'var(--guinda)', color: 'var(--guinda)', background: 'var(--guinda-50)' },
  badge: {
    position: 'absolute', top: -6, right: -6,
    background: 'var(--guinda)', color: 'white',
    fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
    borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
  },
  notifPanel: {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
    width: 340, background: 'white',
    borderRadius: 12, border: '1px solid var(--gray-200)',
    boxShadow: '0 8px 24px rgba(98,17,50,0.12)',
    zIndex: 50,
  },
  notifPanelMobile: {
    width: 'min(92vw, 340px)',
    right: -8,
  },
  notifHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid var(--gray-100)',
  },
  notifMark: { fontSize: 11, color: 'var(--guinda)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' },
  notifEmpty: { padding: '24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 },
  notifItem: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
    transition: 'background 0.12s', alignItems: 'flex-start',
  },
  notifUnread: { background: 'var(--guinda-50)' },
  dot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--guinda)', flexShrink: 0, marginTop: 3 },
}
