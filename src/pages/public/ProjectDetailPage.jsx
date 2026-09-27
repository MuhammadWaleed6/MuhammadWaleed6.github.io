import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { formatDateTime } from '../../lib/utils'

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const { settings } = useSiteSettings()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useDocumentMeta(
    loading ? 'Loading project…' : project ? `${project.title} — ${settings.display_name}` : 'Project not found',
    project?.short_description || settings.meta_description
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setError('')

    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          setError('Could not load this project. Please try again.')
        } else if (!data) {
          setNotFound(true)
        } else {
          setProject(data)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <div className="skeleton" style={{ height: 380, borderRadius: 14 }} />
        </div>
      </section>
    )
  }

  if (error || notFound || !project) {
    return (
      <section className="section">
        <div className="container">
          <div className="state-block">
            <i className="pi pi-compass" aria-hidden="true" />
            <h3>{notFound ? 'Project not found' : 'Something went wrong'}</h3>
            <p>
              {notFound
                ? "This project doesn't exist or isn't published."
                : error}
            </p>
            <Link to="/projects" className="btn btn-primary btn-sm">
              <i className="pi pi-arrow-left" aria-hidden="true" /> Back to projects
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const gallery = Array.isArray(project.gallery_images) ? project.gallery_images : []

  return (
    <>
      <section className="project-hero">
        <div className="container">
          <Link to="/projects" className="back-link">
            <i className="pi pi-arrow-left" aria-hidden="true" /> All projects
          </Link>
          <span className="chip">{project.category}</span>
          <h1>{project.title}</h1>
          <p className="lead">{project.short_description}</p>
          <div className="tags">
            {(project.technologies || []).map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container project-detail">
          <div className="detail-media">
            {project.cover_image_url ? (
              <img src={project.cover_image_url} alt={`${project.title} cover`} />
            ) : (
              <div className="cover-fallback-lg">
                <i className="pi pi-images" aria-hidden="true" />
                <span>No cover image</span>
              </div>
            )}

            {gallery.length > 0 ? (
              <div className="detail-gallery">
                {gallery.map((src) => (
                  <img key={src} src={src} alt={`${project.title} screenshot`} loading="lazy" />
                ))}
              </div>
            ) : null}
          </div>

          <aside className="detail-side">
            <div className="side-card">
              <h3>Links</h3>
              <div className="side-links">
                {project.live_url ? (
                  <a className="btn btn-primary btn-sm" href={project.live_url} target="_blank" rel="noreferrer">
                    <i className="pi pi-external-link" aria-hidden="true" /> Live demo
                  </a>
                ) : null}
                {project.github_url ? (
                  <a className="btn btn-outline btn-sm" href={project.github_url} target="_blank" rel="noreferrer">
                    <i className="pi pi-github" aria-hidden="true" /> Source code
                  </a>
                ) : null}
                {!project.live_url && !project.github_url ? <p className="text-muted text-small">Links coming soon.</p> : null}
              </div>
            </div>

            <div className="side-card">
              <h3>Info</h3>
              <dl>
                <dt>Category</dt>
                <dd>{project.category}</dd>
                <dt>Updated</dt>
                <dd>{formatDateTime(project.updated_at)}</dd>
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {project.full_description ? (
        <section className="section section-alt">
          <div className="container detail-about">
            <h2>About this project</h2>
            {project.full_description.split(/\n{2,}/).map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
