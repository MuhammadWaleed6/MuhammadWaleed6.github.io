import './SetupNotice.css'

/**
 * Shown instead of live data when the Supabase environment variables
 * haven't been added yet. Keeps the site from crashing in setup mode.
 */
export default function SetupNotice({ title = 'Database not connected yet', compact = false }) {
  return (
    <div className={`setup-notice ${compact ? 'compact' : ''}`} role="status">
      <i className="pi pi-database" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>
          This section loads live content from Supabase. Add{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your{' '}
          <code>.env</code> file, then run the SQL from <code>supabase/schema.sql</code>.
        </p>
      </div>
    </div>
  )
}
