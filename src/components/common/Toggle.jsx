/**
 * Accessible toggle switch (label wraps the input, so it's keyboard friendly).
 */
export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="track" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </label>
  )
}
