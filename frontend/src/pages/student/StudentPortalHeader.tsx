import { Avatar, Button, Modal, Typography } from 'antd'
import { useState } from 'react'

import './studentPortal.css'

export default function StudentPortalHeader(props: {
  displayName: string
  profileAvatarUrl: string
  onNav: (sectionId: string) => void
}) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="cd-student-header cd-glass">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cd-spacing-10)' }}>
        <Typography.Text
          style={{
            fontFamily: 'var(--cd-font-display-family)',
            fontWeight: 800,
            color: 'var(--cd-primary)',
          }}
        >
          Clinical Editorial
        </Typography.Text>

        <div className="cd-student-desktop-only" style={{ display: 'flex', gap: 'var(--cd-spacing-3)' }}>
          <Button type="text" onClick={() => props.onNav('welcome')} style={{ fontWeight: 700 }}>
            Dashboard
          </Button>
          <Button type="text" onClick={() => props.onNav('schedule')} style={{ fontWeight: 700 }}>
            Teaching Hours
          </Button>
          <Button type="text" onClick={() => props.onNav('pending-surveys')} style={{ fontWeight: 700 }}>
            Surveys
          </Button>
          <Button type="text" onClick={() => props.onNav('clinical-insight')} style={{ fontWeight: 700 }}>
            Reports
          </Button>
        </div>
      </div>

      <div className="cd-student-header-right">
        <Button shape="circle" onClick={() => setNotifOpen(true)} aria-label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </Button>
        <Button shape="circle" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <span className="material-symbols-outlined">settings</span>
        </Button>
        <Avatar
          className="cd-student-avatar"
          src={props.profileAvatarUrl}
          alt={`${props.displayName} profile`}
        />
      </div>

      <Modal
        open={notifOpen}
        title="Notifications"
        onCancel={() => setNotifOpen(false)}
        onOk={() => setNotifOpen(false)}
        okText="Close"
        footer={undefined}
      >
        <Typography.Text type="secondary">No new notifications right now.</Typography.Text>
      </Modal>

      <Modal
        open={settingsOpen}
        title="Settings"
        onCancel={() => setSettingsOpen(false)}
        onOk={() => setSettingsOpen(false)}
        okText="Close"
        footer={undefined}
      >
        <Typography.Text type="secondary">Profile settings UI will be connected to the backend later.</Typography.Text>
      </Modal>
    </header>
  )
}

