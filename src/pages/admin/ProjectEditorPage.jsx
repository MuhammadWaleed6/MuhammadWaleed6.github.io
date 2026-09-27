import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  createProject,
  updateProject,
  uploadMedia,
  deleteMediaByUrl,
  getAllProjects,
} from '../../services/contentService'
import { PROJECT_CATEGORIES } from '../../lib/constants'
import { isValidUrl, slugify, parseList, listToText } from '../../lib/utils'
import ImageUploader from '../../components/common/ImageUploader'
import Toggle from '../../components/common/Toggle'
import PageLoading from '../../components/common/PageLoading'
import { PageHeader } from './DashboardPage'

const EMPTY = {
  title: '',
  slug: '',
  short_description: '',
  full_description: '',
  cover_image_url: '',
  gallery_images: [],
  technologies: [],
  category: 'Web App',
  live_url: '',
  github_url: '',
  is_featured: false,
  is_published: false,
  sort_order: 0,
}

export default function ProjectEditorPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [original, setOriginal] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [galleryText, setGalleryText] = useState('')

  useDocumentMeta(isEdit ? 'Edit project — Admin' : 'New project — Admin')

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    getAllProjects()
      .then((list) => {
        if (cancelled) return
        const found = list.find((p) => p.id === id)
        if (found) {
          setForm({ ...EMPTY, ...found })
          setOriginal(found)
          setGalleryText(listToText(found.gallery_images))
        } else {
          navigate('/admin/projects', { replace: true })
        }
      })
      .catch(() => navigate('/admin/projects', { replace: true }))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit, navigate])

  function set(field) {
    return (e) => {
      const value = e?.target ? e.target.value : e
      setForm((f) => {
        const next = { ...f, [field]: value }
        if (field === 'title') {
          // Auto-slug from title unless the user has customized the slug.
          if (!f.slug || f.slug === slugify(f.title)) next.slug = slugify(value)
        }
        return next
      })
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate() {
    const next = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.slug.trim()) next.slug = 'Slug is required.'
    else if (!/^[a-z0-9-]+$/.test(form.slug)) next.slug = 'Use lowercase letters, numbers and dashes only.'
    if (!form.short_description.trim()) next.short_description = 'Add a one-line summary.'
    if (form.live_url && !isValidUrl(form.live_url)) next.live_url = 'Enter a valid URL (https://…).'
    if (form.github_url && !isValidUrl(form.github_url)) next.github_url = 'Enter a valid URL (https://…).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSave(publish) {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        short_description: form.short_description.trim(),
        full_description: form.full_description,
        cover_image_url: form.cover_image_url || null,
        gallery_images: parseList(galleryText),
        technologies: parseList(form.technologies),
        category: form.category,
        live_url: form.live_url.trim() || null,
        github_url: form.github_url.trim() || null,
        is_featured: form.is_featured,
        is_published: publish !== undefined ? publish : form.is_published,
        sort_order: Number(form.sort_order) || 0,
      }

      // Clean up replaced cover images from storage.
      if (original?.cover_image_url && payload.cover_image_url !== original.cover_image_url) {
        deleteMediaByUrl(original.cover_image_url)
      }

      const saved = isEdit
        ? await updateProject(id, payload)
        : await createProject(payload)

      if (publish === true && !form.is_published) {
        // reflect immediate publish in the saved record
        saved.is_published = true
      }

      navigate(`/admin/projects/${saved.id}`, { replace: !isEdit })
    } catch (err) {
      setErrors({ form: err.message || 'Could not save the project.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoading label="Loading project…" />

  return (
    <div className="admin-page">
      <PageHeader
        title={isEdit ? 'Edit project' : 'New project'}
        crumbs={['Content', 'Projects']}
        actions={
          <div className="flex gap-2">
            {isEdit ? (
              <Link className="btn btn-outline btn-sm" to={`/projects/${form.slug}`} target="_blank" rel="noreferrer">
                <i className="pi pi-eye" aria-hidden="true" /> Preview
              </Link>
            ) : null}
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onSave()} disabled={saving}>
              {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
              Save
            </button>
          </div>
        }
      />

      {errors.form ? (
        <div className="form-banner error" role="alert">
          <i className="pi pi-exclamation-triangle" aria-hidden="true" /> <span>{errors.form}</span>
        </div>
      ) : null}

      <div className="editor-grid">
        <div className="admin-panel">
          <div className="panel-head"><h2>Project details</h2></div>
          <div className="panel-body">
            <div className="field">
              <label htmlFor="p-title">Title *</label>
              <input id="p-title" type="text" value={form.title} onChange={set('title')} />
              {errors.title ? <span className="error">{errors.title}</span> : null}
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="p-slug">Slug *</label>
                <input id="p-slug" type="text" value={form.slug} onChange={set('slug')} />
                <span className="hint">URL: /#/projects/{form.slug || 'your-title'}</span>
                {errors.slug ? <span className="error">{errors.slug}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="p-category">Category</label>
                <select id="p-category" value={form.category} onChange={set('category')}>
                  {PROJECT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="p-short">Short description *</label>
              <textarea id="p-short" rows={2} value={form.short_description} onChange={set('short_description')} />
              <span className="hint">Shown on cards. One or two sentences.</span>
              {errors.short_description ? <span className="error">{errors.short_description}</span> : null}
            </div>

            <div className="field">
              <label htmlFor="p-full">Full description</label>
              <textarea id="p-full" rows={8} value={form.full_description} onChange={set('full_description')} />
              <span className="hint">Shown on the project page. Separate paragraphs with a blank line.</span>
            </div>

            <div className="field">
              <label htmlFor="p-tech">Technologies</label>
              <input
                id="p-tech"
                type="text"
                value={listToText(form.technologies)}
                onChange={(e) => setForm((f) => ({ ...f, technologies: parseList(e.target.value) }))}
                placeholder="React, Supabase, Tailwind"
              />
              <span className="hint">Comma separated.</span>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="p-live">Live demo URL</label>
                <input id="p-live" type="url" value={form.live_url || ''} onChange={set('live_url')} placeholder="https://…" />
                {errors.live_url ? <span className="error">{errors.live_url}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="p-github">GitHub URL</label>
                <input id="p-github" type="url" value={form.github_url || ''} onChange={set('github_url')} placeholder="https://github.com/…" />
                {errors.github_url ? <span className="error">{errors.github_url}</span> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="editor-side">
          <div className="admin-panel">
            <div className="panel-head"><h2>Cover image</h2></div>
            <div className="panel-body">
              <ImageUploader
                label="Cover image"
                value={form.cover_image_url || ''}
                folder="projects"
                onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
              />
            </div>
          </div>

          <div className="admin-panel">
            <div className="panel-head"><h2>Extra images</h2></div>
            <div className="panel-body">
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="p-gallery">Gallery image URLs</label>
                <textarea
                  id="p-gallery"
                  rows={3}
                  value={galleryText}
                  onChange={(e) => setGalleryText(e.target.value)}
                  placeholder="https://…, https://…"
                />
                <span className="hint">Comma separated URLs (upload extra images via Storage or paste any image URL).</span>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <div className="panel-head"><h2>Publishing</h2></div>
            <div className="panel-body">
              <div className="mb-4">
                <Toggle
                  checked={form.is_published}
                  onChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                  label="Published (visible on the public site)"
                />
              </div>
              <div className="mb-4">
                <Toggle
                  checked={form.is_featured}
                  onChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
                  label="Featured project"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="p-order">Sort order</label>
                <input
                  id="p-order"
                  type="number"
                  value={form.sort_order}
                  onChange={set('sort_order')}
                  min={0}
                />
              </div>
            </div>
          </div>

          <button type="button" className="btn btn-primary btn-block" onClick={() => onSave()} disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" aria-hidden="true" /> Saving…
              </>
            ) : (
              <>
                <i className="pi pi-check" aria-hidden="true" /> {isEdit ? 'Save changes' : 'Create project'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
