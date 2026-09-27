import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getContactMessages,
  setMessageRead,
  deleteMessage,
} from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { formatDateTime } from '../../lib/utils'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'
import { PageHeader } from './DashboardPage'
import './ProjectsAdminPage.css'

export default function MessagesAdminPage() {
  useDocumentMeta('Messages — Admin')
  const toast = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | unread | read
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    getContactMessages()
      .then(setMessages)
      .catch((err) =>
        toast.current?.show({ severity: 'error', summary: 'Load failed', detail: err.message, life: 4000 })
      )
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = messages
    if (filter === 'unread') list = list.filter((m) => !m.is_read)
    if (filter === 'read') list = list.filter((m) => m.is_read)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      )
    }
    return list
  }, [messages, filter, query])

  const unreadCount = messages.filter((m) => !m.is_read).length

  async function openMessage(message) {
    setSelected(message)
    if (!message.is_read) {
      try {
        await setMessageRead(message.id, true)
        setMessages((list) => list.map((m) => (m.id === message.id ? { ...m, is_read: true } : m)))
      } catch {
        /* non-blocking */
      }
    }
  }

  async function toggleRead(message) {
    try {
      await setMessageRead(message.id, !message.is_read)
      setMessages((list) => list.map((m) => (m.id === message.id ? { ...m, is_read: !message.is_read } : m)))
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Update failed', detail: err.message, life: 4000 })
    }
  }

  async function confirmDelete() {
    try {
      await deleteMessage(deleting.id)
      setMessages((list) => list.filter((m) => m.id !== deleting.id))
      if (selected?.id === deleting.id) setSelected(null)
      toast.current?.show({ severity: 'success', summary: 'Message deleted', life: 2000 })
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Delete failed', detail: err.message, life: 4000 })
    } finally {
      setDeleting(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Messages" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader title="Messages" crumbs={['Site']} />

      <div className="projects-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="filter-chips" role="group" aria-label="Filter messages">
          {[
            { key: 'all', label: `All (${messages.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'read', label: 'Read' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`filter-chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="search-box">
          <i className="pi pi-search" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search messages…"
            aria-label="Search messages"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <PageLoading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="pi-envelope"
          title={messages.length === 0 ? 'No messages yet' : 'Nothing matches'}
          message={
            messages.length === 0
              ? 'Contact form submissions from the public site will appear here.'
              : 'Try a different search or filter.'
          }
        />
      ) : (
        <div className="admin-panel">
          <div className="panel-body tight">
            {filtered.map((m) => (
              <div key={m.id} className={`msg-row ${m.is_read ? 'read' : 'unread'}`}>
                <span className={`dot ${m.is_read ? 'dim' : ''}`} aria-label={m.is_read ? 'Read' : 'Unread'} />
                <button type="button" className="msg-main" onClick={() => openMessage(m)}>
                  <span className="t">
                    {m.subject}
                    {!m.is_read ? <span className="badge badge-soft" style={{ marginLeft: 8 }}>New</span> : null}
                  </span>
                  <span className="s">
                    {m.name} · {m.email} · {formatDateTime(m.created_at)}
                  </span>
                </button>
                <div className="msg-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={m.is_read ? 'Mark as unread' : 'Mark as read'}
                    onClick={() => toggleRead(m)}
                  >
                    <i className={`pi ${m.is_read ? 'pi-eye-slash' : 'pi-eye'}`} aria-hidden="true" />
                  </button>
                  <a className="icon-btn" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} aria-label={`Reply to ${m.name}`}>
                    <i className="pi pi-reply" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Delete message from ${m.name}`}
                    onClick={() => setDeleting(m)}
                  >
                    <i className="pi pi-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog
        header={selected?.subject}
        visible={Boolean(selected)}
        style={{ width: 'min(560px, 94vw)' }}
        onHide={() => setSelected(null)}
      >
        {selected ? (
          <div>
            <p className="text-muted text-small" style={{ marginTop: 0 }}>
              From <strong>{selected.name}</strong> ({selected.email}) ·{' '}
              {formatDateTime(selected.created_at)}
            </p>
            <div className="msg-body">{selected.message}</div>
            <div className="mt-5">
              <a className="btn btn-primary btn-sm" href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}>
                <i className="pi pi-reply" aria-hidden="true" /> Reply by email
              </a>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        header="Delete message?"
        visible={Boolean(deleting)}
        style={{ width: 'min(420px, 92vw)' }}
        onHide={() => setDeleting(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleting(null)}>Cancel</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete}>Delete</button>
          </div>
        }
      >
        <p style={{ margin: 0 }}>
          Delete the message from <strong>{deleting?.name}</strong>? This cannot be undone.
        </p>
      </Dialog>
    </div>
  )
}
