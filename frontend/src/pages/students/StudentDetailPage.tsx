import { Button, Card, Descriptions, Table, Timeline, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useDeleteStudent, useStudentDetail } from '../../api/students'

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const accessToken = useAuth((s) => s.accessToken)
  const profile = useAuth((s) => s.profile)
  const q = useStudentDetail(accessToken, id)
  const del = useDeleteStudent(accessToken)

  if (!id) return null

  return (
    <>
      <Typography.Title level={3}>Student profile</Typography.Title>
      {q.isLoading || !q.data ? (
        <Typography.Text>Loading…</Typography.Text>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Code">{q.data.student_code}</Descriptions.Item>
              <Descriptions.Item label="Email">{q.data.email}</Descriptions.Item>
              <Descriptions.Item label="Discipline">{q.data.discipline}</Descriptions.Item>
              <Descriptions.Item label="Lifecycle">{q.data.lifecycle_status}</Descriptions.Item>
              <Descriptions.Item label="Teaching hours (logged)">{q.data.teaching_hours_total}</Descriptions.Item>
            </Descriptions>
            <Button style={{ marginTop: 8 }} onClick={() => navigate(`/dashboard/students/${id}/edit`)}>
              Edit
            </Button>
            <Button
              danger
              style={{ marginLeft: 8 }}
              onClick={async () => {
                await del.mutateAsync(id)
                navigate('/dashboard/students')
              }}
            >
              Soft delete
            </Button>
          </Card>

          <Card title="Posting history" extra={(profile?.role === 'super_admin' || profile?.role === 'programme_admin') && <Button type="primary" onClick={() => navigate('/dashboard/postings/new')}>Create Posting</Button>} style={{ marginBottom: 16 }}>
            <Timeline
              items={q.data.posting_history.map((p) => ({
                children: (
                  <div>
                    <Typography.Text strong>{p.title}</Typography.Text>
                    <div>
                      {p.start_date} – {p.end_date} ({p.status})
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>

          <Card title="Recent feedback">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={q.data.feedback_recent}
              columns={[
                { title: 'Template', dataIndex: 'template_id', key: 't' },
                { title: 'Status', dataIndex: 'status', key: 's' },
                { title: 'Created', dataIndex: 'created_at', key: 'c' },
              ]}
            />
          </Card>
        </>
      )}
    </>
  )
}
