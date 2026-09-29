import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getAllSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from '../../services/contentService'
import { SKILL_CATEGORIES } from '../../lib/constants'
import { isSupabaseConfigured } from '../../lib/supabase'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'
import Toggle from '../../components/common/Toggle'
import { PageHeader } from './DashboardPage'
import './ProjectsAdminPage.css'

const EMPTY = { name: '', category: 'Frontend', icon: '', proficiency_label: '', is_visible: true, sort_order: 0 }

export default function SkillsAdminPage() {
  useDocumentMeta({ title: 'Skills — Admin', noindex: true })
  const toast = useRef(null)
  const [skills, setSkills] = useState([])
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
    getAllSkills()
      .then(setSkills)
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

  function openEdit(skill) {
    setEditing(skill)
    setForm({ ...EMPTY, ...skill })
    setErrors({})
    setDialogOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: 'Skill name is required.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        icon: form.icon.trim() || null,
        proficiency_label: form.proficiency_label.trim() || null,
        is_visible: form.is_visible,
        sort_order: Number(form.sort_order) || 0,
      }
      if (editing) {
        const updated = await updateSkill(editing.id, payload)
        setSkills((list) => list.map((s) => (s.id === editing.id ? updated : s)))
      } else {
        const created = await createSkill(payload)
        setSkills((list) => [...list, created])
      }
      toast.current?.show({ severity: 'success', summary: editing ? 'Skill updated' : 'Skill added', life: 2000 })
      setDialogOpen(false)
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Save failed', detail: err.message, life: 4000 })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await deleteSkill(deleting.id)
      setSkills((list) => list.filter((s) => s.id !== deleting.id))
      toast.current?.show({ severity: 'success', summary: 'Skill deleted', life: 2000 })
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Delete failed', detail: err.message, life: 4000 })
    } finally {
      setDeleting(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Skills" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader
        title="Skills"
        crumbs={['Content']}
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
            <i className="pi pi-plus" aria-hidden="true" /> Add skill
          </button>
        }
      />

      {loading ? (
        <PageLoading />
      ) : skills.length === 0 ? (
        <EmptyState
          icon="pi-tags"
          title="No skills yet"
          message="Add the technologies and tools you work with."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
              <i className="pi pi-plus" aria-hidden="true" /> Add your first skill
            </button>
          }
        />
      ) : (
        <div className="admin-panel">
          <div className="panel-body tight" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Category</th>
                  <th>Level label</th>
                  <th>Order</th>
                  <th>Visible</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td><span className="chip">{s.category}</span></td>
                    <td className="text-muted">{s.proficiency_label || '—'}</td>
                    <td>{s.sort_order}</td>
                    <td>
                      <Toggle checked={s.is_visible} onChange={(v) => updateSkill(s.id, { is_visible: v }).then(() => {
                        setSkills((list) => list.map((x) => (x.id === s.id ? { ...x, is_visible: v } : x)))
                      })} />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="icon-btn" aria-label={`Edit ${s.name}`} onClick={() => openEdit(s)}>
                        <i className="pi pi-pencil" aria-hidden="true" />
                      </button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}>
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
        header={editing ? 'Edit skill' : 'Add skill'}
        visible={dialogOpen}
        style={{ width: 'min(480px, 94vw)' }}
        onHide={() => setDialogOpen(false)}
      >
        <form onSubmit={save}>
          <div className="field">
            <label htmlFor="s-name">Name *</label>
            <input id="s-name" type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {errors.name ? <span className="error">{errors.name}</span> : null}
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="s-cat">Category</label>
              <select id="s-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-order">Sort order</label>
              <input id="s-order" type="number" min={0} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-prof">Proficiency label (optional)</label>
            <input
              id="s-prof"
              type="text"
              value={form.proficiency_label || ''}
              onChange={(e) => setForm((f) => ({ ...f, proficiency_label: e.target.value }))}
              placeholder="e.g. Comfortable, Advanced — leave empty for neutral display"
            />
          </div>
          <div className="field">
            <label htmlFor="s-icon">PrimeIcon class (optional)</label>
            <input
              id="s-icon"
              type="text"
              value={form.icon || ''}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="pi-check-circle"
            />
            <span className="hint">PrimeIcons name without the "pi pi-" prefix.</span>
          </div>
          <Toggle checked={form.is_visible} onChange={(v) => setForm((f) => ({ ...f, is_visible: v }))} label="Visible on the public site" />
        </form>
        <div className="flex gap-2 mt-5" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDialogOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
            {editing ? 'Save changes' : 'Add skill'}
          </button>
        </div>
      </Dialog>

      <Dialog
        header="Delete skill?"
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
        <p style={{ margin: 0 }}>Delete <strong>{deleting?.name}</strong>? This cannot be undone.</p>
      </Dialog>
    </div>
  )
}
