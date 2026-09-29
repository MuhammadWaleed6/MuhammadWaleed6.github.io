import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { useRef } from 'react'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getAllProjects, updateProject, deleteProject } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'
import Toggle from '../../components/common/Toggle'
import { PageHeader } from './DashboardPage'
import './DashboardPage.css'

export default function ProjectsAdminPage() {
  useDocumentMeta({ title: 'Projects — Admin', noindex: true })
  const toast = useRef(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [savingId, setSavingId] = useState(null)

  async function load() {
    try {
      const data = await getAllProjects()
      setProjects(data)
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Load failed',
        detail: err.message,
        life: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    load()
  }, [])

  async function toggleField(project, field, value) {
    setSavingId(project.id)
    try {
      await updateProject(project.id, { [field]: value })
      setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, [field]: value } : p)))
      toast.current?.show({ severity: 'success', summary: 'Saved', life: 2000 })
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Update failed',
        detail: err.message,
        life: 4000,
      })
    } finally {
      setSavingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteProject(deleting.id)
      setProjects((list) => list.filter((p) => p.id !== deleting.id))
      toast.current?.show({ severity: 'success', summary: 'Project deleted', life: 2500 })
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Delete failed',
        detail: err.message,
        life: 4000,
      })
    } finally {
      setDeleting(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Projects" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />

      <PageHeader
        title="Projects"
        crumbs={['Content']}
        actions={
          <Link to={`${__ADMIN_BASE__}/projects/new`} className="btn btn-primary btn-sm">
            <i className="pi pi-plus" aria-hidden="true" /> New project
          </Link>
        }
      />

      {loading ? (
        <PageLoading label="Loading projects…" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="pi-briefcase"
          title="No projects yet"
          message="Add your first project to showcase your work on the portfolio."
          action={
            <Link to={`${__ADMIN_BASE__}/projects/new`} className="btn btn-primary btn-sm">
              <i className="pi pi-plus" aria-hidden="true" /> Add your first project
            </Link>
          }
        />
      ) : (
        <div className="admin-panel">
          <div className="panel-body tight" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Published</th>
                  <th>Featured</th>
                  <th>Updated</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ width: 64 }}>
                      <input
                        type="number"
                        className="order-input"
                        aria-label={`Sort order for ${p.title}`}
                        defaultValue={p.sort_order}
                        min={0}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10) || 0
                          if (val !== p.sort_order) toggleField(p, 'sort_order', val)
                        }}
                      />
                    </td>
                    <td>
                      <div className="cell-project">
                        <span className="t">{p.title}</span>
                        <span className="s">/{p.slug}</span>
                      </div>
                    </td>
                    <td>
                      <span className="chip">{p.category}</span>
                    </td>
                    <td>
                      <Toggle
                        checked={p.is_published}
                        disabled={savingId === p.id}
                        onChange={(v) => toggleField(p, 'is_published', v)}
                      />
                    </td>
                    <td>
                      <Toggle
                        checked={p.is_featured}
                        disabled={savingId === p.id}
                        onChange={(v) => toggleField(p, 'is_featured', v)}
                      />
                    </td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {formatDate(p.updated_at)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <Link to={`${__ADMIN_BASE__}/projects/${p.id}`} className="icon-btn" aria-label={`Edit ${p.title}`}>
                        <i className="pi pi-pencil" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label={`Delete ${p.title}`}
                        onClick={() => setDeleting(p)}
                      >
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
        header="Delete project?"
        visible={Boolean(deleting)}
        style={{ width: 'min(440px, 92vw)' }}
        onHide={() => setDeleting(null)}
        footer={
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete}>
              <i className="pi pi-trash" aria-hidden="true" /> Delete permanently
            </button>
          </div>
        }
      >
        <p style={{ margin: 0 }}>
          Are you sure you want to delete <strong>{deleting?.title}</strong>? This cannot be
          undone.
        </p>
      </Dialog>
    </div>
  )
}
