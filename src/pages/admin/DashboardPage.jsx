import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getDashboardStats,
  getAllProjects,
  getContactMessages,
} from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { formatDateTime, timeAgo } from '../../lib/utils'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'

export default function DashboardPage() {
  useDocumentMeta({ title: 'Dashboard — Admin', noindex: true })
  const [stats, setStats] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    Promise.all([getDashboardStats(), getAllProjects(), getContactMessages()])
      .then(([statsData, projects, messages]) => {
        if (cancelled) return
        setStats(statsData)
        setRecentProjects(projects.slice(0, 5))
        setRecentMessages(messages.slice(0, 5))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load dashboard data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-page">
        <PageHeader title="Dashboard" />
        <SetupNotice
          title="Connect Supabase to activate the dashboard"
        />
      </div>
    )
  }

  if (loading) return <PageLoading label="Loading dashboard…" />

  if (error) {
    return (
      <div className="admin-page">
        <PageHeader title="Dashboard" />
        <div className="state-block">
          <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          <h3>Could not load the dashboard</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total projects', value: stats.projectsTotal, icon: 'pi-briefcase', to: `${__ADMIN_BASE__}/projects` },
    { label: 'Published', value: stats.projectsPublished, icon: 'pi-check-circle', to: `${__ADMIN_BASE__}/projects` },
    { label: 'Drafts', value: stats.projectsDraft, icon: 'pi-pencil', to: `${__ADMIN_BASE__}/projects` },
    { label: 'Unread messages', value: stats.messagesUnread, icon: 'pi-envelope', to: `${__ADMIN_BASE__}/messages` },
    { label: 'Skills', value: stats.skillsTotal, icon: 'pi-tags', to: `${__ADMIN_BASE__}/skills` },
  ]

  return (
    <div className="admin-page">
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <Link to={`${__ADMIN_BASE__}/projects/new`} className="btn btn-primary btn-sm">
              <i className="pi pi-plus" aria-hidden="true" /> New project
            </Link>
            <Link to={`${__ADMIN_BASE__}/messages`} className="btn btn-outline btn-sm">
              <i className="pi pi-envelope" aria-hidden="true" /> Inbox
            </Link>
          </>
        }
      />

      <div className="stat-grid">
        {statCards.map((card) => (
          <Link key={card.label} to={card.to} className="stat-card" style={{ textDecoration: 'none' }}>
            <span className="stat-icon">
              <i className={`pi ${card.icon}`} aria-hidden="true" />
            </span>
            <span>
              <span className="stat-value">{card.value}</span>
              <span className="stat-label" style={{ display: 'block' }}>{card.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="dash-columns">
        <div className="admin-panel">
          <div className="panel-head">
            <h2>Recent projects</h2>
            <Link to={`${__ADMIN_BASE__}/projects`} className="btn btn-ghost btn-sm">
              View all <i className="pi pi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="panel-body tight">
            {recentProjects.length === 0 ? (
              <div style={{ padding: 'var(--space-5)' }}>
                <EmptyState
                  icon="pi-briefcase"
                  title="No projects yet"
                  message="Create your first project to showcase your work."
                  action={
                    <Link to={`${__ADMIN_BASE__}/projects/new`} className="btn btn-primary btn-sm">
                      <i className="pi pi-plus" aria-hidden="true" /> Add project
                    </Link>
                  }
                />
              </div>
            ) : (
              recentProjects.map((p) => (
                <div key={p.id} className="mini-row">
                  <span className={`badge ${p.is_published ? 'badge-soft' : 'badge-gray'}`}>
                    {p.is_published ? 'Live' : 'Draft'}
                  </span>
                  <div className="mini-main">
                    <div className="t">{p.title}</div>
                    <div className="s">
                      {p.category} · updated {timeAgo(p.updated_at)}
                    </div>
                  </div>
                  <Link to={`${__ADMIN_BASE__}/projects/${p.id}`} className="icon-btn" aria-label={`Edit ${p.title}`}>
                    <i className="pi pi-pencil" aria-hidden="true" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="panel-head">
            <h2>Recent messages</h2>
            <Link to={`${__ADMIN_BASE__}/messages`} className="btn btn-ghost btn-sm">
              View all <i className="pi pi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="panel-body tight">
            {recentMessages.length === 0 ? (
              <div style={{ padding: 'var(--space-5)' }}>
                <EmptyState
                  icon="pi-envelope"
                  title="No messages yet"
                  message="Contact form submissions will appear here."
                />
              </div>
            ) : (
              recentMessages.map((m) => (
                <div key={m.id} className="mini-row">
                  {!m.is_read ? <span className="dot" aria-label="Unread" /> : <span style={{ width: 8 }} />}
                  <div className="mini-main">
                    <div className="t">{m.subject}</div>
                    <div className="s">
                      {m.name} · {formatDateTime(m.created_at)}
                    </div>
                  </div>
                  <Link to={`${__ADMIN_BASE__}/messages`} className="icon-btn" aria-label="Open inbox">
                    <i className="pi pi-arrow-right" aria-hidden="true" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({ title, crumbs = [], actions = null }) {
  return (
    <div className="admin-page-head">
      <div>
        <div className="crumbs">
          <Link to={__ADMIN_BASE__}>Admin</Link>
          {crumbs.map((c) => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="pi pi-chevron-right" aria-hidden="true" /> {c}
            </span>
          ))}
        </div>
        <h1>{title}</h1>
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </div>
  )
}
