export default function PageLoading({ label = 'Loading…' }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <div className="spinner spinner-dark" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
