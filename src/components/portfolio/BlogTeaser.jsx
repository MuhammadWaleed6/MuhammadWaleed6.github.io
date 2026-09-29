import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublishedBlogPosts } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'

/** Home-page blog teaser: the two latest articles, below the contact section. */
export default function BlogTeaser() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) return undefined
    getPublishedBlogPosts()
      .then((data) => {
        if (!cancelled) setPosts(data.slice(0, 2))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (posts.length === 0) return null

  return (
    <section className="section" id="home-blog">
      <div className="container">
        <div className="section-head with-action">
          <div className="section-head-text">
            <span className="section-label">Blog</span>
            <h2 className="section-title">Latest articles</h2>
            <p className="section-desc">
              Notes on web development — what I'm learning while building real things.
            </p>
          </div>
          <div className="section-action">
            <Link to="/blog" className="btn btn-outline btn-sm">
              View all articles <i className="pi pi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <Link to={`/blog/${post.slug}`} className="cover" aria-label={`Read ${post.title}`}>
                {post.cover_image_url ? (
                  <img src={post.cover_image_url} alt={`${post.title} cover`} loading="lazy" />
                ) : (
                  <div className="cover-fallback" aria-hidden="true">
                    <i className="pi pi-book" />
                    <span className="word">Blog</span>
                  </div>
                )}
              </Link>
              <div className="body">
                <div className="meta">
                  <span>{formatDate(post.created_at)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.reading_minutes} min read</span>
                </div>
                <h2>
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="excerpt">{post.excerpt}</p>
                <Link to={`/blog/${post.slug}`} className="card-more">
                  Read article <i className="pi pi-arrow-right" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
