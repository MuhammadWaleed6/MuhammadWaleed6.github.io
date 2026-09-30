import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import AdminLayout from '../components/admin/AdminLayout'
import LoginPage from '../pages/admin/LoginPage'
import DashboardPage from '../pages/admin/DashboardPage'
import ProjectsAdminPage from '../pages/admin/ProjectsAdminPage'
import ProjectEditorPage from '../pages/admin/ProjectEditorPage'
import SkillsAdminPage from '../pages/admin/SkillsAdminPage'
import ServicesAdminPage from '../pages/admin/ServicesAdminPage'
import TimelineAdminPage from '../pages/admin/TimelineAdminPage'
import TeamAdminPage from '../pages/admin/TeamAdminPage'
import BlogAdminPage from '../pages/admin/BlogAdminPage'
import MessagesAdminPage from '../pages/admin/MessagesAdminPage'
import ProfileAdminPage from '../pages/admin/ProfileAdminPage'
import SettingsAdminPage from '../pages/admin/SettingsAdminPage'

const BASE = __ADMIN_BASE__

export default function AdminApp() {
  // The dashboard is designed for the light palette only: force it while the
  // admin is mounted, then restore the visitor's public theme on the way out.
  useEffect(() => {
    const root = document.documentElement
    const prev = root.getAttribute('data-theme')
    root.setAttribute('data-theme', 'light')
    return () => {
      if (prev) root.setAttribute('data-theme', prev)
      else root.removeAttribute('data-theme')
    }
  }, [])

  return (
    <Routes>
      {/* Login is reachable without a session */}
      <Route path="login" element={<LoginPage />} />

      {/* Everything below requires session + admin allowlist membership */}
      <Route element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsAdminPage />} />
          <Route path="projects/new" element={<ProjectEditorPage />} />
          <Route path="projects/:id" element={<ProjectEditorPage />} />
          <Route path="skills" element={<SkillsAdminPage />} />
          <Route path="services" element={<ServicesAdminPage />} />
          <Route path="timeline" element={<TimelineAdminPage />} />
          <Route path="team" element={<TeamAdminPage />} />
          <Route path="blog" element={<BlogAdminPage />} />
          <Route path="messages" element={<MessagesAdminPage />} />
          <Route path="profile" element={<ProfileAdminPage />} />
          <Route path="settings" element={<SettingsAdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={BASE} replace />} />
    </Routes>
  )
}
