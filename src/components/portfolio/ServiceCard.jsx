import { Link } from 'react-router-dom'
import { CATEGORY_ICONS, pi } from '../../lib/constants'

export default function ServiceCard({ service }) {
  const { title, description, icon, starting_price: startingPrice } = service

  return (
    <article className="service-card">
      <div className="s-icon">
        <i className={pi(icon || CATEGORY_ICONS.Other || 'pi-folder')} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {startingPrice ? <span className="s-price">From {startingPrice}</span> : null}
      <Link to="/contact" className="s-cta">
        Get in touch <i className="pi pi-arrow-right" aria-hidden="true" />
      </Link>
    </article>
  )
}
