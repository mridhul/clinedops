import { Button, Layout, Modal, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './studentPortal.css'

export default function StudentPortalSidebar(props: {
  selectedKey: string
  onSelect: (key: string) => void
  onNav: (sectionId: string) => void
  onSignOut: () => void
}) {
  const navigate = useNavigate()
  const [helpOpen, setHelpOpen] = useState(false)
  const [logHoursOpen, setLogHoursOpen] = useState(false)

  return (
    <Layout.Sider className="cd-student-sider" theme="light">
      <div style={{ padding: 'var(--cd-spacing-4)' }}>
        <Typography.Text
          style={{
            fontFamily: 'var(--cd-font-display-family)',
            fontWeight: 800,
            color: 'var(--cd-on-surface)',
            display: 'block',
          }}
        >
          Medical Affairs
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 'var(--cd-font-size-label-sm)' }}>
          Clinical Curator
        </Typography.Text>
      </div>

      <div style={{ padding: '0 var(--cd-spacing-4) var(--cd-spacing-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-3)' }}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard', sectionId: 'welcome' },
            { key: 'my-teaching', label: 'My Teaching', icon: 'history_edu', sectionId: 'schedule' },
            { key: 'survey-analytics', label: 'Survey Analytics', icon: 'poll', sectionId: 'pending-surveys' },
            { key: 'user-management', label: 'User Management', icon: 'group', sectionId: 'posting-progress' },
            { key: 'system-logs', label: 'System Logs', icon: 'analytics', sectionId: 'clinical-insight' },
          ].map((item) => {
            const active = props.selectedKey === item.key
            return (
              <Button
                key={item.key}
                type="text"
                onClick={() => {
                  if (item.key === 'my-teaching') {
                    navigate('/dashboard/my-sessions')
                    return
                  }
                  props.onSelect(item.key)
                  props.onNav(item.sectionId)
                }}
                style={{
                  justifyContent: 'flex-start',
                  borderRadius: 'var(--cd-rounded-full)',
                  paddingInline: 'var(--cd-spacing-4)',
                  paddingBlock: 'var(--cd-spacing-3)',
                  color: active ? 'var(--cd-primary)' : 'var(--cd-on-surface-variant)',
                  background: active ? 'var(--cd-surface-container-lowest)' : 'transparent',
                  boxShadow: active ? 'var(--cd-shadow-standard)' : 'none',
                  textAlign: 'left',
                }}
              >
                <span className="material-symbols-outlined" style={{ marginRight: 'var(--cd-spacing-3)' }}>
                  {item.icon}
                </span>
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: 'var(--cd-spacing-4)' }}>
        <Button
          type="primary"
          block
          icon={<span className="material-symbols-outlined">school</span>}
          onClick={() => {
            navigate('/dashboard/teaching-sessions/new')
          }}
          style={{ borderRadius: 'var(--cd-rounded-md)', paddingBlock: 'var(--cd-spacing-3)' }}
        >
          Log Teaching Hours
        </Button>
      </div>

      <div style={{ padding: 'var(--cd-spacing-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-3)' }}>
          <Button
            type="text"
            onClick={() => setHelpOpen(true)}
            style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            icon={<span className="material-symbols-outlined">help</span>}
          >
            Help Center
          </Button>
          <Button
            type="text"
            onClick={props.onSignOut}
            style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            icon={<span className="material-symbols-outlined">logout</span>}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <Modal
        open={helpOpen}
        title="Help Center"
        onCancel={() => setHelpOpen(false)}
        onOk={() => setHelpOpen(false)}
        okText="Close"
        footer={undefined}
      >
        <Typography.Text type="secondary">
          Help content will be connected to the backend later.
        </Typography.Text>
      </Modal>

      <Modal
        open={logHoursOpen}
        title="Log Teaching Hours"
        onCancel={() => setLogHoursOpen(false)}
        onOk={() => setLogHoursOpen(false)}
        okText="Close"
        footer={undefined}
      >
        <Typography.Text type="secondary">Teaching hours form will be connected to the backend later.</Typography.Text>
        <div style={{ marginTop: 'var(--cd-spacing-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={() => setLogHoursOpen(false)}>
            Save
          </Button>
        </div>
      </Modal>
    </Layout.Sider>
  )
}

