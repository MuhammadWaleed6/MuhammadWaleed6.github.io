import { useEffect, useRef, useState } from 'react'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { updateSiteSettings } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { isValidUrl } from '../../lib/utils'
import SetupNotice from '../../components/common/SetupNotice'
import { PageHeader } from './DashboardPage'

const URL_FIELDS = [
  { key: 'github_url', label: 'GitHub URL', placeholder: 'https://github.com/MuhammadWaleed6' },
  { key: 'linkedin_url', label: 'LinkedIn URL', placeholder: 'https://www.linkedin.com/in/…' },
  { key: 'twitter_url', label: 'Twitter / X URL', placeholder: 'https://x.com/…' },
  { key: 'other_social_url', label: 'Other social / website URL', placeholder: 'https://…' },
  { key: 'resume_url', label: 'Resume link (PDF or page)', placeholder: 'https://…' },
]

export default function SettingsAdminPage() {
  useDocumentMeta({ title: 'Site Settings — Admin', noindex: true })
  const toast = useRef(null)
  const { settings, refresh } = useSiteSettings()
  const [form, setForm] = useState(settings)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  async function onSave(e) {
    e.preventDefault()
    const nextErrors = {}
    URL_FIELDS.forEach(({ key }) => {
      if (form[key] && !isValidUrl(form[key])) nextErrors[key] = 'Enter a valid URL (https://…).'
    })
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setSaving(true)
    try {
      await updateSiteSettings(form)
      await refresh()
      toast.current?.show({ severity: 'success', summary: 'Settings saved', life: 2500 })
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Save failed',
        detail: err.message || 'Check that the site_settings row exists.',
        life: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Site Settings" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader
        title="Site Settings"
        crumbs={['Site']}
        actions={
          <button type="submit" form="settings-form" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
            Save changes
          </button>
        }
      />

      <form id="settings-form" onSubmit={onSave}>
        <div className="editor-grid">
          <div className="admin-panel">
            <div className="panel-head"><h2>General & SEO</h2></div>
            <div className="panel-body">
              <div className="field">
                <label htmlFor="sf-title">Website title</label>
                <input
                  id="sf-title"
                  type="text"
                  value={form.site_title || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, site_title: e.target.value }))}
                />
                <span className="hint">Shown in the browser tab and used as the default page title.</span>
              </div>

              <div className="field">
                <label htmlFor="sf-meta">Meta description</label>
                <textarea
                  id="sf-meta"
                  rows={3}
                  value={form.meta_description || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                />
                <span className="hint">
                  Applied client-side on page load. Note: static-site crawlers that never run
                  JavaScript only see the default metadata from index.html.
                </span>
              </div>

              <div className="field">
                <label htmlFor="sf-email">Public contact email</label>
                <input
                  id="sf-email"
                  type="email"
                  value={form.contact_email || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="hello@mwalid.me"
                />
              </div>

              <div className="field">
                <label htmlFor="sf-phone">Public phone number</label>
                <input
                  id="sf-phone"
                  type="text"
                  value={form.phone_number || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+92 300 1234567"
                />
                <span className="hint">Shown in the contact section and footer as a tap-to-call link.</span>
              </div>

              <div className="field">
                <label htmlFor="sf-footer">Footer text</label>
                <input
                  id="sf-footer"
                  type="text"
                  value={form.footer_text || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, footer_text: e.target.value }))}
                />
              </div>

              <div className="field">
                <label htmlFor="sf-order">Home section order</label>
                <input
                  id="sf-order"
                  type="text"
                  value={form.home_section_order || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, home_section_order: e.target.value }))}
                  placeholder="about,skills,projects,services,team"
                />
                <span className="hint">
                  Order of the home-page sections between the hero and the contact block.
                  Comma-separated keys — any of: about, skills, projects, services, team.
                  Example: <code>projects,about,skills,services,team</code>. Unknown keys are
                  ignored, missing ones are added at the end.
                </span>
              </div>
            </div>
          </div>

          <div className="editor-side">
            <div className="admin-panel">
              <div className="panel-head"><h2>Links</h2></div>
              <div className="panel-body">
                {URL_FIELDS.map(({ key, label, placeholder }) => (
                  <div className="field" key={key}>
                    <label htmlFor={`sf-${key}`}>{label}</label>
                    <input
                      id={`sf-${key}`}
                      type="url"
                      placeholder={placeholder}
                      value={form[key] || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                    {errors[key] ? <span className="error">{errors[key]}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
