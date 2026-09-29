import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useReveal } from '../../hooks/useReveal'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import {
  getPublishedProjects,
  getVisibleSkills,
  getVisibleServices,
  getVisibleTeamMembers,
} from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import SectionHeading from '../../components/portfolio/SectionHeading'
import HeroSection from '../../components/portfolio/HeroSection'
import ProjectCard from '../../components/portfolio/ProjectCard'
import ServiceCard from '../../components/portfolio/ServiceCard'
import SkillsGrid from '../../components/portfolio/SkillsGrid'
import AboutSection from '../../components/portfolio/AboutSection'
import ContactSection from '../../components/portfolio/ContactSection'
import TeamMemberCard from '../../components/portfolio/TeamMemberCard'
import './HomePage.css'

// Order in which home sections render (between the hero and the contact
// section). Editable from the admin dashboard (Site Settings →
// "Home section order") as a comma list of these keys.
const SECTION_KEYS = ['about', 'skills', 'projects', 'services', 'team']

function parseSectionOrder(value) {
  const list = String(value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => SECTION_KEYS.includes(s))
  // de-duplicate while keeping first occurrence, then append anything missing
  const seen = new Set()
  const unique = list.filter((s) => (seen.has(s) ? false : (seen.add(s), true)))
  return [...unique, ...SECTION_KEYS.filter((s) => !seen.has(s))]
}

export default function HomePage() {
  const { settings } = useSiteSettings()
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useDocumentMeta({
    title: settings.site_title,
    description: settings.meta_description,
    canonicalPath: '/',
  })

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    Promise.all([getPublishedProjects(), getVisibleSkills(), getVisibleTeamMembers()])
      .then(([projectsData, skillsData, teamData]) => {
        if (cancelled) return
        setProjects(projectsData)
        setSkills(skillsData)
        setTeam(teamData)
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the database. Please try again later.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const featured = projects.filter((p) => p.is_featured).slice(0, 3)
  const gridProjects = projects.filter((p) => !p.is_featured).slice(0, 6)

  const sections = {
    about: <AboutHomeSection key="about" settings={settings} />,
    skills: <SkillsHomeSection key="skills" skills={skills} loading={loading} />,
    projects: (
      <ProjectsHomeSection
        key="projects"
        projects={projects}
        featured={featured}
        gridProjects={gridProjects}
        loading={loading}
        error={error}
      />
    ),
    services: <ServicesTeaser key="services" />,
    team: <TeamHomeSection key="team" team={team} loading={loading} />,
  }

  const orderedKeys = parseSectionOrder(settings.home_section_order)

  return (
    <>
      <HeroSection settings={settings} />
      {orderedKeys.map((key) => sections[key])}
      <ContactSection />
    </>
  )
}

/* ---------------- Home sections (order managed by admin) ---------------- */

function AboutHomeSection({ settings }) {
  return (
    <section className="section" id="home-about">
      <div className="container">
        <AboutSection settings={settings} compact />
      </div>
    </section>
  )
}

function SkillsHomeSection({ skills, loading }) {
  if (!loading && skills.length === 0) return null
  return (
    <section className="section section-alt" id="home-skills">
      <div className="container">
        <SectionHeading
          label="Skills"
          title="Tools I work with"
          description="Technologies and workflows I use to bring ideas to life."
        />
        {loading ? (
          <div className="skills-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 14 }} />
            ))}
          </div>
        ) : (
          <SkillsGrid skills={skills} />
        )}
      </div>
    </section>
  )
}

function ProjectsHomeSection({ projects, featured, gridProjects, loading, error }) {
  return (
    <section className="section" id="home-projects">
      <div className="container">
        <SectionHeading
          label="Projects"
          title="Selected work"
          description="A look at what I've been building."
          action={
            <Link to="/projects" className="btn btn-outline btn-sm">
              View all projects <i className="pi pi-arrow-right" aria-hidden="true" />
            </Link>
          }
        />

        {loading ? (
          <div className="projects-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 260, borderRadius: 14 }} />
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
            <h3>Projects coming soon</h3>
            <p>New work is being prepared. Check back shortly — or add projects from the dashboard.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 ? (
              <div className="projects-grid mb-4">
                {featured.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : null}
            {gridProjects.length > 0 ? (
              <div className="projects-grid">
                {gridProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

function ServicesTeaser() {
  const [services, setServices] = useState([])
  const [revealRef, visible] = useReveal()

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) return undefined
    getVisibleServices()
      .then((data) => {
        if (!cancelled) setServices(data.slice(0, 3))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (services.length === 0) return null

  return (
    <section className="section section-alt" id="home-services">
      <div className="container">
        <SectionHeading
          label="Services"
          title="How I can help"
          description="Focused services for businesses and individuals who need a web presence done right."
        />
        <div ref={revealRef} className={`services-grid reveal ${visible ? 'visible' : ''}`}>
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        <div className="center mt-5">
          <Link to="/services" className="btn btn-outline">
            All services <i className="pi pi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function TeamHomeSection({ team, loading }) {
  if (!loading && team.length === 0) return null
  return (
    <section className="section" id="home-team">
      <div className="container">
        <SectionHeading
          label="The Team"
          title="People I build with"
          description="Trusted collaborators who work with me to ship bigger projects."
        />
        <div className="projects-grid">
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: 340, borderRadius: 14 }} />
              ))
            : team.map((member) => <TeamMemberCard key={member.id} member={member} />)}
        </div>
      </div>
    </section>
  )
}
