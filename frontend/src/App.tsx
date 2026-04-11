import type { ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'

import LoginPage from './pages/LoginPage'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminOverview from './pages/admin/AdminOverview'
import AcademicCyclesPage from './pages/academicCycles/AcademicCyclesPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'
import PostingFormPage from './pages/postings/PostingFormPage'
import PostingsListPage from './pages/postings/PostingsListPage'
import StudentBatchImportPage from './pages/students/StudentBatchImportPage'
import StudentDetailPage from './pages/students/StudentDetailPage'
import StudentFormPage from './pages/students/StudentFormPage'
import StudentsListPage from './pages/students/StudentsListPage'
import TutorBatchImportPage from './pages/tutors/TutorBatchImportPage'
import TutorDetailPage from './pages/tutors/TutorDetailPage'
import TutorFormPage from './pages/tutors/TutorFormPage'
import TutorsListPage from './pages/tutors/TutorsListPage'
import SessionsListPage from './pages/teachingHours/SessionsListPage'
import SessionFormPage from './pages/teachingHours/SessionFormPage'
import SessionDetailPage from './pages/teachingHours/SessionDetailPage'
import TeachingHoursDashboard from './pages/teachingHours/TeachingHoursDashboard'
import BillingHoursPage from './pages/teachingHours/BillingHoursPage'
import MySessionsPage from './pages/student/MySessionsPage'
import ShadowingApplicationsPage from './pages/shadowing/ShadowingApplicationsPage'
import StrategicFeedbackDashboard from './pages/dashboards/StrategicFeedbackDashboard'
import MainLayout from './components/layout/MainLayout'
import TutorDashboard from './pages/tutors/TutorDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import StudentDashboard from './pages/dashboards/StudentDashboard'
import HODDashboard from './pages/dashboards/HODDashboard'
import SurveyTemplatesPage from './pages/surveys/SurveyTemplatesPage'
import PendingSurveysPage from './pages/surveys/PendingSurveysPage'
import SurveyFillingPage from './pages/surveys/SurveyFillingPage'
import TutorFeedbackPage from './pages/surveys/TutorFeedbackPage'
import ReportsPage from './pages/reports/ReportsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage'
import ProfilePage from './pages/settings/ProfilePage'
import BroadcastForm from './pages/admin/BroadcastForm'

import './theme/global.css'
import { themeConfig } from './theme/themeConfig'

/** Admin API is super_admin-only; programme admins must not see broken console UX. */
function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const profile = useAuth((s) => s.profile)
  if (profile?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function DashboardResolver() {
  const profile = useAuth((s) => s.profile)
  
  if (profile?.role === 'super_admin' || profile?.role === 'programme_admin') {
    return <AdminDashboard />
  }
  
  if (profile?.role === 'supervisor') {
    return <HODDashboard />
  }
  
  if (profile?.role === 'student') {
    return <StudentDashboard />
  }
  
  return <TutorDashboard />
}

export default function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route index element={<DashboardResolver />} />
                    
                    {/* General Management */}
                    <Route path="students" element={<StudentsListPage />} />
                    <Route path="students/new" element={<StudentFormPage />} />
                    <Route path="students/import" element={<StudentBatchImportPage />} />
                    <Route path="students/:id" element={<StudentDetailPage />} />
                    <Route path="students/:id/edit" element={<StudentFormPage />} />
                    
                    <Route path="tutors" element={<TutorsListPage />} />
                    <Route path="tutors/new" element={<TutorFormPage />} />
                    <Route path="tutors/import" element={<TutorBatchImportPage />} />
                    <Route path="tutors/:id" element={<TutorDetailPage />} />
                    <Route path="tutors/:id/edit" element={<TutorFormPage />} />
                    
                    <Route path="postings" element={<PostingsListPage />} />
                    <Route path="postings/new" element={<PostingFormPage />} />
                    <Route path="postings/:id/edit" element={<PostingFormPage />} />
                    
                    <Route path="academic-cycles" element={<AcademicCyclesPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route
                      path="admin"
                      element={
                        <RequireSuperAdmin>
                          <AdminOverview />
                        </RequireSuperAdmin>
                      }
                    />
                    
                    {/* Spec 2: Teaching Hours */}
                    <Route path="teaching-sessions" element={<SessionsListPage />} />
                    <Route path="teaching-sessions/new" element={<SessionFormPage />} />
                    <Route path="teaching-sessions/:id" element={<SessionDetailPage />} />
                    <Route path="teaching-sessions/:id/edit" element={<SessionFormPage />} />
                    <Route path="teaching-hours/dashboard" element={<TeachingHoursDashboard />} />
                    <Route path="billing-hours" element={<BillingHoursPage />} />
                    <Route path="my-sessions" element={<MySessionsPage />} />

                    {/* Spec 3: Surveys */}
                    <Route path="surveys/templates" element={<SurveyTemplatesPage />} />
                    <Route path="surveys/pending" element={<PendingSurveysPage />} />
                    <Route path="surveys/fill/:assignmentId" element={<SurveyFillingPage />} />
                    <Route path="surveys/analytics" element={<TutorFeedbackPage />} />
                    <Route path="strategic-insights" element={<StrategicFeedbackDashboard />} />
                    <Route path="shadowing" element={<ShadowingApplicationsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    
                    {/* Spec 5: Notifications */}
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="settings/notifications" element={<NotificationSettingsPage />} />
                    <Route path="settings/profile" element={<ProfilePage />} />
                    <Route
                      path="admin/broadcast"
                      element={
                        <RequireSuperAdmin>
                          <BroadcastForm />
                        </RequireSuperAdmin>
                      }
                    />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
