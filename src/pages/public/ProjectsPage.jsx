import { useEffect, useMemo, useState } from 'react'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getPublishedProjects } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import SectionHeading from '../../components/portfolio/SectionHeading'
import ProjectCard from '../../components/portfolio/ProjectCard'
import SetupNotice from '../../components/common/SetupNotice'
import { escapeRegExp } from '../../lib/utils'

export default function ProjectsPage() {
  const { settings } = useSiteSettings()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  useDocumentMeta({
    title: `Projects — ${settings.display_name}`,
    description:
      'Browse real projects built by Muhammad Walid — websites and web applications taken end-to-end, from the first idea to a deployed product.',
    canonicalPath: '/projects',
  })

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    getPublishedProjects()
      .then((data) => {
        if (!cancelled) setProjects(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load projects. Please refresh and try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [projects])

  const filtered = useMemo(() => {
    let list = projects
    if (category !== 'All') list = list.filter((p) => p.category === category)
    if (query.trim()) {
      const rx = new RegExp(escapeRegExp(query.trim()), 'i')
      list = list.filter(
        (p) =>
          rx.test(p.title) ||
          rx.test(p.short_description || '') ||
          (p.technologies || []).some((t) => rx.test(t))
      )
    }
    return list
  }, [projects, category, query])

  const featured = filtered.filter((p) => p.is_featured)
  const rest = filtered.filter((p) => !p.is_featured)

  return (
    <section className="section">
      <div className="container">
        <h1 className="sr-only">Projects — Muhammad Walid</h1>
        <SectionHeading
          label="Projects"
          title="Work I'm proud of"
          description="Real projects, built end-to-end — from idea to deployed product."
        />

        {!isSupabaseConfigured ? (
          <SetupNotice />
        ) : loading ? (
          <div className="projects-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 300, borderRadius: 14 }} />
            ))}
          </div>
        ) : error ? (
          <div className="state-block">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="state-block">
            <i className="pi pi-folder-open" aria-hidden="true" />
            <h3>No projects published yet</h3>
            <p>Projects will appear here as soon as they are published from the dashboard.</p>
          </div>
        ) : (
          <>
            <div className="projects-toolbar">
              <div className="filter-chips" role="group" aria-label="Filter projects by category">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`filter-chip ${category === c ? 'active' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="search-box">
                <i className="pi pi-search" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search projects…"
                  aria-label="Search projects"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="state-block">
                <i className="pi pi-search" aria-hidden="true" />
                <h3>Nothing matches</h3>
                <p>No projects match this filter. Try another category or clear the search.</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setCategory('All')
                    setQuery('')
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {featured.length > 0 ? (
                  <div className="projects-grid mb-4">
                    {featured.map((p) => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </div>
                ) : null}
                {rest.length > 0 ? (
                  <div className="projects-grid">
                    {rest.map((p) => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
