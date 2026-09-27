import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { STORAGE_BUCKET } from '../lib/constants'

/**
 * Data access layer — every Supabase query used by the app lives here.
 * Public pages call the get* functions; admin pages call the CRUD functions.
 */

/** Thrown when env vars are missing — pages render a setup notice instead. */
export class SetupRequiredError extends Error {
  constructor() {
    super('SUPABASE_NOT_CONFIGURED')
    this.name = 'SetupRequiredError'
  }
}

function client() {
  if (!isSupabaseConfigured) throw new SetupRequiredError()
  return supabase
}

function mapError(error) {
  if (error) {
    const err = new Error(error.message || 'Database request failed')
    err.code = error.code
    throw err
  }
}

/* ------------------------------------------------------------------
 * SITE SETTINGS (single row, id = 1)
 * ------------------------------------------------------------------ */
export async function getSiteSettings() {
  try {
    const { data, error } = await client().from('site_settings').select('*').eq('id', 1)
    mapError(error)
    return data?.[0] || null
  } catch (err) {
    if (err instanceof SetupRequiredError) return null
    // Not readable yet (e.g. seed not run) — degrade gracefully, never crash.
    console.warn('site_settings not readable yet:', err.message)
    return null
  }
}

export async function updateSiteSettings(patch) {
  const { data, error } = await client()
    .from('site_settings')
    .update(patch)
    .eq('id', 1)
    .select()
    .single()
  mapError(error)
  return data
}

/* ------------------------------------------------------------------
 * PROJECTS
 * ------------------------------------------------------------------ */
export async function getPublishedProjects() {
  const { data, error } = await client()
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  mapError(error)
  return data || []
}

export async function getAllProjects() {
  const { data, error } = await client()
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  mapError(error)
  return data || []
}

export async function createProject(values) {
  const { data, error } = await client().from('projects').insert(values).select().single()
  mapError(error)
  return data
}

export async function updateProject(id, patch) {
  const { data, error } = await client()
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  mapError(error)
  return data
}

export async function deleteProject(id) {
  const { error } = await client().from('projects').delete().eq('id', id)
  mapError(error)
  return true
}

/* ------------------------------------------------------------------
 * SKILLS
 * ------------------------------------------------------------------ */
export async function getVisibleSkills() {
  const { data, error } = await client()
    .from('skills')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order')
  mapError(error)
  return data || []
}

export async function getAllSkills() {
  const { data, error } = await client()
    .from('skills')
    .select('*')
    .order('category')
    .order('sort_order')
  mapError(error)
  return data || []
}

export async function createSkill(values) {
  const { data, error } = await client().from('skills').insert(values).select().single()
  mapError(error)
  return data
}

export async function updateSkill(id, patch) {
  const { data, error } = await client().from('skills').update(patch).eq('id', id).select().single()
  mapError(error)
  return data
}

export async function deleteSkill(id) {
  const { error } = await client().from('skills').delete().eq('id', id)
  mapError(error)
  return true
}

/* ------------------------------------------------------------------
 * SERVICES
 * ------------------------------------------------------------------ */
export async function getVisibleServices() {
  const { data, error } = await client()
    .from('services')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order')
  mapError(error)
  return data || []
}

export async function getAllServices() {
  const { data, error } = await client()
    .from('services')
    .select('*')
    .order('sort_order')
  mapError(error)
  return data || []
}

export async function createService(values) {
  const { data, error } = await client().from('services').insert(values).select().single()
  mapError(error)
  return data
}

export async function updateService(id, patch) {
  const { data, error } = await client()
    .from('services')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  mapError(error)
  return data
}

export async function deleteService(id) {
  const { error } = await client().from('services').delete().eq('id', id)
  mapError(error)
  return true
}

/* ------------------------------------------------------------------
 * TIMELINE (experience / education / milestones)
 * ------------------------------------------------------------------ */
export async function getVisibleTimeline(kind) {
  let query = client().from('timeline_items').select('*').eq('is_visible', true)
  if (kind) query = query.eq('kind', kind)
  const { data, error } = await query.order('sort_order')
  mapError(error)
  return data || []
}

export async function getAllTimeline() {
  const { data, error } = await client()
    .from('timeline_items')
    .select('*')
    .order('kind')
    .order('sort_order')
  mapError(error)
  return data || []
}

export async function createTimelineItem(values) {
  const { data, error } = await client()
    .from('timeline_items')
    .insert(values)
    .select()
    .single()
  mapError(error)
  return data
}

export async function updateTimelineItem(id, patch) {
  const { data, error } = await client()
    .from('timeline_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  mapError(error)
  return data
}

export async function deleteTimelineItem(id) {
  const { error } = await client().from('timeline_items').delete().eq('id', id)
  mapError(error)
  return true
}

/* ------------------------------------------------------------------
 * TEAM MEMBERS (contributors)
 * ------------------------------------------------------------------ */
export async function getVisibleTeamMembers() {
  const { data, error } = await client()
    .from('team_members')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order')
  mapError(error)
  return data || []
}

export async function getAllTeamMembers() {
  const { data, error } = await client()
    .from('team_members')
    .select('*')
    .order('sort_order')
  mapError(error)
  return data || []
}

export async function createTeamMember(values) {
  const { data, error } = await client().from('team_members').insert(values).select().single()
  mapError(error)
  return data
}

export async function updateTeamMember(id, patch) {
  const { data, error } = await client()
    .from('team_members')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  mapError(error)
  return data
}

export async function deleteTeamMember(id) {
  const { error } = await client().from('team_members').delete().eq('id', id)
  mapError(error)
  return true
}

/* ------------------------------------------------------------------
 * CONTACT MESSAGES (admin)
 * ------------------------------------------------------------------ */
export async function getContactMessages() {
  const { data, error } = await client()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
  mapError(error)
  return data || []
}

export async function setMessageRead(id, isRead) {
  const { data, error } = await client()
    .from('contact_messages')
    .update({ is_read: isRead })
    .eq('id', id)
    .select()
    .single()
  mapError(error)
  return data
}

export async function deleteMessage(id) {
  const { error } = await client().from('contact_messages').delete().eq('id', id)
  mapError(error)
  return true
}

/* ------------------------------------------------------------------
 * SUBMIT CONTACT MESSAGE (public — insert only, RLS enforced)
 * ------------------------------------------------------------------ */
export async function submitContactMessage(values) {
  const { data, error } = await client()
    .from('contact_messages')
    .insert({
      name: String(values.name || '').trim().slice(0, 120),
      email: String(values.email || '').trim().slice(0, 200),
      subject: String(values.subject || '').trim().slice(0, 200),
      message: String(values.message || '').trim().slice(0, 5000),
    })
    .select()
    .single()
  mapError(error)
  return data
}

/* ------------------------------------------------------------------
 * STORAGE (bucket: portfolio-media)
 * ------------------------------------------------------------------ */
export async function uploadMedia(file, folder = 'misc') {
  const c = client()
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const safeBase = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'file'
  const path = `${folder}/${Date.now()}-${safeBase}.${ext}`
  const { error } = await c.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  mapError(error)
  const { data } = c.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteMediaByUrl(url) {
  if (!url) return
  const marker = '/storage/v1/object/public/portfolio-media/'
  const idx = url.indexOf(marker)
  if (idx === -1) return
  try {
    const path = url.slice(idx + marker.length).split('?')[0]
    await client().storage.from(STORAGE_BUCKET).remove([path])
  } catch {
    // Best-effort cleanup — never block a save because an old image delete failed.
  }
}

/* ------------------------------------------------------------------
 * DASHBOARD STATS
 * ------------------------------------------------------------------ */
export async function getDashboardStats() {
  const c = client()
  const [projectsRes, messagesRes, skillsRes, servicesRes, timelineRes] = await Promise.all([
    c.from('projects').select('id,is_published,is_featured'),
    c.from('contact_messages').select('id,is_read'),
    c.from('skills').select('id,is_visible'),
    c.from('services').select('id,is_visible'),
    c.from('timeline_items').select('id,is_visible,kind'),
  ])

  const results = [projectsRes, messagesRes, skillsRes, servicesRes, timelineRes]
  const firstError = results.find((r) => r.error)
  if (firstError) mapError(firstError.error)

  const projects = projectsRes.data || []
  const messages = messagesRes.data || []
  const skills = skillsRes.data || []
  const services = servicesRes.data || []
  const timeline = timelineRes.data || []

  return {
    projectsTotal: projects.length,
    projectsPublished: projects.filter((p) => p.is_published).length,
    projectsDraft: projects.filter((p) => !p.is_published).length,
    projectsFeatured: projects.filter((p) => p.is_featured).length,
    messagesUnread: messages.filter((m) => !m.is_read).length,
    messagesTotal: messages.length,
    skillsTotal: skills.length,
    skillsVisible: skills.filter((s) => s.is_visible).length,
    servicesTotal: services.length,
    servicesVisible: services.filter((s) => s.is_visible).length,
    timelineTotal: timeline.length,
  }
}
