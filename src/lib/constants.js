/**
 * Shared constants for the app.
 */

export const STORAGE_BUCKET = 'portfolio-media'

export const SKILL_CATEGORIES = [
  'Frontend',
  'Backend',
  'Databases',
  'Tools',
  'Design & Workflow',
]

export const PROJECT_CATEGORIES = [
  'Web App',
  'Website',
  'E-commerce',
  'Dashboard',
  'UI Design',
  'Other',
]

export const TIMELINE_KINDS = [
  { value: 'experience', label: 'Experience' },
  { value: 'education', label: 'Education' },
  { value: 'milestone', label: 'Milestone' },
]

/** PrimeIcons class for a PrimeIcon name (already includes "pi pi-"). */
export const pi = (name) => `pi pi-${name}`

/** Which PrimeIcon to render for each skill/service category. */
export const CATEGORY_ICONS = {
  Frontend: 'pi-desktop',
  Backend: 'pi-server',
  Databases: 'pi-database',
  Tools: 'pi-cog',
  'Design & Workflow': 'pi-palette',
  'Web App': 'pi-desktop',
  Website: 'pi-globe',
  'E-commerce': 'pi-shopping-cart',
  Dashboard: 'pi-th-large',
  'UI Design': 'pi-palette',
  Other: 'pi-folder',
}
