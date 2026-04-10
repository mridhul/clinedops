import { Layout, Spin, Typography } from 'antd'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Sidebar from '../components/Sidebar'
import { useAuth } from '../auth/useAuth'
import { useMe } from '../api/auth'
import AdminDashboard from './dashboards/AdminDashboard'
import TutorDashboard from './dashboards/TutorDashboard'
import StudentDashboard from './dashboards/StudentDashboard'

const { Text } = Typography

export default function DashboardShell() {
  const accessToken = useAuth((s) => s.accessToken)
  const profile = useAuth((s) => s.profile)
  const setProfile = useAuth((s) => s.setProfile)
  const location = useLocation()

  const meQuery = useMe(accessToken)

  useEffect(() => {
    if (meQuery.data) {
      setProfile(meQuery.data)
    }
  }, [meQuery.data, setProfile])

  const role = meQuery.data?.role ?? profile?.role ?? null
  const isRootDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/'

  const renderDashboard = () => {
    if (!role) return <Spin />
    if (role === 'super_admin' || role === 'programme_admin') return <AdminDashboard />
    if (role === 'tutor') return <TutorDashboard />
    if (role === 'student') return <StudentDashboard />
    if (role === 'supervisor') return <AdminDashboard /> // HOD placeholder
    return <Text>Dashboard not available for this role</Text>
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar role={role} pathname={location.pathname} />
      <Layout.Content className="p-4 md:p-6 lg:p-10 bg-[#f5f7fa]">
        {meQuery.isLoading ? (
          <Spin />
        ) : isRootDashboard ? (
          renderDashboard()
        ) : (
          <Outlet />
        )}
      </Layout.Content>
    </Layout>
  )
}
