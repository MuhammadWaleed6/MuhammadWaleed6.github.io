import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import './PublicLayout.css'

const NAV_LINKS = [
  { to: '/', label: 'Home', section: 'home-hero' },
  { to: '/about', label: 'About', section: 'home-about' },
  { to: '/skills', label: 'Skills', section: 'home-skills' },
  { to: '/projects', label: 'Projects', section: 'home-projects' },
  { to: '/services', label: 'Services', section: 'home-services' },
  { to: '/team', label: 'Team', section: 'home-team' },
  { to: '/contact', label: 'Contact', section: 'contact' },
]

export default function PublicLayout() {
  const { settings } = useSiteSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const location = useLocation()

  // On the home page the nav tracks sections; on other pages it tracks routes.
  const isHome = location.pathname === '/'
  // Dark-hero pages get the transparent header treatment (home + member detail).
  const isDarkHero = isHome || /^\/team\/.+/.test(location.pathname)
  const sectionIds = isHome ? NAV_LINKS.map((l) => l.section) : []
  const activeSection = useScrollSpy(sectionIds)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      setShowTop(window.scrollY > 480)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  // Drawer: close on Escape and lock page scroll while it's open.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  const hasResume = Boolean(settings.resume_url)

  function linkClass({ isActive }) {
    if (isHome && activeSection) {
      const match = NAV_LINKS.find((l) => l.section === activeSection)
      return match && match.to === '/' ? 'active' : isActive ? 'active' : ''
    }
    return isActive ? 'active' : ''
  }

  function sectionLinkClass(link, isActive) {
    if (isHome && activeSection) return activeSection === link.section ? 'active' : ''
    return isActive ? 'active' : ''
  }

  return (
    <div className={`public-shell ${isDarkHero ? 'is-dark-hero' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className={`site-nav ${scrolled || !isDarkHero ? 'scrolled' : 'at-top'}`}>
        <div className="container nav-inner">
          <Link to="/" className="wordmark" aria-label="Muhammad Walid — home">
            <span className="mark" aria-hidden="true">
              MW
            </span>
            {settings.display_name}
          </Link>

          <nav aria-label="Primary">
            <ul className="nav-links">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) => sectionLinkClass(link, isActive)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav-cta">
            {hasResume ? (
              <a className="btn btn-primary btn-sm" href={settings.resume_url} target="_blank" rel="noreferrer">
                <i className="pi pi-download" aria-hidden="true" /> Resume
              </a>
            ) : null}
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer: slides in from the left, with overlay */}
      <div
        className={`drawer-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="mobile-drawer"
        className={`nav-drawer ${menuOpen ? 'open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        <div className="drawer-head">
          <Link to="/" className="wordmark" onClick={() => setMenuOpen(false)}>
            <span className="mark" aria-hidden="true">MW</span>
            {settings.display_name}
          </Link>
          <button
            type="button"
            className="drawer-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <i className="pi pi-times" aria-hidden="true" />
          </button>
        </div>

        <nav className="drawer-nav" aria-label="Mobile menu">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => sectionLinkClass(link, isActive)}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              <i className="pi pi-chevron-right" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        <div className="drawer-cta">
          {hasResume ? (
            <a className="btn btn-primary btn-block" href={settings.resume_url} target="_blank" rel="noreferrer">
              <i className="pi pi-download" aria-hidden="true" /> Download Resume
            </a>
          ) : null}
        </div>
      </aside>

      <main id="main-content">
        <Outlet />
      </main>

      {/* Floating back-to-top button */}
      <button
        type="button"
        className={`back-to-top ${showTop ? 'show' : ''}`}
        aria-label="Scroll back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="pi pi-arrow-up" aria-hidden="true" />
      </button>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="f-brand">
              <Link to="/" className="wordmark">
                <span className="mark" aria-hidden="true">MW</span>
                {settings.display_name}
              </Link>
              <p>{settings.footer_text}</p>
            </div>

            <div className="f-links">
              <h4>Quick links</h4>
              <ul>
                {NAV_LINKS.slice(0, 4).map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="f-links">
              <h4>More</h4>
              <ul>
                {NAV_LINKS.slice(4).map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Elsewhere</h4>
              <ul>
                {settings.github_url ? (
                  <li>
                    <a href={settings.github_url} target="_blank" rel="noreferrer">
                      <i className="pi pi-github" aria-hidden="true" /> GitHub
                    </a>
                  </li>
                ) : null}
                {settings.linkedin_url ? (
                  <li>
                    <a href={settings.linkedin_url} target="_blank" rel="noreferrer">
                      <i className="pi pi-linkedin" aria-hidden="true" /> LinkedIn
                    </a>
                  </li>
                ) : null}
                {settings.contact_email ? (
                  <li>
                    <a href={`mailto:${settings.contact_email}`}>
                      <i className="pi pi-envelope" aria-hidden="true" /> Email
                    </a>
                  </li>
                ) : null}
                {!settings.github_url && !settings.linkedin_url && !settings.contact_email ? (
                  <li>
                    <span className="text-muted">Add links in the dashboard</span>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {settings.display_name}. All rights reserved.
            </span>
            <button
              type="button"
              className="back-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <i className="pi pi-arrow-up" aria-hidden="true" /> Back to top
            </button>
            <Link to="/admin" className="admin-link" title="Admin login">
              <i className="pi pi-lock" aria-hidden="true" /> Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
