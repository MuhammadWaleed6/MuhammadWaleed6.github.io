import { Link } from 'react-router-dom'
import { initialsOf } from '../../lib/utils'
import './TeamMemberCard.css'

export default function TeamMemberCard({ member }) {
  const { name, slug, role, bio, photo_url: photoUrl, skills = [] } = member

  return (
    <article className="team-card">
      <Link to={`/team/${slug}`} className="team-photo" aria-label={`View ${name}'s profile`}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} loading="lazy" />
        ) : (
          <span className="team-initials" aria-hidden="true">{initialsOf(name)}</span>
        )}
      </Link>
      <div className="team-body">
        <h3>
          <Link to={`/team/${slug}`}>{name}</Link>
        </h3>
        <p className="team-role">{role}</p>
        <p className="team-bio">{bio?.slice(0, 110)}{bio?.length > 110 ? '…' : ''}</p>
        {skills.length > 0 ? (
          <div className="tags">
            {skills.slice(0, 4).map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        ) : null}
        <Link to={`/team/${slug}`} className="team-more">
          View profile <i className="pi pi-arrow-right" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
