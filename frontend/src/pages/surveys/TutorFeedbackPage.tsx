import { Alert, Card, Empty, List, Space, Statistic, Typography } from 'antd'
import type { StatisticProps } from 'antd'
import dayjs from 'dayjs'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../auth/useAuth'
import { useMyTutorFeedback } from '../../api/surveys'

const { Title, Text } = Typography

export default function TutorFeedbackPage() {
  const token = useAuth((s) => s.accessToken)
  const role = useAuth((s) => s.profile?.role)

  // This page is tutor-focused today. Supervisors/admins can have a separate view later.
  const enabled = role === 'tutor'
  const { data, isLoading, isError, error } = useMyTutorFeedback(enabled ? token : null)

  if (!enabled) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={3} style={{ marginTop: 0 }}>
            Survey Analytics
          </Title>
          <Empty description="Tutor survey analytics are available for tutor accounts." />
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          showIcon
          message="Failed to load tutor feedback"
          description={(error as Error)?.message ?? 'Please try again later.'}
        />
      </div>
    )
  }

  const summary = data
  const hasAnyData = (summary?.total_responses ?? 0) > 0

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Survey Analytics
          </Title>
          <Text type="secondary">Tutor feedback trends and recent comments.</Text>
        </div>

        {!hasAnyData ? (
          <Card>
            <Empty description="No feedback data available yet." />
          </Card>
        ) : (
          <>
            <Space size="large" wrap>
              <Card style={{ minWidth: 220 }}>
                <Statistic title="Average Score" value={Number(summary.average_score)} precision={2} suffix="/ 5" />
              </Card>
              <Card style={{ minWidth: 220 }}>
                <Statistic title="Total Responses" value={summary.total_responses} />
              </Card>
              <Card style={{ minWidth: 220 }}>
                <Statistic title="Low Score Alerts" value={summary.low_score_count} />
              </Card>
            </Space>

            <Card title="Score Trend (by submission date)">
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => dayjs(v).format('DD MMM')} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip labelFormatter={(v) => dayjs(String(v)).format('DD MMM YYYY')} />
                    <Line type="monotone" dataKey="score" stroke="#1677ff" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Recent Comments">
              <List
                dataSource={summary.recent_comments ?? []}
                locale={{ emptyText: 'No written comments yet.' }}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </>
        )}
      </Space>
    </div>
  )
}
