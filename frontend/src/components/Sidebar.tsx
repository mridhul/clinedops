import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'

import type { Role } from '../types/auth'

const adminMenu: { key: string; label: string; path: string }[] = [
  { key: 'overview', label: 'Overview', path: '/dashboard' },
  { key: 'students', label: 'Students', path: '/dashboard/students' },
  { key: 'tutors', label: 'Tutors', path: '/dashboard/tutors' },
  { key: 'postings', label: 'Postings', path: '/dashboard/postings' },
  { key: 'teaching-sessions', label: 'Teaching Sessions', path: '/dashboard/teaching-sessions' },
  { key: 'hours-dashboard', label: 'Hours Dashboard', path: '/dashboard/teaching-hours/dashboard' },
  { key: 'academic-cycles', label: 'Academic cycles', path: '/dashboard/academic-cycles' },
  { key: 'departments', label: 'Departments', path: '/dashboard/departments' },
  { key: 'reports', label: 'Reports', path: '/dashboard/reports' },
  { key: 'shadowing', label: 'Shadowing Applications', path: '/dashboard/shadowing' },
  { key: 'strategic-insights', label: 'Strategic Insights', path: '/dashboard/strategic-insights' },
]

const studentItems: MenuProps['items'] = [
  { key: 'my-sessions', label: 'My Sessions' },
  { key: 'my-feedback', label: 'My Feedback' },
  { key: 'surveys', label: 'Surveys' },
]

function selectedKeyFromPath(pathname: string): string {
  if (pathname.startsWith('/dashboard/students')) return 'students'
  if (pathname.startsWith('/dashboard/tutors')) return 'tutors'
  if (pathname.startsWith('/dashboard/postings')) return 'postings'
  if (pathname.startsWith('/dashboard/teaching-sessions')) return 'teaching-sessions'
  if (pathname.startsWith('/dashboard/teaching-hours/dashboard')) return 'hours-dashboard'
  if (pathname.startsWith('/dashboard/academic-cycles')) return 'academic-cycles'
  if (pathname.startsWith('/dashboard/departments')) return 'departments'
  if (pathname.startsWith('/dashboard/reports')) return 'reports'
  if (pathname.startsWith('/dashboard/shadowing')) return 'shadowing'
  if (pathname.startsWith('/dashboard/strategic-insights')) return 'strategic-insights'
  return 'overview'
}

export default function Sidebar({ role, pathname }: { role: Role | null; pathname: string }) {
  const navigate = useNavigate()
  const isStudent = role === 'student'
  const items: MenuProps['items'] = isStudent
    ? studentItems
    : adminMenu.map((m) => ({
        key: m.key,
        label: m.label,
        onClick: () => navigate(m.path),
      }))

  const selectedKeys = isStudent ? [] : [selectedKeyFromPath(pathname)]

  return (
    <Layout.Sider width={240} theme="light">
      <Menu mode="inline" selectedKeys={selectedKeys} items={items} />
    </Layout.Sider>
  )
}
