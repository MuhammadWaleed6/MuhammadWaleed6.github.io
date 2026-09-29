import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getAllTimeline,
  createTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
} from '../../services/contentService'
import { TIMELINE_KINDS } from '../../lib/constants'
import { isSupabaseConfigured } from '../../lib/supabase'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'
import Toggle from '../../components/common/Toggle'
import { PageHeader } from './DashboardPage'
import './ProjectsAdminPage.css'

const EMPTY = {
  kind: 'experience',
  title: '',
  organization: '',
  description: '',
  start_date: '',
  end_date: '',
  is_current: false,
  is_visible: true,
  sort_order: 0,
}

export default function TimelineAdminPage() {
  useDocumentMeta({ title: 'Experience & Education — Admin', noindex: true })
  const toast = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    getAllTimeline()
      .then(setItems)
      .catch((err) =>
        toast.current?.show({ severity: 'error', summary: 'Load failed', detail: err.message, life: 4000 })
      )
      .finally(() => setLoading(false))
  }, [])

  function openNew(kind = 'experience') {
    setEditing(null)
    setForm({ ...EMPTY, kind })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({ ...EMPTY, ...item })
    setErrors({})
    setDialogOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        kind: form.kind,
        title: form.title.trim(),
        organization: form.organization.trim() || null,
        description: form.description.trim(),
        start_date: form.start_date.trim() || null,
        end_date: form.is_current ? null : form.end_date.trim() || null,
        is_current: form.is_current,
        is_visible: form.is_visible,
        sort_order: Number(form.sort_order) || 0,
      }
      if (editing) {
        const updated = await updateTimelineItem(editing.id, payload)
        setItems((list) => list.map((t) => (t.id === editing.id ? updated : t)))
      } else {
        const created = await createTimelineItem(payload)
        setItems((list) => [...list, created])
      }
      toast.current?.show({ severity: 'success', summary: editing ? 'Entry updated' : 'Entry added', life: 2000 })
      setDialogOpen(false)
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Save failed', detail: err.message, life: 4000 })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await deleteTimelineItem(deleting.id)
      setItems((list) => list.filter((t) => t.id !== deleting.id))
      toast.current?.show({ severity: 'success', summary: 'Entry deleted', life: 2000 })
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Delete failed', detail: err.message, life: 4000 })
    } finally {
      setDeleting(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Experience & Education" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader
        title="Experience & Education"
        crumbs={['Content']}
        actions={
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => openNew('education')}>
              <i className="pi pi-graduation-cap" aria-hidden="true" /> Education
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openNew('experience')}>
              <i className="pi pi-plus" aria-hidden="true" /> Experience
            </button>
          </div>
        }
      />

      {loading ? (
        <PageLoading />
      ) : items.length === 0 ? (
        <EmptyState
          icon="pi-history"
          title="Nothing here yet"
          message="Add education, experience and milestone entries. Nothing is public until you mark it visible."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openNew('experience')}>
              <i className="pi pi-plus" aria-hidden="true" /> Add entry
            </button>
          }
        />
      ) : (
        <div className="admin-panel">
          <div className="panel-body tight" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Entry</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Order</th>
                  <th>Visible</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="cell-project">
                        <span className="t">{t.title}</span>
                        <span className="s">{t.organization || '—'}</span>
                      </div>
                    </td>
                    <td><span className="chip">{t.kind}</span></td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {[t.start_date, t.is_current ? 'Present' : t.end_date].filter(Boolean).join(' — ') || '—'}
                    </td>
                    <td>{t.sort_order}</td>
                    <td>
                      <Toggle
                        checked={t.is_visible}
                        onChange={(v) =>
                          updateTimelineItem(t.id, { is_visible: v }).then(() => {
                            setItems((list) => list.map((x) => (x.id === t.id ? { ...x, is_visible: v } : x)))
                          })
                        }
                      />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="icon-btn" aria-label={`Edit ${t.title}`} onClick={() => openEdit(t)}>
                        <i className="pi pi-pencil" aria-hidden="true" />
                      </button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${t.title}`} onClick={() => setDeleting(t)}>
                        <i className="pi pi-trash" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        header={editing ? 'Edit entry' : 'Add entry'}
        visible={dialogOpen}
        style={{ width: 'min(540px, 94vw)' }}
        onHide={() => setDialogOpen(false)}
      >
        <form onSubmit={save}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="t-kind">Type</label>
              <select id="t-kind" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
                {TIMELINE_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-order">Sort order</label>
              <input id="t-order" type="number" min={0} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="t-title">Title *</label>
            <input id="t-title" type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            {errors.title ? <span className="error">{errors.title}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="t-org">Organization / School</label>
            <input id="t-org" type="text" value={form.organization || ''} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="t-start">Start date</label>
              <input id="t-start" type="text" value={form.start_date || ''} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} placeholder="e.g. 2022" />
            </div>
            <div className="field">
              <label htmlFor="t-end">End date</label>
              <input
                id="t-end"
                type="text"
                value={form.end_date || ''}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                placeholder="e.g. 2026"
                disabled={form.is_current}
              />
            </div>
          </div>
          <div className="mb-4">
            <Toggle checked={form.is_current} onChange={(v) => setForm((f) => ({ ...f, is_current: v }))} label="Currently ongoing" />
          </div>
          <div className="field">
            <label htmlFor="t-desc">Description</label>
            <textarea id="t-desc" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <Toggle checked={form.is_visible} onChange={(v) => setForm((f) => ({ ...f, is_visible: v }))} label="Visible on the public site" />
        </form>
        <div className="mt-5" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDialogOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
            {editing ? 'Save changes' : 'Add entry'}
          </button>
        </div>
      </Dialog>

      <Dialog
        header="Delete entry?"
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
        <p style={{ margin: 0 }}>Delete <strong>{deleting?.title}</strong>? This cannot be undone.</p>
      </Dialog>
    </div>
  )
}
