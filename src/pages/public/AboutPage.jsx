import { useEffect, useState } from 'react'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getVisibleTimeline } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import AboutSection from '../../components/portfolio/AboutSection'
import SectionHeading from '../../components/portfolio/SectionHeading'
import SetupNotice from '../../components/common/SetupNotice'

export default function AboutPage() {
  const { settings } = useSiteSettings()
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)

  useDocumentMeta(`About — ${settings.display_name}`, settings.meta_description)

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    getVisibleTimeline()
      .then((data) => {
        if (!cancelled) setTimeline(data)
      })
      .catch(() => {
        if (!cancelled) setDbError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const groups = [
    { kind: 'experience', title: 'Experience' },
    { kind: 'education', title: 'Education' },
    { kind: 'milestone', title: 'Milestones & Learning' },
  ].map((g) => ({ ...g, items: timeline.filter((t) => t.kind === g.kind) }))

  return (
    <>
      <section className="section">
        <div className="container">
          <AboutSection settings={settings} />
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            label="Journey"
            title="Experience & education"
            description="My path so far — studies, work, and the milestones in between."
          />

          {!isSupabaseConfigured ? (
            <SetupNotice title="Timeline loads from Supabase" />
          ) : loading ? (
            <div className="timeline">
              {[0, 1, 2].map((i) => (
                <div key={i} className="timeline-item">
                  <div className="skeleton" style={{ height: 90, borderRadius: 10 }} />
                </div>
              ))}
            </div>
          ) : dbError ? (
            <div className="state-block">
              <i className="pi pi-exclamation-triangle" aria-hidden="true" />
              <h3>Could not load the timeline</h3>
              <p>The database did not respond. Please refresh and try again.</p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="state-block">
              <i className="pi pi-clock" aria-hidden="true" />
              <h3>Timeline coming soon</h3>
              <p>Experience and education entries will appear here once published from the dashboard.</p>
            </div>
          ) : (
            groups
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.kind} className="mb-5">
                  <h3 className="tl-group-title">{group.title}</h3>
                  <div className="timeline">
                    {group.items.map((item) => (
                      <div key={item.id} className="timeline-item">
                        <span className="tl-kind">{group.title}</span>
                        <h3>{item.title}</h3>
                        {item.organization ? <div className="tl-org">{item.organization}</div> : null}
                        {item.start_date || item.end_date || item.is_current ? (
                          <div className="tl-dates">
                            {[item.start_date, item.is_current ? 'Present' : item.end_date]
                              .filter(Boolean)
                              .join(' — ')}
                          </div>
                        ) : null}
                        {item.description ? <p>{item.description}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </section>
    </>
  )
}
