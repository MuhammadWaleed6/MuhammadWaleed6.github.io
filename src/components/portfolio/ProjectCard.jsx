import { Link } from 'react-router-dom'

function CoverFallback({ title }) {
  return (
    <div className="cover-fallback" aria-hidden="true">
      <i className="pi pi-images" />
      <span className="word">{title}</span>
    </div>
  )
}

export default function ProjectCard({ project }) {
  const {
    slug,
    title,
    short_description: shortDescription,
    cover_image_url: coverImage,
    technologies = [],
    category,
    live_url: liveUrl,
    github_url: githubUrl,
    is_featured: isFeatured,
  } = project

  return (
    <article className="project-card">
      <Link to={`/projects/${slug}`} className="cover" aria-label={`View ${title}`}>
        {coverImage ? <img src={coverImage} alt={`${title} cover`} loading="lazy" /> : <CoverFallback title={title} />}
        {isFeatured ? (
          <span className="badge badge-red featured-badge">
            <i className="pi pi-star-fill" aria-hidden="true" /> Featured
          </span>
        ) : null}
      </Link>

      <div className="body">
        <div className="flex-between">
          <h3>
            <Link to={`/projects/${slug}`}>{title}</Link>
          </h3>
          <span className="chip">{category}</span>
        </div>

        <p className="short">{shortDescription}</p>

        {technologies.length > 0 ? (
          <div className="tags">
            {technologies.map((tech) => (
              <span key={tech} className="chip">
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        <div className="links">
          {liveUrl ? (
            <a href={liveUrl} target="_blank" rel="noreferrer">
              <i className="pi pi-external-link" aria-hidden="true" /> Live demo
            </a>
          ) : null}
          {githubUrl ? (
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <i className="pi pi-github" aria-hidden="true" /> Code
            </a>
          ) : null}
          <Link to={`/projects/${slug}`} className="card-more">
            Details <i className="pi pi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
