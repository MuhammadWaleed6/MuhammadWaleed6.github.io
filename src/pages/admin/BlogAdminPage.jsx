import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { slugify } from '../../lib/utils'
import PageLoading from '../../components/common/PageLoading'
import EmptyState from '../../components/common/EmptyState'
import SetupNotice from '../../components/common/SetupNotice'
import Toggle from '../../components/common/Toggle'
import ImageUploader from '../../components/common/ImageUploader'
import { PageHeader } from './DashboardPage'
import './ProjectsAdminPage.css'

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  tags: [],
  reading_minutes: 4,
  is_published: false,
  is_visible: true,
  sort_order: 0,
}

/** Small formatting toolbar that inserts markdown into the content textarea. */
function MdToolbar({ textareaRef, onInsert }) {
  function wrap(before, after = before, placeholder = 'text') {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const selected = value.slice(s, e) || placeholder
    const next = `${value.slice(0, s)}${before}${selected}${after}${value.slice(e)}`
    onInsert(next, s + before.length + selected.length)
  }

  const btn = (label, icon, title, fn) => (
    <button
      key={label}
      type="button"
      className="icon-btn"
      title={title}
      aria-label={title}
      onClick={() => fn()}
    >
      <i className={`pi ${icon}`} aria-hidden="true" />
    </button>
  )

  return (
    <div className="md-toolbar" role="toolbar" aria-label="Formatting">
      {btn('h2', 'pi-align-left', 'Heading', () => wrap('\n\n## ', '', 'Heading'))}
      {btn('h3', 'pi-align-left', 'Subheading', () => wrap('\n\n### ', '', 'Subheading'))}
      {btn('bold', 'pi-bold', 'Bold', () => wrap('**'))}
      {btn('italic', 'pi italic fallback', 'Italic', () => wrap('*'))}
      {btn('code', 'pi-minus', 'Inline code', () => wrap('`'))}
      {btn('link', 'pi-link', 'Link', () => {
        const el = textareaRef.current
        const url = window.prompt('Link URL (https://…)')
        if (!url) return
        wrap(`[`, `](${url})`, 'link text')
        void el
      })}
    </div>
  )
}

export default function BlogAdminPage() {
  useDocumentMeta({ title: 'Blog — Admin', noindex: true })
  const toast = useRef(null)
  const contentRef = useRef(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [tagsText, setTagsText] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    getAllBlogPosts()
      .then(setPosts)
      .catch((err) =>
        toast.current?.show({ severity: 'error', summary: 'Load failed', detail: err.message, life: 4000 })
      )
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY, sort_order: (posts.length || 0) + 1 })
    setTagsText('')
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(post) {
    setEditing(post)
    setForm({ ...EMPTY, ...post })
    setTagsText((post.tags || []).join(', '))
    setErrors({})
    setDialogOpen(true)
  }

  function setContent(value, caret) {
    setForm((f) => ({ ...f, content: value }))
    if (caret != null && contentRef.current) {
      requestAnimationFrame(() => {
        contentRef.current.focus()
        contentRef.current.setSelectionRange(caret, caret)
      })
    }
  }

  async function save(e) {
    e.preventDefault()
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.excerpt.trim()) nextErrors.excerpt = 'Write a short excerpt (shown in lists and search results).'
    if (!form.content.trim()) nextErrors.content = 'The article body cannot be empty.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const payload = {
        title: form.title.trim(),
        slug: slugify(form.slug || form.title),
        excerpt: form.excerpt.trim(),
        content: form.content,
        cover_image_url: form.cover_image_url || null,
        tags,
        reading_minutes: Math.max(1, Number(form.reading_minutes) || 4),
        is_published: form.is_published,
        is_visible: form.is_visible,
        sort_order: Number(form.sort_order) || 0,
      }
      if (editing) {
        const updated = await updateBlogPost(editing.id, payload)
        setPosts((list) => list.map((p) => (p.id === editing.id ? updated : p)))
      } else {
        const created = await createBlogPost(payload)
        setPosts((list) => [created, ...list])
      }
      toast.current?.show({ severity: 'success', summary: editing ? 'Post updated' : 'Post published', life: 2000 })
      setDialogOpen(false)
    } catch (err) {
      const detail = err.message?.includes('duplicate key')
        ? 'That slug is already used by another post. Change the slug.'
        : err.message
      toast.current?.show({ severity: 'error', summary: 'Save failed', detail, life: 5000 })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    try {
      await deleteBlogPost(deleting.id)
      setPosts((list) => list.filter((p) => p.id !== deleting.id))
      toast.current?.show({ severity: 'success', summary: 'Post deleted', life: 2000 })
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Delete failed', detail: err.message, life: 4000 })
    } finally {
      setDeleting(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Blog" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader
        title="Blog"
        crumbs={['Content']}
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
            <i className="pi pi-plus" aria-hidden="true" /> New post
          </button>
        }
      />

      {loading ? (
        <PageLoading />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="pi-book"
          title="No blog posts yet"
          message="Write your first article — it will appear on the blog page once published."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
              <i className="pi pi-plus" aria-hidden="true" /> Write your first post
            </button>
          }
        />
      ) : (
        <div className="admin-panel">
          <div className="panel-body tight" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Order</th>
                  <th>Published</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-project">
                        <span className="t">{p.title}</span>
                        <span className="s">
                          /blog/{p.slug} · {p.reading_minutes} min · {(p.tags || []).join(', ') || 'no tags'}
                        </span>
                      </div>
                    </td>
                    <td>{p.sort_order}</td>
                    <td>
                      <Toggle
                        checked={p.is_published}
                        onChange={(v) =>
                          updateBlogPost(p.id, { is_published: v }).then((updated) => {
                            setPosts((list) => list.map((x) => (x.id === p.id ? updated : x)))
                          })
                        }
                      />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="icon-btn" aria-label={`Edit ${p.title}`} onClick={() => openEdit(p)}>
                        <i className="pi pi-pencil" aria-hidden="true" />
                      </button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${p.title}`} onClick={() => setDeleting(p)}>
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
        header={editing ? 'Edit post' : 'New post'}
        visible={dialogOpen}
        style={{ width: 'min(860px, 96vw)' }}
        onHide={() => setDialogOpen(false)}
      >
        <form onSubmit={save}>
          <div className="field">
            <label htmlFor="bp-title">Title *</label>
            <input
              id="bp-title"
              type="text"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value
                setForm((f) => ({
                  ...f,
                  title,
                  // keep the auto-slug in sync unless customized
                  slug: !f.slug || f.slug === slugify(f.title) ? slugify(title) : f.slug,
                }))
              }}
            />
            {errors.title ? <span className="error">{errors.title}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="bp-slug">URL slug</label>
            <input
              id="bp-slug"
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated from the title"
            />
            <span className="hint">Live at mwalid.me/blog/{form.slug || '…'}</span>
          </div>

          <div className="field">
            <label htmlFor="bp-excerpt">Excerpt *</label>
            <textarea
              id="bp-excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="One or two sentences shown in lists, previews and search results."
            />
            {errors.excerpt ? <span className="error">{errors.excerpt}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="bp-content">Content (markdown — ## heading, **bold**, [link](url), `code`)</label>
            <MdToolbar textareaRef={contentRef} onInsert={setContent} />
            <textarea
              id="bp-content"
              ref={contentRef}
              rows={14}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="md-editor"
            />
            {errors.content ? <span className="error">{errors.content}</span> : null}
          </div>

          <ImageUploader
            value={form.cover_image_url || ''}
            onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
            folder="blog"
            label="Cover image (optional)"
          />

          <div className="field-row">
            <div className="field">
              <label htmlFor="bp-tags">Tags (comma separated)</label>
              <input
                id="bp-tags"
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="React, Supabase, CSS"
              />
            </div>
            <div className="field">
              <label htmlFor="bp-minutes">Reading minutes</label>
              <input
                id="bp-minutes"
                type="number"
                min={1}
                value={form.reading_minutes}
                onChange={(e) => setForm((f) => ({ ...f, reading_minutes: e.target.value }))}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="bp-order">Sort order</label>
              <input
                id="bp-order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
              <span className="hint">Lower numbers appear first. Prev/next follows this order.</span>
            </div>
            <div className="field" style={{ justifyContent: 'flex-end', paddingBottom: 10 }}>
              <Toggle
                checked={form.is_published}
                onChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                label="Published (visible on the public blog)"
              />
            </div>
          </div>
        </form>
        <div className="mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDialogOpen(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
            {editing ? 'Save changes' : 'Create post'}
          </button>
        </div>
      </Dialog>

      <Dialog
        header="Delete post?"
        visible={Boolean(deleting)}
        style={{ width: 'min(420px, 92vw)' }}
        onHide={() => setDeleting(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        }
      >
        <p style={{ margin: 0 }}>
          Delete <strong>{deleting?.title}</strong>? This cannot be undone.
        </p>
      </Dialog>
    </div>
  )
}
