import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { initialsOf } from '../../lib/utils'

import './TeamMemberDetailPage.css'

export default function TeamMemberDetailPage() {
  const { slug } = useParams()
  const { settings } = useSiteSettings()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useDocumentMeta({
    title: loading ? 'Loading…' : member ? `${member.name} — Team` : 'Member not found',
    description: member?.bio?.slice(0, 150) || settings.meta_description,
    canonicalPath: `/team/${slug}`,
    image: member?.photo_url || undefined,
    noindex: !member,
  })

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
      .from('team_members')
      .select('*')
      .eq('slug', slug)
      .eq('is_visible', true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError('Could not load this profile. Please try again.')
        else if (!data) setNotFound(true)
        else setMember(data)
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
          <div className="skeleton" style={{ height: 360, borderRadius: 14 }} />
        </div>
      </section>
    )
  }

  if (error || notFound || !member) {
    return (
      <section className="section">
        <div className="container">
          <div className="state-block">
            <i className="pi pi-users" aria-hidden="true" />
            <h3>{notFound ? 'Profile not found' : 'Something went wrong'}</h3>
            <p>{notFound ? "This team member doesn't exist or isn't published." : error}</p>
            <Link to="/" className="btn btn-primary btn-sm">
              <i className="pi pi-arrow-left" aria-hidden="true" /> Back to home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const skills = Array.isArray(member.skills) ? member.skills : []
  const achievements = Array.isArray(member.achievements) ? member.achievements : []
  const projects = Array.isArray(member.projects) ? member.projects : []

  const socials = [
    { url: member.github_url, icon: 'pi-github', label: 'GitHub' },
    { url: member.linkedin_url, icon: 'pi-linkedin', label: 'LinkedIn' },
    { url: member.twitter_url, icon: 'pi-twitter', label: 'Twitter / X' },
    { url: member.website_url, icon: 'pi-globe', label: 'Website' },
  ].filter((s) => s.url)

  return (
    <>
      <section className="member-hero">
        <div className="container">
          <Link to="/#home-projects" className="back-link">
            <i className="pi pi-arrow-left" aria-hidden="true" /> Back to home
          </Link>

          <div className="member-hero-inner">
          <div className="member-photo">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.name} />
            ) : (
              <span className="member-initials" aria-hidden="true">{initialsOf(member.name)}</span>
            )}
          </div>

          <div className="member-head">
            <span className="chip">{member.role || 'Team Member'}</span>
            <h1>{member.name}</h1>
            {member.bio ? <p className="member-bio-lead">{member.bio}</p> : null}

            {socials.length > 0 ? (
              <div className="social-row">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
                    <i className={`pi ${s.icon}`} aria-hidden="true" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container member-grid">
          <div className="member-main">
            {skills.length > 0 ? (
              <div className="member-block">
                <h2>Skills</h2>
                <div className="tags">
                  {skills.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {achievements.length > 0 ? (
              <div className="member-block">
                <h2>Achievements</h2>
                <ul className="member-list">
                  {achievements.map((a) => (
                    <li key={a}>
                      <i className="pi pi-star-fill" aria-hidden="true" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {projects.length > 0 ? (
              <div className="member-block">
                <h2>Projects worked on</h2>
                <ul className="member-list">
                  {projects.map((p) => (
                    <li key={p}>
                      <i className="pi pi-folder-open" aria-hidden="true" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {skills.length === 0 && achievements.length === 0 && projects.length === 0 ? (
              <div className="state-block">
                <i className="pi pi-info-circle" aria-hidden="true" />
                <h3>Profile coming together</h3>
                <p>Details for this member are being added. Check back soon.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}
