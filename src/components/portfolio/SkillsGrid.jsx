import { CATEGORY_ICONS } from '../../lib/constants'
import { useReveal } from '../../hooks/useReveal'

/**
 * Groups skills by category and renders one card per category.
 * Proficiency label (optional) is shown as a subtle suffix — never as a fake
 * percentage bar, unless the admin explicitly set a label.
 */
export default function SkillsGrid({ skills }) {
  const [ref, visible] = useReveal()
  const categories = Array.from(new Set(skills.map((s) => s.category)))

  if (skills.length === 0) return null

  return (
    <div ref={ref} className={`skills-grid reveal ${visible ? 'visible' : ''}`}>
      {categories.map((category) => {
        const items = skills.filter((s) => s.category === category)
        return (
          <div key={category} className="skill-card">
            <div className="cat-head">
              <span className="cat-icon" aria-hidden="true">
                <i className={`pi ${CATEGORY_ICONS[category] || 'pi-tag'}`} />
              </span>
              <h3>{category}</h3>
            </div>
            <ul>
              {items.map((skill) => (
                <li key={skill.id}>
                  <span className="skill-pill" title={skill.proficiency_label || undefined}>
                    {skill.icon ? <i className={`pi ${skill.icon}`} aria-hidden="true" /> : null}
                    {skill.name}
                    {skill.proficiency_label ? <em className="prof">{skill.proficiency_label}</em> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
