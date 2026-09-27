export default function SectionHeading({ label, title, description, action, center = false }) {
  return (
    <div className={`section-head ${center ? 'center' : ''} ${action ? 'with-action' : ''}`}>
      <div className="section-head-text">
        {label ? <span className="section-label">{label}</span> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-desc">{description}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  )
}
