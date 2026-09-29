import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getAllTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { slugify } from '../../lib/utils'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'
import ImageUploader from '../../components/common/ImageUploader'
import Toggle from '../../components/common/Toggle'
import { PageHeader } from './DashboardPage'
import './ProjectsAdminPage.css'

const EMPTY = {
  name: '',
  slug: '',
  role: '',
  bio: '',
  photo_url: '',
  skills: [],
  achievements: [],
  projects: [],
  github_url: '',
  linkedin_url: '',
  twitter_url: '',
  website_url: '',
  is_visible: true,
  sort_order: 0,
}

/** Small editor for a string-list field (one item per line). */
function ListEditor({ label, hint, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea
        rows={4}
        value={value.join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
      />
      <span className="hint">{hint}</span>
    </div>
  )
}

export default function TeamAdminPage() {
  useDocumentMeta({ title: 'Team — Admin', noindex: true })
  const toast = useRef(null)
  const [members, setMembers] = useState([])
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
    getAllTeamMembers()
      .then(setMembers)
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

  function openEdit(member) {
    setEditing(member)
    setForm({ ...EMPTY, ...member })
    setErrors({})
    setDialogOpen(true)
  }

  function set(field) {
    return (e) => {
      const value = e?.target ? e.target.value : e
      setForm((f) => {
        const next = { ...f, [field]: value }
        if (field === 'name' && (!f.slug || f.slug === slugify(f.name || ''))) {
          next.slug = slugify(value || '')
        }
        return next
      })
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function save(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.slug.trim()) next.slug = 'Slug is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        role: form.role.trim(),
        bio: form.bio.trim(),
        photo_url: form.photo_url || null,
        skills: form.skills,
        achievements: form.achievements,
        projects: form.projects,
        github_url: form.github_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        twitter_url: form.twitter_url.trim() || null,
        website_url: form.website_url.trim() || null,
        is_visible: form.is_visible,
        sort_order: Number(form.sort_order) || 0,
      }
      if (editing) {
        const updated = await updateTeamMember(editing.id, payload)
        setMembers((list) => list.map((m) => (m.id === editing.id ? updated : m)))
      } else {
        const created = await createTeamMember(payload)
        setMembers((list) => [...list, created])
      }
      toast.current?.show({ severity: 'success', summary: editing ? 'Member updated' : 'Member added', life: 2000 })
      setDialogOpen(false)
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Save failed', detail: err.message, life: 4000 })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await deleteTeamMember(deleting.id)
      setMembers((list) => list.filter((m) => m.id !== deleting.id))
      toast.current?.show({ severity: 'success', summary: 'Member deleted', life: 2000 })
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Delete failed', detail: err.message, life: 4000 })
    } finally {
      setDeleting(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Team" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader
        title="Team Members"
        crumbs={['Content']}
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
            <i className="pi pi-plus" aria-hidden="true" /> Add member
          </button>
        }
      />

      {loading ? (
        <PageLoading />
      ) : members.length === 0 ? (
        <EmptyState
          icon="pi-users"
          title="No team members yet"
          message="Add the contributors and collaborators clients will see alongside your work."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
              <i className="pi pi-plus" aria-hidden="true" /> Add your first member
            </button>
          }
        />
      ) : (
        <div className="admin-panel">
          <div className="panel-body tight" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Order</th>
                  <th>Visible</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="cell-project">
                        <span className="t">{m.name}</span>
                        <span className="s">/{m.slug}</span>
                      </div>
                    </td>
                    <td><span className="chip">{m.role || '—'}</span></td>
                    <td>{m.sort_order}</td>
                    <td>
                      <Toggle
                        checked={m.is_visible}
                        onChange={(v) =>
                          updateTeamMember(m.id, { is_visible: v }).then(() => {
                            setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, is_visible: v } : x)))
                          })
                        }
                      />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="icon-btn" aria-label={`Edit ${m.name}`} onClick={() => openEdit(m)}>
                        <i className="pi pi-pencil" aria-hidden="true" />
                      </button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${m.name}`} onClick={() => setDeleting(m)}>
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
        header={editing ? `Edit ${editing.name}` : 'Add team member'}
        visible={dialogOpen}
        style={{ width: 'min(640px, 96vw)' }}
        onHide={() => setDialogOpen(false)}
        className="team-dialog"
      >
        <form onSubmit={save}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="tm-name">Name *</label>
              <input id="tm-name" type="text" value={form.name} onChange={set('name')} />
              {errors.name ? <span className="error">{errors.name}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="tm-role">Role</label>
              <input id="tm-role" type="text" value={form.role} onChange={set('role')} placeholder="e.g. UI/UX Designer" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="tm-slug">Slug *</label>
              <input id="tm-slug" type="text" value={form.slug} onChange={set('slug')} />
              <span className="hint">URL: /#/team/{form.slug || 'name'}</span>
            </div>
            <div className="field">
              <label htmlFor="tm-order">Sort order</label>
              <input id="tm-order" type="number" min={0} value={form.sort_order} onChange={set('sort_order')} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="tm-bio">Bio</label>
            <textarea id="tm-bio" rows={3} value={form.bio} onChange={set('bio')} />
          </div>

          <ImageUploader
            label="Photo"
            value={form.photo_url || ''}
            folder="team"
            onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))}
          />

          <ListEditor
            label="Skills (one per line)"
            hint="e.g. React, Figma — shown as chips on the profile."
            value={form.skills}
            onChange={(v) => setForm((f) => ({ ...f, skills: v }))}
          />
          <ListEditor
            label="Achievements (one per line)"
            hint="Each line becomes a star item on the detail page."
            value={form.achievements}
            onChange={(v) => setForm((f) => ({ ...f, achievements: v }))}
          />
          <ListEditor
            label="Projects worked on (one per line)"
            hint="Each line becomes a project showcase item."
            value={form.projects}
            onChange={(v) => setForm((f) => ({ ...f, projects: v }))}
          />

          <div className="field-row">
            <div className="field">
              <label htmlFor="tm-github">GitHub URL</label>
              <input id="tm-github" type="url" value={form.github_url || ''} onChange={set('github_url')} />
            </div>
            <div className="field">
              <label htmlFor="tm-linkedin">LinkedIn URL</label>
              <input id="tm-linkedin" type="url" value={form.linkedin_url || ''} onChange={set('linkedin_url')} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="tm-twitter">Twitter / X URL</label>
              <input id="tm-twitter" type="url" value={form.twitter_url || ''} onChange={set('twitter_url')} />
            </div>
            <div className="field">
              <label htmlFor="tm-website">Website URL</label>
              <input id="tm-website" type="url" value={form.website_url || ''} onChange={set('website_url')} />
            </div>
          </div>

          <Toggle
            checked={form.is_visible}
            onChange={(v) => setForm((f) => ({ ...f, is_visible: v }))}
            label="Visible on the public site"
          />
        </form>
        <div className="mt-5" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDialogOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
            {editing ? 'Save changes' : 'Add member'}
          </button>
        </div>
      </Dialog>

      <Dialog
        header="Delete team member?"
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
