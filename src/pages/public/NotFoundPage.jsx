import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'

export default function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found', noindex: true })

  return (
    <div className="notfound">
      <div>
        <div className="code" aria-hidden="true">
          4<span className="zero">0</span>4
        </div>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="btn btn-primary">
          <i className="pi pi-home" aria-hidden="true" /> Back to home
        </Link>
      </div>
    </div>
  )
}
