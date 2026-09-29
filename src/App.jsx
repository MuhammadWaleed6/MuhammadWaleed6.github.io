import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import PublicLayout from './components/layout/PublicLayout'
import HomePage from './pages/public/HomePage'
import AboutPage from './pages/public/AboutPage'
import SkillsPage from './pages/public/SkillsPage'
import ProjectsPage from './pages/public/ProjectsPage'
import ProjectDetailPage from './pages/public/ProjectDetailPage'
import ServicesPage from './pages/public/ServicesPage'
import ContactPage from './pages/public/ContactPage'
import TeamMemberDetailPage from './pages/public/TeamMemberDetailPage'
import TeamPage from './pages/public/TeamPage'
import BlogPage from './pages/public/BlogPage'
import BlogPostPage from './pages/public/BlogPostPage'
import NotFoundPage from './pages/public/NotFoundPage'
import PageLoading from './components/common/PageLoading'

// The admin bundle is code-split so public visitors never download it.
const AdminApp = lazy(() => import('./app/AdminApp'))

export default function App() {
  const navigate = useNavigate()

  // GitHub Pages deep-link support: 404.html stores the intended path and
  // redirects to /; we pick it up here and route to the right place.
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('gh-redirect-path')
    if (redirectPath) {
      sessionStorage.removeItem('gh-redirect-path')
      navigate(redirectPath, { replace: true })
    }
  }, [navigate])

  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/team/:slug" element={<TeamMemberDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* The admin dashboard lives on an unlisted URL. There is deliberately
            no link, no redirect and no mention of it in the public bundle —
            unknown paths fall through to the 404 page. */}
        <Route path={`${__ADMIN_BASE__}/*`} element={<AdminApp />} />
      </Routes>
    </Suspense>
  )
}
