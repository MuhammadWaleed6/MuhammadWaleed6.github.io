import { useEffect, useState } from 'react'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getVisibleTeamMembers } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import SectionHeading from '../../components/portfolio/SectionHeading'
import TeamMemberCard from '../../components/portfolio/TeamMemberCard'

export default function TeamPage() {
  const { settings } = useSiteSettings()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useDocumentMeta(`Team — ${settings.display_name}`, settings.meta_description)

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    getVisibleTeamMembers()
      .then((data) => {
        if (!cancelled) setMembers(data)
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
        <SectionHeading
          label="The Team"
          title="People I build with"
          description="Trusted collaborators who work with me to ship bigger projects. Click a profile to see their skills, achievements and projects."
        />

        {loading ? (
          <div className="projects-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 340, borderRadius: 14 }} />
            ))}
          </div>
        ) : error ? (
          <div className="state-block">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
            <h3>Could not load the team</h3>
            <p>Please refresh and try again.</p>
          </div>
        ) : members.length === 0 ? (
          <div className="state-block">
            <i className="pi pi-users" aria-hidden="true" />
            <h3>Team coming soon</h3>
            <p>Collaborator profiles will appear here once added from the dashboard.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
