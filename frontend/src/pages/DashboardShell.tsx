import { Layout, Spin, Typography } from 'antd'
import { useEffect } from 'react'

import Sidebar from '../components/Sidebar'
import { useAuth } from '../auth/useAuth'
import { useMe } from '../api/auth'

export default function DashboardShell() {
  const accessToken = useAuth((s) => s.accessToken)
  const profile = useAuth((s) => s.profile)
  const setProfile = useAuth((s) => s.setProfile)

  const meQuery = useMe(accessToken)

  useEffect(() => {
    if (meQuery.data) {
      setProfile(meQuery.data)
    }
  }, [meQuery.data, setProfile])

  const role = meQuery.data?.role ?? profile?.role ?? null

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar role={role} />
      <Layout.Content style={{ padding: 24 }}>
        {meQuery.isLoading ? (
          <Spin />
        ) : (
          <>
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              Dashboard
            </Typography.Title>
            <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
              Signed in as {meQuery.data?.email ?? profile?.email ?? 'unknown'}
            </Typography.Paragraph>
          </>
        )}
      </Layout.Content>
    </Layout>
  )
}

