import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { getBlogPostBySlug, getBlogNeighbors } from '../../services/contentService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { markdownToHtml } from '../../lib/markdown'
import './BlogPostPage.css'

function upsertJsonLd(scriptId, data) {
  let tag = document.getElementById(scriptId)
  if (!data) {
    tag?.remove()
    return
  }
  if (!tag) {
    tag = document.createElement('script')
    tag.type = 'application/ld+json'
    tag.id = scriptId
    document.head.appendChild(tag)
  }
  tag.textContent = JSON.stringify(data)
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const { settings } = useSiteSettings()
  const [post, setPost] = useState(null)
  const [neighbors, setNeighbors] = useState({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const canonicalPath = `/blog/${slug}`

  useDocumentMeta({
    title: loading ? 'Loading article…' : post ? `${post.title} — Blog` : 'Article not found',
    description: post?.excerpt || settings.meta_description,
    canonicalPath,
    image: post?.cover_image_url || undefined,
    noindex: !post,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setError('')
    setPost(null)
    setNeighbors({ prev: null, next: null })

    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    getBlogPostBySlug(slug)
      .then(async (data) => {
        if (cancelled) return
        if (!data) {
          setNotFound(true)
        } else {
          setPost(data)
          try {
            const n = await getBlogNeighbors(data.sort_order)
            if (!cancelled) setNeighbors(n)
          } catch {
            /* prev/next is optional — never block the article */
          }
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load this article. Please try again.')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const url = `https://mwalid.me${canonicalPath}`

  // Article structured data — only real, visible facts.
  useEffect(() => {
    if (post) {
      upsertJsonLd('blog-article-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        url,
        datePublished: post.created_at,
        dateModified: post.updated_at,
        wordCount: String(post.content || '').split(/\s+/).filter(Boolean).length,
        keywords: (post.tags || []).join(', '),
        author: { name: settings.display_name, url: 'https://mwalid.me/' },
        publisher: { name: settings.display_name, url: 'https://mwalid.me/' },
        ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
      })
    } else {
      upsertJsonLd('blog-article-jsonld', null)
    }
    return () => upsertJsonLd('blog-article-jsonld', null)
  }, [post, url, settings.display_name])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — the other share options still work */
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container blogpost-container">
          <div className="skeleton" style={{ height: 320, borderRadius: 14 }} />
        </div>
      </section>
    )
  }

  if (error || notFound || !post) {
    return (
      <section className="section">
        <div className="container blogpost-container">
          <div className="state-block">
            <i className="pi pi-compass" aria-hidden="true" />
            <h3>{notFound ? 'Article not found' : 'Something went wrong'}</h3>
            <p>{notFound ? "This article doesn't exist or isn't published." : error}</p>
            <Link to="/blog" className="btn btn-primary btn-sm">
              <i className="pi pi-arrow-left" aria-hidden="true" /> Back to blog
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const shareTargets = [
    {
      label: 'Share on X',
      icon: 'pi-twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'Share on LinkedIn',
      icon: 'pi-linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'Share on Facebook',
      icon: 'pi-facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: 'Share on WhatsApp',
      icon: 'pi-whatsapp',
      href: `https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`,
    },
  ]

  return (
    <>
      <section className="blogpost-hero">
        <div className="container">
          <Link to="/blog" className="back-link">
            <i className="pi pi-arrow-left" aria-hidden="true" /> All articles
          </Link>
          <div className="meta">
            <span>{formatDate(post.created_at)}</span>
            <span aria-hidden="true">·</span>
            <span>{post.reading_minutes} min read</span>
          </div>
          <h1>{post.title}</h1>
          {(post.tags || []).length > 0 ? (
            <div className="tags">
              {post.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="container blogpost-container">
          {post.cover_image_url ? (
            <img className="post-cover" src={post.cover_image_url} alt={`${post.title} cover`} />
          ) : null}

          <article
            className="post-content"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
          />

          <div className="share-row" aria-label="Share this article">
            <span className="share-label">
              <i className="pi pi-share-alt" aria-hidden="true" /> Share
            </span>
            {shareTargets.map((s) => (
              <a
                key={s.label}
                className="icon-btn"
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
              >
                <i className={`pi ${s.icon}`} aria-hidden="true" />
              </a>
            ))}
            <button type="button" className="icon-btn" onClick={copyLink} aria-label="Copy link" title="Copy link">
              <i className={`pi ${copied ? 'pi-check' : 'pi-link'}`} aria-hidden="true" />
            </button>
          </div>

          <nav className="post-nav" aria-label="More articles">
            {neighbors.prev ? (
              <Link to={`/blog/${neighbors.prev.slug}`} className="post-nav-card prev">
                <span className="dir">
                  <i className="pi pi-arrow-left" aria-hidden="true" /> Previous
                </span>
                <span className="t">{neighbors.prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {neighbors.next ? (
              <Link to={`/blog/${neighbors.next.slug}`} className="post-nav-card next">
                <span className="dir">
                  Next <i className="pi pi-arrow-right" aria-hidden="true" />
                </span>
                <span className="t">{neighbors.next.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </section>
    </>
  )
}
