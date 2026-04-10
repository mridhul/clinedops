import { Layout, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { useAuth } from '../../auth/useAuth'
import { useStudentPortalData } from '../../api/studentPortal'
import StudentPortalContent from './StudentPortalContent'
import StudentPortalHeader from './StudentPortalHeader'
import StudentPortalMobileNav from './StudentPortalMobileNav'
import StudentPortalSidebar from './StudentPortalSidebar'
import './studentPortal.css'

export default function StudentPortalLayout() {
  const navigate = useNavigate()
  const accessToken = useAuth((s) => s.accessToken)
  const profile = useAuth((s) => s.profile)
  const clearAuth = useAuth((s) => s.clear)

  const [selectedKey, setSelectedKey] = useState('overview')

  const { data, isLoading } = useStudentPortalData(accessToken)

  const displayName = useMemo(() => {
    if (data?.displayName) return data.displayName
    if (profile?.full_name) return profile.full_name
    return profile?.email?.split('@')[0] ?? 'Student'
  }, [data?.displayName, profile?.email, profile?.full_name])

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const onNav = (sectionId: string) => {
    const map: Record<string, string> = {
      welcome: 'overview',
      schedule: 'my-teaching',
      'teaching-history': 'my-teaching',
      'pending-surveys': 'survey-analytics',
      'posting-progress': 'user-management',
      'clinical-insight': 'system-logs',
    }
    const nextKey = map[sectionId]
    if (nextKey) setSelectedKey(nextKey)
    scrollToSection(sectionId)
  }

  const onSignOut = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin />
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <StudentPortalHeader
        displayName={displayName}
        profileAvatarUrl={data.profileAvatarUrl}
        onNav={onNav}
      />

      <Layout>
        <StudentPortalSidebar
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onNav={onNav}
          onSignOut={onSignOut}
        />

        <Layout.Content className="cd-student-content">
          <StudentPortalContent data={data} />
        </Layout.Content>
      </Layout>

      <StudentPortalMobileNav onNav={onNav} />
    </Layout>
  )
}

