import { Link } from 'react-router-dom'
import { initialsOf } from '../../lib/utils'
import './HeroSection.css'

const DEFAULT_STACK = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js']

export default function HeroSection({ settings }) {
  const initials = initialsOf(settings.display_name) || 'MW'
  const stack = settings.stack && settings.stack.length > 0 ? settings.stack : DEFAULT_STACK
  const hasPhoto = Boolean(settings.profile_image_url)

  return (
    <section className="hero" id="home-hero" aria-labelledby="hero-heading">
      <span className="hero-float hf-1" aria-hidden="true" />
      <span className="hero-float hf-2" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="hero-badges">
            <span className="availability-pill" data-open={settings.availability_is_open}>
              {settings.availability_text}
            </span>

            <p className="hero-label">
              <i className="pi pi-sparkles" aria-hidden="true" /> {settings.hero_label}
            </p>
          </div>

          <h1 id="hero-heading">
            {settings.hero_heading.split(/(\{name\}|\u2014|—)/).map((part, i) =>
              part === '{name}' ? (
                <span key={i} className="accent">
                  {settings.display_name}
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </h1>

          <p className="hero-sub">{settings.hero_subheading}</p>
          <p className="hero-desc">{settings.hero_description}</p>

          <div className="hero-actions">
            <Link to="/projects" className="btn btn-primary btn-lg">
              Explore My Work <i className="pi pi-arrow-right" aria-hidden="true" />
            </Link>
            <Link to="/contact" className="btn btn-outline-light btn-lg">
              Let's Work Together
            </Link>
          </div>

          <div className="hero-stack" aria-label="Main technologies">
            {stack.map((tech) => (
              <span key={tech} className="chip">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-figure">
          <div className="photo-frame">
            {hasPhoto ? (
              <img src={settings.profile_image_url} alt={settings.display_name} />
            ) : (
              <div className="photo-fallback" role="img" aria-label={`${settings.display_name} placeholder portrait`}>
                <span className="initials">{initials}</span>
                <span className="caption">Profile photo placeholder</span>
              </div>
            )}
          </div>
          <p className="figure-caption">{settings.professional_title}</p>
        </div>
      </div>
    </section>
  )
}
