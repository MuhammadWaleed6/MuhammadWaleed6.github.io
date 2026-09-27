export default function EmptyState({ icon = 'pi-inbox', title, message, action }) {
  return (
    <div className="state-block">
      <i className={`pi ${icon}`} aria-hidden="true" />
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action || null}
    </div>
  )
}
