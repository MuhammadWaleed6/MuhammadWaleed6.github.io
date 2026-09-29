import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageLoading from '../components/common/PageLoading'

/**
 * Route guard for the admin area. Two checks:
 *   1. A valid Supabase session exists.
 *   2. The signed-in email is in the admin_users allowlist (isAdmin).
 * Only allowlisted admins get through — being merely authenticated is not enough.
 */
export default function ProtectedAdminRoute() {
  const { session, loading, isAdmin, adminChecked } = useAuth()
  const location = useLocation()

  if (loading || (session && !adminChecked)) {
    return <PageLoading label="Checking your session…" />
  }

  if (!session) {
    return <Navigate to={`${__ADMIN_BASE__}/login`} state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="notfound">
        <div>
          <div className="code" aria-hidden="true">
            <i className="pi pi-lock" style={{ fontSize: 42, color: 'var(--red)' }} />
          </div>
          <h1>Access denied</h1>
          <p>
            This account is not authorized to manage the site. Ask the site owner to add
            your email to the admin list.
          </p>
          <button type="button" className="btn btn-outline" onClick={() => window.history.back()}>
            Go back
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
