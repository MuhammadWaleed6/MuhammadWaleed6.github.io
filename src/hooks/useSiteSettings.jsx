import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { getSiteSettings } from '../services/contentService'

/**
 * Site settings context — one fetch shared by the whole public site and admin.
 * Falls back to safe built-in defaults when Supabase isn't configured yet or
 * the settings row isn't readable, so the site always renders.
 */

export const DEFAULT_SETTINGS = {
  site_title: 'Muhammad Walid — Web Developer',
  meta_description:
    'Muhammad Walid — Web Developer. I build thoughtful digital experiences and modern web applications.',
  display_name: 'Muhammad Walid',
  professional_title: 'Web Developer / Full-Stack Developer',
  hero_label: 'WEB DEVELOPER • DIGITAL BUILDER',
  hero_heading: "Hi, I'm Muhammad Walid.",
  hero_subheading: 'I build thoughtful digital experiences and modern web applications.',
  hero_description:
    "I'm a web developer with a background in business and information technology. I enjoy turning ideas into useful, clean, and engaging digital products.",
  about_text:
    "I'm Muhammad Walid, a web developer and BBIT (Bachelor in Business & Information Technology) student with four years of hands-on web development experience. I care about building products that are genuinely useful — clean, fast, and considerate of the people who use them.",
  profile_image_url: '',
  availability_text: 'Available for new projects',
  availability_is_open: true,
  contact_email: '',
  github_url: '',
  linkedin_url: '',
  twitter_url: '',
  other_social_url: '',
  resume_url: '',
  footer_text: 'Designed and built with care.',
}

const SiteSettingsContext = createContext(null)

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [fromDatabase, setFromDatabase] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSiteSettings()
      if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data })
        setFromDatabase(true)
      } else {
        setFromDatabase(false)
      }
    } catch {
      setFromDatabase(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ settings, loading, fromDatabase, refresh, setSettings }),
    [settings, loading, fromDatabase, refresh]
  )

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) throw new Error('useSiteSettings must be used inside <SiteSettingsProvider>')
  return ctx
}
