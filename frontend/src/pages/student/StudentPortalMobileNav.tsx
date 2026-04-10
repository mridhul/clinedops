import { Button } from 'antd'

import './studentPortal.css'

export default function StudentPortalMobileNav(props: { onNav: (sectionId: string) => void }) {
  return (
    <nav className="cd-student-mobile-nav">
      <Button type="text" onClick={() => props.onNav('welcome')} style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="material-symbols-outlined">dashboard</span>
        <span>Home</span>
      </Button>
      <Button
        type="text"
        onClick={() => props.onNav('schedule')}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <span className="material-symbols-outlined">calendar_month</span>
        <span>Schedule</span>
      </Button>
      <Button
        type="text"
        onClick={() => props.onNav('teaching-history')}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <span className="material-symbols-outlined">history_edu</span>
        <span>Logs</span>
      </Button>
      <Button
        type="text"
        onClick={() => props.onNav('posting-progress')}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <span className="material-symbols-outlined">person</span>
        <span>Profile</span>
      </Button>
    </nav>
  )
}

