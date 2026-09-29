import { useEffect, useRef, useState } from 'react'
import { Toast } from 'primereact/toast'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { updateSiteSettings } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import ImageUploader from '../../components/common/ImageUploader'
import Toggle from '../../components/common/Toggle'
import SetupNotice from '../../components/common/SetupNotice'
import { PageHeader } from './DashboardPage'

const TEXT_FIELDS = [
  { key: 'display_name', label: 'Display name' },
  { key: 'professional_title', label: 'Professional title' },
  { key: 'hero_label', label: 'Hero label (small text above heading)' },
  { key: 'hero_heading', label: 'Hero heading', hint: 'Use {name} to highlight your name in red.' },
  { key: 'hero_subheading', label: 'Hero supporting headline' },
  { key: 'availability_text', label: 'Availability text' },
]

export default function ProfileAdminPage() {
  useDocumentMeta({ title: 'Profile — Admin', noindex: true })
  const toast = useRef(null)
  const { settings, refresh } = useSiteSettings()
  const [form, setForm] = useState(settings)
  const [aboutText, setAboutText] = useState(settings.about_text || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(settings)
    setAboutText(settings.about_text || '')
  }, [settings])

  async function onSave(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) return
    setSaving(true)
    try {
      await updateSiteSettings({ ...form, about_text: aboutText })
      await refresh()
      toast.current?.show({ severity: 'success', summary: 'Profile saved', life: 2500 })
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Save failed',
        detail: err.message || 'Check that the site_settings row exists (run schema.sql).',
        life: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Profile" />
        <SetupNotice />
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast ref={toast} position="top-right" />
      <PageHeader
        title="Profile"
        crumbs={['Site']}
        actions={
          <button type="submit" form="profile-form" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : <i className="pi pi-check" aria-hidden="true" />}
            Save changes
          </button>
        }
      />

      <form id="profile-form" onSubmit={onSave}>
        <div className="editor-grid">
          <div className="admin-panel">
            <div className="panel-head"><h2>Identity & hero</h2></div>
            <div className="panel-body">
              {TEXT_FIELDS.map((f) => (
                <div className="field" key={f.key}>
                  <label htmlFor={`pf-${f.key}`}>{f.label}</label>
                  <input
                    id={`pf-${f.key}`}
                    type="text"
                    value={form[f.key] || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                  {f.hint ? <span className="hint">{f.hint}</span> : null}
                </div>
              ))}

              <div className="field">
                <label htmlFor="pf-hero-desc">Hero description</label>
                <textarea
                  id="pf-hero-desc"
                  rows={3}
                  value={form.hero_description || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, hero_description: e.target.value }))}
                />
              </div>

              <div className="field">
                <label htmlFor="pf-about">About text</label>
                <textarea
                  id="pf-about"
                  rows={7}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                />
                <span className="hint">Separate paragraphs with a blank line.</span>
              </div>
            </div>
          </div>

          <div className="editor-side">
            <div className="admin-panel">
              <div className="panel-head"><h2>Profile image</h2></div>
              <div className="panel-body">
                <ImageUploader
                  label="Profile photo"
                  value={form.profile_image_url || ''}
                  folder="profile"
                  onChange={(url) => setForm((prev) => ({ ...prev, profile_image_url: url }))}
                />
              </div>
            </div>

            <div className="admin-panel">
              <div className="panel-head"><h2>Availability</h2></div>
              <div className="panel-body">
                <div className="mb-4">
                  <Toggle
                    checked={form.availability_is_open}
                    onChange={(v) => setForm((prev) => ({ ...prev, availability_is_open: v }))}
                    label="Showing as available"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="pf-avail">Availability label</label>
                  <input
                    id="pf-avail"
                    type="text"
                    value={form.availability_text || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, availability_text: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
