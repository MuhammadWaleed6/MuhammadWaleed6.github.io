import { useState } from 'react'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { submitContactMessage } from '../../services/contentService'
import { isValidEmail } from '../../lib/utils'
import './ContactSection.css'

const HONEYPOT_NAME = 'company_website'

export default function ContactSection() {
  const { settings } = useSiteSettings()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [honey, setHoney] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [serverError, setServerError] = useState('')

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate() {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Please enter your name.'
    if (!isValidEmail(form.email.trim())) next.email = 'Please enter a valid email address.'
    if (form.subject.trim().length < 3) next.subject = 'Please add a short subject.'
    if (form.message.trim().length < 10) next.message = 'Please write at least 10 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')

    // Honeypot: bots fill hidden fields; humans never see them.
    if (honey) {
      setStatus('success')
      return
    }

    if (!validate()) return

    setStatus('sending')
    try {
      await submitContactMessage(form)
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setServerError(
        err.message?.includes('Too many messages')
          ? 'You are sending messages too quickly. Please try again in a few minutes.'
          : 'Could not send your message right now. Please try again shortly.'
      )
      setStatus('error')
    }
  }

  const socials = [
    { url: settings.github_url, icon: 'pi-github', label: 'GitHub' },
    { url: settings.linkedin_url, icon: 'pi-linkedin', label: 'LinkedIn' },
    { url: settings.twitter_url, icon: 'pi-twitter', label: 'Twitter / X' },
    { url: settings.other_social_url, icon: 'pi-globe', label: 'Website' },
  ].filter((s) => s.url)

  return (
    <section className="section section-alt" id="contact">
      <div className="container contact-grid">
        <div className="contact-info">
          <span className="section-label">Contact</span>
          <h2>Let's build something together.</h2>
          <p>
            Have a project in mind, a question, or just want to say hello? Send a message —
            I usually reply within a day or two.
          </p>

          <div className="contact-lines">
            {settings.contact_email ? (
              <div className="c-line">
                <i className="pi pi-envelope" aria-hidden="true" />
                <a href={`mailto:${settings.contact_email}`}>
                  {settings.contact_email}
                  <span className="sub">Email</span>
                </a>
              </div>
            ) : null}
            <div className="c-line">
              <i className="pi pi-map-marker" aria-hidden="true" />
              <span>
                Working remotely
                <span className="sub">Available worldwide</span>
              </span>
            </div>
          </div>

          {socials.length > 0 ? (
            <div className="social-row" aria-label="Social links">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
                  <i className={`pi ${s.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="contact-form-card">
          {status === 'success' ? (
            <div className="form-banner success" role="status">
              <i className="pi pi-check-circle" aria-hidden="true" />
              <span>Message sent successfully. Thank you — I'll get back to you soon!</span>
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="form-banner error" role="alert">
              <i className="pi pi-exclamation-triangle" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} noValidate>
            {/* Honeypot field — hidden from humans, catches bots */}
            <div className="hp-field" aria-hidden="true">
              <label>
                Company website
                <input
                  type="text"
                  name={HONEYPOT_NAME}
                  tabIndex={-1}
                  autoComplete="off"
                  value={honey}
                  onChange={(e) => setHoney(e.target.value)}
                />
              </label>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="cf-name">Name</label>
                <input id="cf-name" type="text" value={form.name} onChange={update('name')} required autoComplete="name" />
                {errors.name ? <span className="error">{errors.name}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="cf-email">Email</label>
                <input id="cf-email" type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
                {errors.email ? <span className="error">{errors.email}</span> : null}
              </div>
            </div>

            <div className="field">
              <label htmlFor="cf-subject">Subject</label>
              <input id="cf-subject" type="text" value={form.subject} onChange={update('subject')} required />
              {errors.subject ? <span className="error">{errors.subject}</span> : null}
            </div>

            <div className="field">
              <label htmlFor="cf-message">Message</label>
              <textarea id="cf-message" rows={6} value={form.message} onChange={update('message')} required />
              {errors.message ? <span className="error">{errors.message}</span> : null}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
              {status === 'sending' ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Sending…
                </>
              ) : (
                <>
                  Send Message <i className="pi pi-send" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
