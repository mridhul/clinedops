import { Alert, Card, Empty, List, Select, Space, Statistic, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../auth/useAuth'
import { useTutorsList } from '../../api/tutors'
import { useMySurveySubmissions, useMyTutorFeedback, useTutorFeedback } from '../../api/surveys'
import type { TutorFeedbackSummary } from '../../types/surveys'

const { Title, Text } = Typography

function FeedbackSummaryBody({
  summary,
  isLoading,
  isError,
  error,
}: {
  summary: TutorFeedbackSummary | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}) {
  if (isLoading) {
    return <Card loading />
  }
  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load survey analytics"
        description={error?.message ?? 'Please try again later.'}
      />
    )
  }
  const hasAnyData = (summary?.total_responses ?? 0) > 0
  if (!hasAnyData) {
    return (
      <Card>
        <Empty description="No submitted survey responses are linked to this tutor yet." />
      </Card>
    )
  }
  return (
    <>
      <Space size="large" wrap>
        <Card style={{ minWidth: 220 }}>
          <Statistic title="Average Score" value={Number(summary!.average_score)} precision={2} suffix="/ 5" />
        </Card>
        <Card style={{ minWidth: 220 }}>
          <Statistic title="Total Responses" value={summary!.total_responses} />
        </Card>
        <Card style={{ minWidth: 220 }}>
          <Statistic title="Low Score Alerts" value={summary!.low_score_count} />
        </Card>
      </Space>

      <Card title="Score trend (by submission date)">
        <div style={{ height: 320, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary!.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => dayjs(v).format('DD MMM')} />
              <YAxis domain={[0, 5]} />
              <Tooltip labelFormatter={(v) => dayjs(String(v)).format('DD MMM YYYY')} />
              <Line type="monotone" dataKey="score" stroke="#1677ff" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Recent comments">
        <List
          dataSource={summary!.recent_comments ?? []}
          locale={{ emptyText: 'No written comments yet.' }}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      </Card>
    </>
  )
}

export default function TutorFeedbackPage() {
  const token = useAuth((s) => s.accessToken)
  const role = useAuth((s) => s.profile?.role)

  const isTutor = role === 'tutor'
  const isStudent = role === 'student'
  const canBrowseTutors =
    role === 'supervisor' || role === 'programme_admin' || role === 'super_admin'

  const [pickedTutorId, setPickedTutorId] = useState<string | undefined>()

  const myTutorQuery = useMyTutorFeedback(token, isTutor)
  const browseQuery = useTutorFeedback(token, canBrowseTutors ? pickedTutorId : undefined)
  const mySubmissions = useMySurveySubmissions(isStudent ? token : null)

  const tutorsList = useTutorsList(canBrowseTutors ? token : null, { limit: 400, active_only: true })

  const tutorOptions = useMemo(
    () =>
      (tutorsList.data?.items ?? []).map((t) => ({
        value: t.id,
        label: [t.tutor_code, t.full_name, t.email].filter(Boolean).join(' — '),
      })),
    [tutorsList.data?.items],
  )

  if (isStudent) {
    return (
      <div style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Survey Analytics
            </Title>
            <Text type="secondary">Your submitted survey responses and scores.</Text>
          </div>
          <Card>
            {mySubmissions.isLoading ? (
              <Card loading />
            ) : mySubmissions.isError ? (
              <Alert type="error" showIcon message={(mySubmissions.error as Error)?.message} />
            ) : !mySubmissions.data?.length ? (
              <Empty description="You have not submitted any surveys yet. Complete one from Pending surveys." />
            ) : (
              <Table
                rowKey="id"
                pagination={{ pageSize: 10 }}
                dataSource={mySubmissions.data}
                columns={[
                  {
                    title: 'Submitted',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (v: string) => dayjs(v).format('DD MMM YYYY HH:mm'),
                  },
                  {
                    title: 'Overall score',
                    dataIndex: 'overall_score',
                    key: 'overall_score',
                    render: (v: number | undefined) =>
                      v != null ? `${Number(v).toFixed(2)} / 5` : <Text type="secondary">—</Text>,
                  },
                  {
                    title: 'Low score flag',
                    dataIndex: 'has_low_scores',
                    key: 'has_low_scores',
                    render: (v: boolean) => (v ? <Text type="warning">Yes</Text> : 'No'),
                  },
                ]}
              />
            )}
          </Card>
        </Space>
      </div>
    )
  }

  if (canBrowseTutors) {
    const q = browseQuery
    return (
      <div style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Survey Analytics
            </Title>
            <Text type="secondary">Select a tutor to view aggregated feedback from student submissions.</Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Text className="text-muted-foreground">Tutor</Text>
            <Select
              showSearch
              allowClear
              placeholder="Choose a tutor"
              className="min-w-[300px] w-full max-w-lg"
              optionFilterProp="label"
              loading={tutorsList.isLoading}
              value={pickedTutorId}
              onChange={(v) => setPickedTutorId(v)}
              options={tutorOptions}
            />
          </div>
          {!pickedTutorId ? (
            <Card>
              <Empty description="Choose a tutor to load survey results." />
            </Card>
          ) : (
            <FeedbackSummaryBody
              summary={q.data}
              isLoading={q.isLoading}
              isError={q.isError}
              error={q.error as Error | null}
            />
          )}
        </Space>
      </div>
    )
  }

  if (!isTutor) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={3} style={{ marginTop: 0 }}>
            Survey Analytics
          </Title>
          <Empty description="Sign in as a tutor, student, supervisor, or programme admin to view survey analytics." />
        </Card>
      </div>
    )
  }

  const q = myTutorQuery
  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Survey Analytics
          </Title>
          <Text type="secondary">Your feedback trends and recent comments from student surveys.</Text>
        </div>
        <FeedbackSummaryBody
          summary={q.data}
          isLoading={q.isLoading}
          isError={q.isError}
          error={q.error as Error | null}
        />
      </Space>
    </div>
  )
}
