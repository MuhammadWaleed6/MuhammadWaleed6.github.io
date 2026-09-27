import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import ContactSection from '../../components/portfolio/ContactSection'

export default function ContactPage() {
  const { settings } = useSiteSettings()
  useDocumentMeta(`Contact — ${settings.display_name}`, settings.meta_description)

  return (
    <div className="contact-page">
      <ContactSection />
    </div>
  )
}
