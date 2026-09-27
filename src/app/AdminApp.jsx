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
import MessagesAdminPage from '../pages/admin/MessagesAdminPage'
import ProfileAdminPage from '../pages/admin/ProfileAdminPage'
import SettingsAdminPage from '../pages/admin/SettingsAdminPage'

export default function AdminApp() {
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
          <Route path="messages" element={<MessagesAdminPage />} />
          <Route path="profile" element={<ProfileAdminPage />} />
          <Route path="settings" element={<SettingsAdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
