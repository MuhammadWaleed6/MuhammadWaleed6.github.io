import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import ContactSection from '../../components/portfolio/ContactSection'

export default function ContactPage() {
  const { settings } = useSiteSettings()
  useDocumentMeta({
    title: `Contact — ${settings.display_name}`,
    description:
      'Get in touch with Muhammad Walid — send a message about your project, question or idea, and expect a reply within a day or two.',
    canonicalPath: '/contact',
  })

  return (
    <div className="contact-page">
      <h1 className="sr-only">Contact — Muhammad Walid</h1>
      <ContactSection />
    </div>
  )
}
