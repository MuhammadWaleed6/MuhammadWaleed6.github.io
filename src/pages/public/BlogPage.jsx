import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getPublishedBlogPosts } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import SectionHeading from '../../components/portfolio/SectionHeading'
import SetupNotice from '../../components/common/SetupNotice'
import './BlogPage.css'

function CoverFallback() {
  return (
    <div className="cover-fallback" aria-hidden="true">
      <i className="pi pi-book" />
      <span className="word">Blog</span>
    </div>
  )
}

export default function BlogPage() {
  useDocumentMeta({
    title: 'Blog — Muhammad Walid',
    description:
      'Articles by Muhammad Walid on web development — React, responsive design, Supabase and lessons learned building real websites and client projects.',
    canonicalPath: '/blog',
  })

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    getPublishedBlogPosts()
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="section">
      <div className="container">
        <h1 className="sr-only">Blog — Muhammad Walid</h1>
        <SectionHeading
          label="Blog"
          title="Notes from the build"
          description="What I'm learning while building websites, dashboards and my own products — written for developers and clients alike."
        />

        {!isSupabaseConfigured ? (
          <SetupNotice />
        ) : loading ? (
          <div className="blog-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 320, borderRadius: 14 }} />
            ))}
          </div>
        ) : error ? (
          <div className="state-block">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
            <h3>Could not load the blog</h3>
            <p>Please refresh the page and try again.</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="state-block">
            <i className="pi pi-book" aria-hidden="true" />
            <h3>No posts yet</h3>
            <p>Articles will appear here once they are published from the dashboard.</p>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <article key={post.id} className="blog-card">
                <Link to={`/blog/${post.slug}`} className="cover" aria-label={`Read ${post.title}`}>
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={`${post.title} cover`} loading="lazy" />
                  ) : (
                    <CoverFallback />
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
                  {(post.tags || []).length > 0 ? (
                    <div className="tags">
                      {post.tags.map((tag) => (
                        <span key={tag} className="chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Link to={`/blog/${post.slug}`} className="card-more">
                    Read article <i className="pi pi-arrow-right" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
