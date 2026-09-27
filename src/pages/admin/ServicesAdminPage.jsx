import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
} from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'
import Toggle from '../../components/common/Toggle'
import { PageHeader } from './DashboardPage'
import './ProjectsAdminPage.css'

const EMPTY = { title: '', description: '', icon: '', starting_price: '', is_visible: true, sort_order: 0 }

export default function ServicesAdminPage() {
  useDocumentMeta('Services — Admin')
  const toast = useRef(null)
  const [services, setServices] = useState([])
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
    getAllServices()
      .then(setServices)
      .catch((err) =>
        toast.current?.show({ severity: 'error', summary: 'Load failed', detail: err.message, life: 4000 })
      )
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(service) {
    setEditing(service)
    setForm({ ...EMPTY, ...service })
    setErrors({})
    setDialogOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: 'Service title is required.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon.trim() || null,
        starting_price: form.starting_price.trim() || null,
        is_visible: form.is_visible,
        sort_order: Number(form.sort_order) || 0,
      }
      if (editing) {
        const updated = await updateService(editing.id, payload)
        setServices((list) => list.map((s) => (s.id === editing.id ? updated : s)))
      } else {
        const created = await createService(payload)
        setServices((list) => [...list, created])
      }
      toast.current?.show({ severity: 'success', summary: editing ? 'Service updated' : 'Service added', life: 2000 })
      setDialogOpen(false)
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Save failed', detail: err.message, life: 4000 })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await deleteService(deleting.id)
      setServices((list) => list.filter((s) => s.id !== deleting.id))
      toast.current?.show({ severity: 'success', summary: 'Service deleted', life: 2000 })
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Delete failed', detail: err.message, life: 4000 })
    } finally {
      setDeleting(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Services" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader
        title="Services"
        crumbs={['Content']}
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
            <i className="pi pi-plus" aria-hidden="true" /> Add service
          </button>
        }
      />

      {loading ? (
        <PageLoading />
      ) : services.length === 0 ? (
        <EmptyState
          icon="pi-briefcase"
          title="No services yet"
          message="Describe what you can offer clients."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
              <i className="pi pi-plus" aria-hidden="true" /> Add your first service
            </button>
          }
        />
      ) : (
        <div className="admin-panel">
          <div className="panel-body tight" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Price</th>
                  <th>Order</th>
                  <th>Visible</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-project">
                        <span className="t">{s.title}</span>
                        <span className="s">{s.description?.slice(0, 70)}…</span>
                      </div>
                    </td>
                    <td className="text-muted">{s.starting_price || '—'}</td>
                    <td>{s.sort_order}</td>
                    <td>
                      <Toggle
                        checked={s.is_visible}
                        onChange={(v) =>
                          updateService(s.id, { is_visible: v }).then(() => {
                            setServices((list) => list.map((x) => (x.id === s.id ? { ...x, is_visible: v } : x)))
                          })
                        }
                      />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="icon-btn" aria-label={`Edit ${s.title}`} onClick={() => openEdit(s)}>
                        <i className="pi pi-pencil" aria-hidden="true" />
                      </button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${s.title}`} onClick={() => setDeleting(s)}>
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
        header={editing ? 'Edit service' : 'Add service'}
        visible={dialogOpen}
        style={{ width: 'min(520px, 94vw)' }}
        onHide={() => setDialogOpen(false)}
      >
        <form onSubmit={save}>
          <div className="field">
            <label htmlFor="sv-title">Title *</label>
            <input id="sv-title" type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            {errors.title ? <span className="error">{errors.title}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="sv-desc">Description</label>
            <textarea id="sv-desc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="sv-price">Starting price (optional)</label>
              <input
                id="sv-price"
                type="text"
                value={form.starting_price || ''}
                onChange={(e) => setForm((f) => ({ ...f, starting_price: e.target.value }))}
                placeholder="Leave empty to hide"
              />
            </div>
            <div className="field">
              <label htmlFor="sv-order">Sort order</label>
              <input id="sv-order" type="number" min={0} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sv-icon">PrimeIcon class (optional)</label>
            <input
              id="sv-icon"
              type="text"
              value={form.icon || ''}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="pi-globe"
            />
          </div>
          <Toggle checked={form.is_visible} onChange={(v) => setForm((f) => ({ ...f, is_visible: v }))} label="Visible on the public site" />
        </form>
        <div className="mt-5" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDialogOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
            {editing ? 'Save changes' : 'Add service'}
          </button>
        </div>
      </Dialog>

      <Dialog
        header="Delete service?"
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
