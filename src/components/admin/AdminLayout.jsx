import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { initialsOf } from '../../lib/utils'
import { getDashboardStats } from '../../services/contentService'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: 'pi-home', end: true }],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/projects', label: 'Projects', icon: 'pi-briefcase' },
      { to: '/admin/skills', label: 'Skills', icon: 'pi-tags' },
      { to: '/admin/services', label: 'Services', icon: 'pi-star' },
      { to: '/admin/timeline', label: 'Experience & Education', icon: 'pi-history' },
      { to: '/admin/team', label: 'Team', icon: 'pi-users' },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/profile', label: 'Profile', icon: 'pi-user' },
      { to: '/admin/settings', label: 'Site Settings', icon: 'pi-cog' },
      { to: '/admin/messages', label: 'Messages', icon: 'pi-envelope', badge: 'unread' },
    ],
  },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const { settings } = useSiteSettings()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let active = true
    const load = () => {
      getDashboardStats()
        .then((stats) => {
          if (active) setUnread(stats.messagesUnread || 0)
        })
        .catch(() => {})
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [location.pathname])

  const email = user?.email || 'admin'
  const initials = initialsOf(email.split('@')[0]) || 'A'

  return (
    <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className="admin-sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">MW</span>
          <div>
            <div className="brand-name">{settings.display_name}</div>
            <div className="brand-sub">Admin panel</div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="nav-group">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  <i className={`pi ${item.icon}`} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge === 'unread' && unread > 0 ? (
                    <span className="nav-badge">{unread}</span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user">
            <span className="avatar" aria-hidden="true">{initials}</span>
            <div className="meta">
              <div className="name">{email}</div>
              <div className="role">Administrator</div>
            </div>
          </div>
          <button type="button" className="btn btn-sm sidebar-signout" onClick={signOut}>
            <i className="pi pi-sign-out" aria-hidden="true" /> Sign out
          </button>
          <div className="mt-3">
            <Link to="/" target="_blank" rel="noreferrer">
              <i className="pi pi-external-link" aria-hidden="true" /> View live site
            </Link>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-mobilebar">
          <button
            type="button"
            className="icon-btn"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="pi pi-bars" aria-hidden="true" />
          </button>
          <div className="bar-title">
            <span className="brand-mark" aria-hidden="true">MW</span> Admin
          </div>
          <button type="button" className="icon-btn" aria-label="Sign out" onClick={signOut}>
            <i className="pi pi-sign-out" aria-hidden="true" />
          </button>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
