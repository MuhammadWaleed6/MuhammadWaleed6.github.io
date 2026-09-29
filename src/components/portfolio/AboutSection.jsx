import { Link } from 'react-router-dom'
import { useReveal } from '../../hooks/useReveal'

/**
 * About section. `compact` renders the lighter home-page variant
 * (shorter text, fewer highlights).
 */
export default function AboutSection({ settings, compact = false }) {
  const [ref, visible] = useReveal()
  const paragraphs = String(settings.about_text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const highlights = [
    { label: 'Experience', value: '3+ years of professional experience' },
    { label: 'Education', value: 'BBIT — Business & Information Technology' },
    { label: 'Focus', value: 'Modern web applications' },
    {
      label: 'Availability',
      value: settings.availability_text,
      open: settings.availability_is_open,
    },
  ]

  return (
    <div ref={ref} className={`about-grid reveal ${visible ? 'visible' : ''}`}>
      <div className="about-text">
        <span className="section-label">About me</span>
        <h2 className="section-title">
          Developer mindset,
          <br />
          business-aware approach.
        </h2>
        {paragraphs.length > 0 ? (
          paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)
        ) : (
          <p>
            I'm Muhammad Walid — a web developer and BBIT student who enjoys turning ideas
            into useful, well-crafted digital products. Add your full story from the admin
            dashboard.
          </p>
        )}
        <Link to="/about" className="btn btn-primary about-more-btn">
          Want to know more about me <i className="pi pi-arrow-right" aria-hidden="true" />
        </Link>
      </div>

      <div className="about-highlights" aria-label="Quick facts">
        {highlights.map((h) => (
          <div key={h.label} className="highlight">
            <div className="h-label">{h.label}</div>
            <div className="h-value">
              {h.open === false ? <i className="pi pi-minus-circle" aria-hidden="true" /> : null}
              {h.value}
            </div>
          </div>
        ))}
        {!compact ? (
          <div className="highlight" style={{ gridColumn: '1 / -1' }}>
            <div className="h-label">Currently</div>
            <div className="h-value">
              Pursuing my BBIT degree while taking on selected web projects.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
