import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'

import type { Role } from '../types/auth'

const adminItems: MenuProps['items'] = [
  { key: 'overview', label: 'Overview' },
  { key: 'students', label: 'Students' },
  { key: 'tutors', label: 'Tutors' },
  { key: 'postings', label: 'Postings' },
  { key: 'reports', label: 'Reports' },
]

const studentItems: MenuProps['items'] = [
  { key: 'my-sessions', label: 'My Sessions' },
  { key: 'my-feedback', label: 'My Feedback' },
  { key: 'surveys', label: 'Surveys' },
]

export default function Sidebar({ role }: { role: Role | null }) {
  const items = role === 'student' ? studentItems : adminItems

  return (
    <Layout.Sider width={220} theme="light">
      <Menu mode="inline" items={items} />
    </Layout.Sider>
  )
}

