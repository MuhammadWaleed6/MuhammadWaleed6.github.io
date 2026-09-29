import { useEffect, useState } from 'react'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getVisibleServices } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import SectionHeading from '../../components/portfolio/SectionHeading'
import ServiceCard from '../../components/portfolio/ServiceCard'
import SetupNotice from '../../components/common/SetupNotice'

export default function ServicesPage() {
  const { settings } = useSiteSettings()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useDocumentMeta({
    title: `Services — ${settings.display_name}`,
    description:
      'Web development services by Muhammad Walid — from a first website to modern web applications, with focused, practical delivery.',
    canonicalPath: '/services',
  })

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    getVisibleServices()
      .then((data) => {
        if (!cancelled) setServices(data)
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
        <h1 className="sr-only">Services — Muhammad Walid</h1>
        <SectionHeading
          label="Services"
          title="What I can do for you"
          description="Focused, practical services — from a first website to ongoing improvements."
        />

        {!isSupabaseConfigured ? (
          <SetupNotice />
        ) : loading ? (
          <div className="services-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 14 }} />
            ))}
          </div>
        ) : error ? (
          <div className="state-block">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
            <h3>Could not load services</h3>
            <p>Please refresh and try again.</p>
          </div>
        ) : services.length === 0 ? (
          <div className="state-block">
            <i className="pi pi-briefcase" aria-hidden="true" />
            <h3>Services coming soon</h3>
            <p>Services will appear here once they are added from the dashboard.</p>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
