import { Alert, Badge, Button, Card, Descriptions, Space, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router-dom'
import { useApproveSession, useSubmitSession, useTeachingSession } from '../../api/teachingHours'
import { useAuth } from '../../auth/useAuth'

const { Title, Text } = Typography

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isLoading } = useTeachingSession(id)
  
  const profile = useAuth((s) => s.profile)
  const submitMutation = useSubmitSession()
  const approveMutation = useApproveSession()

  const canApprove = profile?.role === 'supervisor' || profile?.role === 'programme_admin' || profile?.role === 'super_admin'

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!session) return <div style={{ padding: 24 }}>Session not found</div>

  const statusColors: Record<string, string> = {
    draft: 'default',
    submitted: 'processing',
    pending_review: 'processing',
    approved: 'success',
    rejected: 'error',
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center">
            <Title level={2} style={{ margin: 0 }}>Session Detail</Title>
            <Badge status={statusColors[session.approval_status] as any} text={session.approval_status.toUpperCase()} />
          </Space>
          <Space>
            {session.approval_status === 'draft' && (
              <Button type="primary" onClick={() => submitMutation.mutate(session.id)}>Submit for Approval</Button>
            )}
            {['submitted', 'pending_review'].includes(session.approval_status) && canApprove && (
              <Button type="primary" ghost onClick={() => approveMutation.mutate(session.id)}>Approve</Button>
            )}
            <Button onClick={() => navigate('/dashboard/teaching-sessions')}>Back to List</Button>
          </Space>
        </div>

        {session.is_flagged && (
          <Alert
            message="Anomaly Flags Detected"
            type="warning"
            showIcon
            description={
              <ul>
                {session.anomaly_flags.map((f, i) => (
                  <li key={i}>
                    <strong>{f.type}:</strong> {f.detail}
                  </li>
                ))}
              </ul>
            }
          />
        )}

        {session.approval_status === 'rejected' && (
          <Alert
            message="Session Rejected"
            type="error"
            showIcon
            description={
              <div>
                <Text strong>Reason:</Text> <Text>{session.rejection_reason}</Text>
                <div style={{ marginTop: 8 }}>
                   <Button size="small" type="primary" onClick={() => navigate(`/dashboard/teaching-sessions/${session.id}/edit`)}>Edit & Resubmit</Button>
                </div>
              </div>
            }
          />
        )}

        <Card title="Session Details">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Date">{dayjs(session.starts_at).format('DD MMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Time">{dayjs(session.starts_at).format('HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Duration">{session.duration_minutes} minutes</Descriptions.Item>
            <Descriptions.Item label="Type"><Tag color="blue">{session.session_type?.toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Discipline">{session.discipline}</Descriptions.Item>
            {session.billable_amount && (
              <Descriptions.Item label="Billable Amount">
                <Text strong>{session.billable_amount} SGD</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Description" span={2}>{session.description || 'No description'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Students">
          {session.session_students.length > 0 ? (
            <Table
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={session.session_students}
              columns={[
                {
                  title: 'Name',
                  key: 'name',
                  render: (_: unknown, row) => row.full_name?.trim() || <Text type="secondary">—</Text>,
                },
                {
                  title: 'Email',
                  key: 'email',
                  render: (_: unknown, row) => row.email || <Text type="secondary">—</Text>,
                },
                {
                  title: 'Student code',
                  key: 'student_code',
                  render: (_: unknown, row) => row.student_code || <Text type="secondary">—</Text>,
                },
                {
                  title: 'Attendance',
                  key: 'attendance',
                  render: (_: unknown, row) =>
                    row.attendance_confirmed_at ? (
                      <Tag color="success">Confirmed</Tag>
                    ) : (
                      <Tag>Pending confirmation</Tag>
                    ),
                },
              ]}
            />
          ) : (
            <Text type="secondary">No students linked to this session.</Text>
          )}
        </Card>
      </Space>
    </div>
  )
}
