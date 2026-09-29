import { useEffect, useState } from 'react'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getVisibleSkills } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import SectionHeading from '../../components/portfolio/SectionHeading'
import SkillsGrid from '../../components/portfolio/SkillsGrid'
import SetupNotice from '../../components/common/SetupNotice'

export default function SkillsPage() {
  const { settings } = useSiteSettings()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useDocumentMeta({
    title: `Skills — ${settings.display_name}`,
    description:
      'The technologies and tools Muhammad Walid works with — including HTML, CSS, JavaScript, React and Node.js — for building modern websites and web applications.',
    canonicalPath: '/skills',
  })

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    getVisibleSkills()
      .then((data) => {
        if (!cancelled) setSkills(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="section">
      <div className="container">
        <h1 className="sr-only">Skills — Muhammad Walid</h1>
        <SectionHeading
          label="Skills"
          title="Technologies & tools"
          description="The stack I reach for when building websites and applications."
        />

        {!isSupabaseConfigured ? (
          <SetupNotice />
        ) : loading ? (
          <div className="skills-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 14 }} />
            ))}
          </div>
        ) : error ? (
          <div className="state-block">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
            <h3>Could not load skills</h3>
            <p>Please refresh the page and try again.</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="state-block">
            <i className="pi pi-tags" aria-hidden="true" />
            <h3>Skills coming soon</h3>
            <p>Skills will appear here once they are added from the dashboard.</p>
          </div>
        ) : (
          <SkillsGrid skills={skills} />
        )}
      </div>
    </section>
  )
}
