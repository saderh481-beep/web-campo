import { NavLink, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, UserCheck, BookOpen, ChartBar as FileBarChart, Settings, LogOut, Bell, ChevronRight, Layers, Menu, X } from 'lucide-react'
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
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tecnicos', label: 'Tecnicos', icon: UserCheck },
  { to: '/beneficiarios', label: 'Beneficiarios', icon: Users },
  { to: '/bitacoras', label: 'Bitacoras', icon: BookOpen },
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
        {/* Logo Section - Larger and more prominent */}
        <div style={s.sidebarLogo}>
          <div style={s.logoWrapper}>
            <img src="/Mesa de trabajo 3.svg" alt="Logo CAMPO" style={s.logoImg} />
          </div>
          <div style={s.logoText}>
            <div style={s.logoName}>CAMPO</div>
            <div style={s.logoSub}>Sistema de gestion</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={s.nav}>
          <div style={s.navSection}>
            <span style={s.navSectionLabel}>Menu principal</span>
          </div>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({ 
                ...s.navItem, 
                ...(isActive ? s.navActive : {}) 
              })}
              onClick={() => isMobile && setMenuOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <div style={{ 
                    ...s.navIconWrap,
                    ...(isActive ? s.navIconWrapActive : {})
                  }}>
                    <Icon size={18} />
                  </div>
                  <span style={s.navLabel}>{label}</span>
                  {isActive && <ChevronRight size={14} style={s.navChevron} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div style={s.sidebarUser}>
          <div style={s.avatarCircle}>
            {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={s.userInfo}>
            <div style={s.userName}>{user?.nombre}</div>
            <div style={s.userRole}>{user?.rol}</div>
          </div>
          <button style={s.logoutBtn} onClick={logout} title="Cerrar sesion">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div style={{ ...s.main, ...(isMobile ? s.mainMobile : {}) }}>
        {/* Header */}
        <header style={{ ...s.header, ...(isMobile ? s.headerMobile : {}) }}>
          <div style={s.headerLeft}>
            {isMobile && (
              <button
                style={s.menuBtn}
                onClick={() => setMenuOpen((p) => !p)}
                aria-label="Abrir menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>

          <div style={s.headerRight}>
            {/* Notifications */}
            <div style={{ position: 'relative' }} data-notif>
              <button
                data-notif
                style={{ 
                  ...s.notifBtn, 
                  ...(unread > 0 ? s.notifBtnActive : {}),
                  ...(notifOpen ? s.notifBtnOpen : {})
                }}
                onClick={() => setNotifOpen(o => !o)}
              >
                <Bell size={18} />
                {unread > 0 && <span style={s.badge}>{unread}</span>}
              </button>

              {notifOpen && (
                <div style={{ ...s.notifPanel, ...(isMobile ? s.notifPanelMobile : {}) }} data-notif>
                  <div style={s.notifHeader}>
                    <span style={s.notifTitle}>Notificaciones</span>
                    {unread > 0 && (
                      <button style={s.notifMark} onClick={() => marcarTodas.mutate()}>
                        Marcar todas leidas
                      </button>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={s.notifEmpty}>
                      <Bell size={24} style={{ opacity: 0.3 }} />
                      <span>Sin notificaciones</span>
                    </div>
                  ) : (
                    <div style={s.notifList}>
                      {notifs.map((n) => (
                        <div
                          key={n.id}
                          style={{ ...s.notifItem, ...(!n.leida ? s.notifUnread : {}) }}
                          onClick={() => !n.leida && marcarLeida.mutate(n.id)}
                        >
                          {!n.leida && <span style={s.dot} />}
                          <div style={s.notifContent}>
                            <div style={s.notifMessage}>{n.mensaje ?? n.titulo}</div>
                            <div style={s.notifDate}>
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

            {/* User avatar in header (mobile) */}
            {isMobile && (
              <div style={s.headerAvatar}>
                {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
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
  wrap: { 
    display: 'flex', 
    height: '100vh', 
    overflow: 'hidden',
    background: 'var(--gray-50)',
  },
  
  mobileOverlay: {
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 18,
  },
  
  // Sidebar
  sidebar: {
    width: 'var(--sidebar-w)', 
    flexShrink: 0,
    background: 'white',
    display: 'flex', 
    flexDirection: 'column',
    borderRight: '1px solid var(--gray-200)',
    position: 'relative', 
    zIndex: 10,
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 20,
    transition: 'transform 0.25s ease',
    boxShadow: 'var(--shadow-xl)',
  },
  sidebarMobileClosed: {
    transform: 'translateX(-100%)',
  },
  
  // Logo section - Larger and more prominent
  sidebarLogo: {
    display: 'flex', 
    alignItems: 'center', 
    gap: 14,
    padding: '24px 24px 20px',
    borderBottom: '1px solid var(--gray-100)',
  },
  logoWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(26,26,46,0.15)',
  },
  logoImg: {
    width: 32,
    height: 32,
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)',
  },
  logoText: {
    flex: 1,
    minWidth: 0,
  },
  logoName: { 
    fontSize: 20, 
    fontWeight: 700, 
    color: 'var(--gray-900)', 
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  logoSub: { 
    fontSize: 12, 
    color: 'var(--gray-500)', 
    fontWeight: 400, 
    letterSpacing: '0.01em',
    marginTop: 2,
  },
  
  // Navigation
  nav: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '20px 16px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 4,
  },
  navSection: {
    padding: '0 12px',
    marginBottom: 8,
  },
  navSectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--gray-400)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  navItem: {
    display: 'flex', 
    alignItems: 'center', 
    gap: 12,
    padding: '11px 12px', 
    borderRadius: 10, 
    fontSize: 14,
    fontWeight: 500, 
    color: 'var(--gray-600)',
    textDecoration: 'none', 
    transition: 'all 0.15s ease',
    position: 'relative', 
    cursor: 'pointer',
  },
  navActive: {
    color: 'var(--primary)', 
    background: 'var(--primary-50)',
    fontWeight: 600,
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'var(--gray-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  navIconWrapActive: {
    background: 'var(--primary)',
    color: 'white',
    boxShadow: '0 2px 6px rgba(26,26,46,0.2)',
  },
  navLabel: {
    flex: 1,
  },
  navChevron: {
    opacity: 0.5,
  },
  
  // User section
  sidebarUser: {
    display: 'flex', 
    alignItems: 'center', 
    gap: 12,
    padding: '20px 20px',
    borderTop: '1px solid var(--gray-100)',
    background: 'var(--gray-50)',
  },
  avatarCircle: {
    width: 40, 
    height: 40, 
    borderRadius: 10,
    background: 'var(--primary)',
    color: 'white',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    fontSize: 14, 
    fontWeight: 600,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: { 
    fontSize: 14, 
    fontWeight: 600, 
    color: 'var(--gray-900)', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap',
  },
  userRole: { 
    fontSize: 12, 
    color: 'var(--gray-500)', 
    textTransform: 'capitalize', 
    letterSpacing: '0.01em',
    marginTop: 1,
  },
  logoutBtn: {
    background: 'white', 
    border: '1px solid var(--gray-200)', 
    cursor: 'pointer',
    color: 'var(--gray-500)', 
    padding: 8, 
    borderRadius: 8,
    display: 'flex', 
    transition: 'all 0.15s ease',
  },
  
  // Main content area
  main: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden',
  },
  mainMobile: { 
    width: '100%',
  },
  
  // Header
  header: {
    height: 'var(--header-h)', 
    background: 'white',
    borderBottom: '1px solid var(--gray-200)',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '0 32px', 
    flexShrink: 0,
  },
  headerMobile: { 
    padding: '0 16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    background: 'var(--gray-50)',
    border: '1px solid var(--gray-200)',
    borderRadius: 10,
    color: 'var(--gray-600)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'var(--primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  
  // Main content
  content: { 
    flex: 1, 
    overflowY: 'auto', 
    overflowX: 'hidden', 
    background: 'var(--gray-50)',
  },
  
  // Notifications
  notifBtn: {
    position: 'relative', 
    background: 'var(--gray-50)', 
    border: '1px solid var(--gray-200)',
    borderRadius: 10, 
    padding: '10px 12px', 
    cursor: 'pointer',
    color: 'var(--gray-600)', 
    display: 'flex', 
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  notifBtnActive: { 
    borderColor: 'var(--primary)', 
    color: 'var(--primary)', 
    background: 'var(--primary-50)',
  },
  notifBtnOpen: {
    background: 'var(--gray-100)',
  },
  badge: {
    position: 'absolute', 
    top: -5, 
    right: -5,
    background: 'var(--danger)', 
    color: 'white',
    fontSize: 10, 
    fontWeight: 600, 
    minWidth: 18, 
    height: 18,
    borderRadius: 9, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '0 5px',
    border: '2px solid white',
  },
  notifPanel: {
    position: 'absolute', 
    right: 0, 
    top: 'calc(100% + 10px)',
    width: 360, 
    background: 'white',
    borderRadius: 14, 
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 50,
    overflow: 'hidden',
  },
  notifPanelMobile: {
    width: 'min(92vw, 360px)',
    right: -8,
  },
  notifHeader: {
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '16px 20px', 
    borderBottom: '1px solid var(--gray-100)',
    background: 'var(--gray-50)',
  },
  notifTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--gray-900)',
  },
  notifMark: { 
    fontSize: 12, 
    color: 'var(--primary)', 
    fontWeight: 500, 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    transition: 'background 0.15s ease',
  },
  notifEmpty: { 
    padding: '40px 20px', 
    textAlign: 'center', 
    color: 'var(--gray-400)', 
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  notifList: {
    maxHeight: 360,
    overflowY: 'auto',
  },
  notifItem: {
    display: 'flex', 
    gap: 12, 
    padding: '14px 20px',
    borderBottom: '1px solid var(--gray-50)', 
    cursor: 'pointer',
    transition: 'background 0.15s ease', 
    alignItems: 'flex-start',
  },
  notifUnread: { 
    background: 'var(--primary-50)',
  },
  notifContent: {
    flex: 1,
  },
  notifMessage: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--gray-700)',
    lineHeight: 1.4,
  },
  notifDate: {
    fontSize: 11,
    color: 'var(--gray-400)',
    marginTop: 4,
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: '50%', 
    background: 'var(--primary)', 
    flexShrink: 0, 
    marginTop: 5,
  },
}
