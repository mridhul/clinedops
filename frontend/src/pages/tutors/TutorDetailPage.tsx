import { Button, Card, Descriptions, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useDeleteTutor, useTutorDetail } from '../../api/tutors'

export default function TutorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const accessToken = useAuth((s) => s.accessToken)
  const q = useTutorDetail(accessToken, id)
  const del = useDeleteTutor(accessToken)

  if (!id) return null

  return (
    <>
      <Typography.Title level={3}>Tutor</Typography.Title>
      {q.isLoading || !q.data ? (
        <Typography.Text>Loading…</Typography.Text>
      ) : (
        <Card>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Code">{q.data.tutor_code}</Descriptions.Item>
            <Descriptions.Item label="Email">{q.data.email}</Descriptions.Item>
            <Descriptions.Item label="Discipline">{q.data.discipline}</Descriptions.Item>
            <Descriptions.Item label="Teaching sessions">{q.data.teaching_sessions_count}</Descriptions.Item>
          </Descriptions>
          <Button style={{ marginTop: 8 }} onClick={() => navigate(`/dashboard/tutors/${id}/edit`)}>
            Edit
          </Button>
          <Button
            danger
            style={{ marginLeft: 8 }}
            onClick={async () => {
              await del.mutateAsync(id)
              navigate('/dashboard/tutors')
            }}
          >
            Soft delete
          </Button>
        </Card>
      )}
    </>
  )
}
