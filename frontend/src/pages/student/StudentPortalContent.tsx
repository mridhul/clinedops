import { Button, Card, Modal, Progress, Spin, Table, Typography, Form, Select, Input } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { usePostingsList } from '../../api/postings'
import { useApplyShadowing } from '../../api/shadowing'
import type { AgendaItem, PendingSurveyBatch, StudentPortalData, TeachingHistoryRow } from '../../types/studentPortal'

export default function StudentPortalContent(props: {
  data: StudentPortalData
}) {
  const { data } = props
  const navigate = useNavigate()

  const [agendaOpen, setAgendaOpen] = useState(false)
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaItem | null>(null)

  const [logbookOpen, setLogbookOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)

  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [selectedQuickActionTitle, setSelectedQuickActionTitle] = useState<string | null>(null)

  const [logHoursOpen, setLogHoursOpen] = useState(false)
  const [applyShadowingOpen, setApplyShadowingOpen] = useState(false)
  const [applyForm] = Form.useForm()
  const applyShadowingMutation = useApplyShadowing()

  const statusTagFor = (row: TeachingHistoryRow) => {
    if (row.status === 'Verified') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--cd-tertiary-container)',
            color: 'var(--cd-on-tertiary-container)',
            borderRadius: 'var(--cd-rounded-full)',
            fontSize: 'var(--cd-font-size-label-sm)',
            fontWeight: 'var(--cd-font-weight-label-sm)',
            letterSpacing: '0.02em',
            paddingInline: 'var(--cd-spacing-3)',
            paddingBlock: 0,
            textTransform: 'uppercase',
          }}
        >
          {row.status}
        </span>
      )
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--cd-surface-container-highest)',
          color: 'var(--cd-on-surface-variant)',
          borderRadius: 'var(--cd-rounded-full)',
          fontSize: 'var(--cd-font-size-label-sm)',
          fontWeight: 'var(--cd-font-weight-label-sm)',
          letterSpacing: '0.02em',
          paddingInline: 'var(--cd-spacing-3)',
          paddingBlock: 0,
          textTransform: 'uppercase',
        }}
      >
        {row.status}
      </span>
    )
  }

  const teachingHistoryColumns = useMemo(() => {
    return [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: (value: string) => <span style={{ fontWeight: 600 }}>{value}</span>,
      },
      {
        title: 'Clinical Interaction',
        key: 'clinical-interaction',
        render: (_: unknown, row: TeachingHistoryRow) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-3)' }}>
            <Typography.Text style={{ fontWeight: 700 }}>{row.clinicalInteractionTitle}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 'var(--cd-font-size-label-sm)' }}>
              Tutor: {row.tutorName}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: 'Hours',
        dataIndex: 'hours',
        key: 'hours',
        align: 'center' as const,
        render: (value: number) => <span style={{ fontWeight: 700 }}>{value}</span>,
      },
      {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        align: 'center' as const,
        render: (_value: string, row: TeachingHistoryRow) => statusTagFor(row),
      },
    ]
  }, [])

  const agendaModal = (
    <Modal
      open={agendaOpen}
      title={selectedAgenda?.title ?? 'Agenda item'}
      onCancel={() => setAgendaOpen(false)}
      onOk={() => setAgendaOpen(false)}
      okText="Close"
      footer={undefined}
    >
      {selectedAgenda ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-3)' }}>
          <Typography.Text type="secondary">{selectedAgenda.time}</Typography.Text>
          <Typography.Text>{selectedAgenda.meetingPoint}</Typography.Text>
        </div>
      ) : null}
    </Modal>
  )

  const logbookModal = (
    <Modal
      open={logbookOpen}
      title="Logbook"
      onCancel={() => setLogbookOpen(false)}
      onOk={() => setLogbookOpen(false)}
      okText="Close"
      footer={undefined}
    >
      <Table<TeachingHistoryRow>
        rowKey="id"
        columns={teachingHistoryColumns}
        dataSource={data.teachingHistoryRows}
        pagination={false}
      />
    </Modal>
  )

  const batchModal = (
    <Modal
      open={batchOpen}
      title="Batch Survey"
      onCancel={() => setBatchOpen(false)}
      onOk={() => setBatchOpen(false)}
      okText="Close"
      footer={undefined}
    >
      <Typography.Text type="secondary">
        Survey intake UI will be connected to the backend later.
      </Typography.Text>
    </Modal>
  )

  const quickActionModal = (
    <Modal
      open={quickActionOpen}
      title={selectedQuickActionTitle ?? 'Quick Action'}
      onCancel={() => setQuickActionOpen(false)}
      onOk={() => setQuickActionOpen(false)}
      okText="Close"
      footer={undefined}
    >
      <Typography.Text type="secondary">This action is a placeholder until backend endpoints exist.</Typography.Text>
    </Modal>
  )

  const logHoursModal = (
    <Modal
      open={logHoursOpen}
      title="Log Teaching Hours"
      onCancel={() => setLogHoursOpen(false)}
      onOk={() => setLogHoursOpen(false)}
      okText="Close"
      footer={undefined}
    >
      <Typography.Text type="secondary">Form fields will be connected to Teaching Hours APIs later.</Typography.Text>
    </Modal>
  )

  const handleApplyShadowing = async (values: any) => {
    try {
      await applyShadowingMutation.mutateAsync(values)
      setApplyShadowingOpen(false)
      applyForm.resetFields()
    } catch (e: any) {
      // Error handled by mutation
    }
  }

  const applyShadowingModal = (
    <Modal
      open={applyShadowingOpen}
      title="Apply for Job Shadowing"
      onCancel={() => setApplyShadowingOpen(false)}
      onOk={() => applyForm.submit()}
      confirmLoading={applyShadowingMutation.isPending}
      destroyOnClose
    >
      <Form form={applyForm} layout="vertical" onFinish={handleApplyShadowing} initialValues={{ discipline: 'medicine' }}>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 'var(--cd-spacing-4)' }}>
          Request clinician shadowing in a specific discipline. Applications are reviewed by the Department Head.
        </Typography.Text>
        <Form.Item
          name="discipline"
          label="Target Discipline"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="medicine">Medicine</Select.Option>
            <Select.Option value="nursing">Nursing</Select.Option>
            <Select.Option value="allied_health">Allied Health</Select.Option>
            <Select.Option value="training">Training</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="reason"
          label="Reason for Request"
          rules={[{ required: true, message: 'Please provide a short reason' }]}
        >
          <Input.TextArea rows={4} placeholder="E.g., Interested in observing advanced cardiac procedures..." />
        </Form.Item>
      </Form>
    </Modal>
  )

  const pendingBatchHeader: PendingSurveyBatch = data.pendingSurveyBatch

  return (
    <>
      <div className="cd-student-grid">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-10)' }}>
          <MyPostingsSection />
          <div id="welcome">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-3)' }}>
              <Typography.Title style={{ margin: 0 }} level={2}>
                Good Morning, {data.displayName}
              </Typography.Title>
              <Typography.Paragraph style={{ margin: 0 }}>
                Current Posting:{' '}
                <Typography.Text style={{ color: 'var(--cd-primary)' }} strong>
                  {data.currentPostingLabel} ({data.currentPostingPhaseLabel})
                </Typography.Text>
              </Typography.Paragraph>

              <Card
                className="clinical-shadow"
                style={{
                  borderRadius: 'var(--cd-rounded-md)',
                  background: 'var(--cd-surface-container-low)',
                  boxShadow: 'var(--cd-shadow-standard)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cd-spacing-4)' }}>
                  <div
                    style={{
                      width: 'var(--cd-spacing-10)',
                      height: 'var(--cd-spacing-10)',
                      borderRadius: 'var(--cd-rounded-md)',
                      background: 'var(--cd-surface-container-highest)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: 'var(--cd-primary)' }}>
                      school
                    </span>
                  </div>
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block' }}>
                      Institution
                    </Typography.Text>
                    <Typography.Text strong>National University of Singapore (NUS)</Typography.Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div id="schedule">
            <Card
              style={{
                border: 'none',
                borderRadius: 'var(--cd-rounded-md)',
                background: 'var(--cd-surface-container-lowest)',
                boxShadow: 'var(--cd-shadow-standard)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--cd-spacing-4)',
                  background: 'var(--cd-surface-container-low)',
                  borderRadius: 'var(--cd-rounded-md) var(--cd-rounded-md) 0 0',
                }}
              >
                <Typography.Title level={4} style={{ margin: 0 }}>
                  <span className="material-symbols-outlined" style={{ marginRight: 'var(--cd-spacing-3)' }}>
                    calendar_today
                  </span>
                  My Schedule
                </Typography.Title>
                <Typography.Text type="secondary" style={{ textTransform: 'uppercase' }}>
                  {data.rotationRotationMeta}
                </Typography.Text>
              </div>

              <div style={{ padding: 'var(--cd-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-10)' }}>
                <div
                  style={{
                    borderLeft: `var(--cd-rounded-md) solid var(--cd-primary)`,
                    background: 'var(--cd-surface-container-low)',
                    padding: 'var(--cd-spacing-4)',
                    borderTopRightRadius: 'var(--cd-rounded-md)',
                    borderBottomRightRadius: 'var(--cd-rounded-md)',
                  }}
                >
                  <Typography.Text
                    style={{ display: 'block', color: 'var(--cd-primary)', fontWeight: 700, textTransform: 'uppercase' }}
                  >
                    {data.rotation.activeRotationLabel}
                  </Typography.Text>

                  <Typography.Title level={4} style={{ marginTop: 'var(--cd-spacing-3)', marginBottom: 'var(--cd-spacing-4)' }}>
                    {data.rotation.unitName}
                  </Typography.Title>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cd-spacing-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cd-spacing-4)' }}>
                      <div
                        style={{
                          width: 'var(--cd-spacing-10)',
                          height: 'var(--cd-spacing-10)',
                          borderRadius: 'var(--cd-rounded-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          alt="Lead tutor avatar"
                          src={data.rotation.leadTutorAvatarUrl}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ display: 'block' }}>
                          Lead Tutor
                        </Typography.Text>
                        <Typography.Text strong>{data.rotation.leadTutorName}</Typography.Text>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cd-spacing-4)' }}>
                      <div
                        style={{
                          width: 'var(--cd-spacing-10)',
                          height: 'var(--cd-spacing-10)',
                          borderRadius: 'var(--cd-rounded-full)',
                          background: 'var(--cd-secondary)',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ color: 'var(--cd-on-tertiary-container)' }}>
                          location_on
                        </span>
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ display: 'block' }}>
                          Location
                        </Typography.Text>
                        <Typography.Text strong>{data.rotation.location}</Typography.Text>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Typography.Text
                    type="secondary"
                    style={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginBottom: 'var(--cd-spacing-4)' }}
                  >
                    Today's Agenda
                  </Typography.Text>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-3)' }}>
                    {data.agendaItems.map((item) => (
                      <div
                        key={item.id}
                        className="cd-student-timeline-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedAgenda(item)
                          setAgendaOpen(true)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedAgenda(item)
                            setAgendaOpen(true)
                          }
                        }}
                      >
                        <Typography.Text
                          style={{
                            minWidth: 'var(--cd-spacing-12)',
                            fontWeight: 800,
                            color: 'var(--cd-primary)',
                          }}
                        >
                          {item.time}
                        </Typography.Text>
                        <div style={{ flex: 1 }}>
                          <Typography.Text strong>{item.title}</Typography.Text>
                          <Typography.Text type="secondary" style={{ display: 'block' }}>
                            {item.meetingPoint}
                          </Typography.Text>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: 'var(--cd-on-surface-variant)' }}>
                          chevron_right
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div id="teaching-history">
            <Card
              style={{
                marginTop: 'var(--cd-spacing-10)',
                border: 'none',
                borderRadius: 'var(--cd-rounded-md)',
                background: 'var(--cd-surface-container-lowest)',
                boxShadow: 'var(--cd-shadow-standard)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--cd-spacing-4)' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  <span className="material-symbols-outlined" style={{ marginRight: 'var(--cd-spacing-3)' }}>
                    history
                  </span>
                  Teaching History
                </Typography.Title>
                <Button type="link" onClick={() => navigate('/dashboard/my-sessions')} style={{ fontWeight: 700 }}>
                  View All Logbook
                </Button>
              </div>

              <div style={{ padding: 'var(--cd-spacing-4)' }}>
                <Table<TeachingHistoryRow>
                  rowKey="id"
                  columns={teachingHistoryColumns}
                  dataSource={data.teachingHistoryRows}
                  pagination={false}
                  size="middle"
                />
              </div>
            </Card>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-10)' }}>
          <div id="pending-surveys">
            <div
              style={{
                backgroundImage: 'var(--cd-primary-gradient)',
                borderRadius: 'var(--cd-rounded-md)',
                padding: 'var(--cd-spacing-3)',
                boxShadow: 'var(--cd-shadow-standard)',
              }}
            >
              <Card
                style={{
                  border: 'none',
                  background: 'var(--cd-surface-container-lowest)',
                  borderRadius: 'var(--cd-rounded-md)',
                  boxShadow: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cd-spacing-3)', marginBottom: 'var(--cd-spacing-4)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--cd-tertiary)' }}>
                    rate_review
                  </span>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Survey Pulse
                  </Typography.Title>
                </div>

                <Typography.Paragraph type="secondary" style={{ marginBottom: 'var(--cd-spacing-10)' }}>
                  {pendingBatchHeader.description}
                </Typography.Paragraph>

                <div style={{ background: 'var(--cd-tertiary-container)', padding: 'var(--cd-spacing-4)', borderRadius: 'var(--cd-rounded-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--cd-spacing-3)' }}>
                    <Typography.Text strong>{pendingBatchHeader.title}</Typography.Text>
                    <span
                      style={{
                        background: 'var(--cd-error)',
                        color: 'var(--cd-on-error)',
                        borderRadius: 'var(--cd-rounded-full)',
                        paddingInline: 'var(--cd-spacing-3)',
                        paddingBlock: 0,
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        fontSize: 'var(--cd-font-size-label-sm)',
                      }}
                    >
                      {pendingBatchHeader.statusLabel}
                    </span>
                  </div>

                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 'var(--cd-spacing-4)' }}>
                    Includes interactions with Dr. Chen and Dr. Lim (3 sessions).
                  </Typography.Text>

                  <Button
                    style={{
                      width: '100%',
                      background: 'var(--cd-tertiary)',
                      color: 'var(--cd-on-tertiary-container)',
                      border: 'none',
                      borderRadius: 'var(--cd-rounded-md)',
                      fontWeight: 800,
                    }}
                    onClick={() => setBatchOpen(true)}
                  >
                    {pendingBatchHeader.actionLabel}{' '}
                    <span className="material-symbols-outlined" style={{ marginLeft: 'var(--cd-spacing-3)' }}>
                      arrow_forward
                    </span>
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <div id="posting-progress">
            <Card
              style={{
                border: 'none',
                borderRadius: 'var(--cd-rounded-md)',
                background: 'var(--cd-surface-container-lowest)',
                boxShadow: 'var(--cd-shadow-standard)',
              }}
            >
              <Typography.Title level={4} style={{ margin: 0, marginBottom: 'var(--cd-spacing-10)' }}>
                <span className="material-symbols-outlined" style={{ marginRight: 'var(--cd-spacing-3)' }}>
                  analytics
                </span>
                Posting Progress
              </Typography.Title>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cd-spacing-10)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--cd-spacing-3)' }}>
                    <Typography.Text type="secondary">Teaching Hours Logged</Typography.Text>
                    <Typography.Text style={{ color: 'var(--cd-primary)', fontWeight: 900 }}>
                      {data.postingProgress.teachingHoursLogged} / {data.postingProgress.teachingHoursTotal}h
                    </Typography.Text>
                  </div>
                  <Progress
                    percent={(data.postingProgress.teachingHoursLogged / data.postingProgress.teachingHoursTotal) * 100}
                    strokeColor="var(--cd-primary)"
                    trailColor="var(--cd-surface-container-highest)"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--cd-spacing-3)' }}>
                    <Typography.Text type="secondary">Feedback Rate</Typography.Text>
                    <Typography.Text style={{ color: 'var(--cd-tertiary)', fontWeight: 900 }}>
                      {data.postingProgress.feedbackRatePercent}%
                    </Typography.Text>
                  </div>
                  <Progress
                    percent={data.postingProgress.feedbackRatePercent}
                    strokeColor="var(--cd-tertiary)"
                    trailColor="var(--cd-surface-container-highest)"
                  />
                </div>
              </div>
            </Card>
          </div>

          <div id="clinical-insight">
            <div
              style={{
                background: 'color-mix(in srgb, var(--cd-primary) 30%, var(--cd-surface-container-lowest) 70%)',
                borderRadius: 'var(--cd-rounded-md)',
                boxShadow: 'var(--cd-shadow-standard)',
                padding: 'var(--cd-spacing-4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--cd-spacing-3)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--cd-primary)' }}>
                  tips_and_updates
                </span>
                <div>
                  <Typography.Text style={{ display: 'block', fontWeight: 900 }}>
                    {data.clinicalInsight.title}
                  </Typography.Text>
                  <Typography.Text type="secondary">{data.clinicalInsight.description}</Typography.Text>
                </div>
              </div>
            </div>
          </div>

          <div id="quick-actions">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cd-spacing-4)' }}>
              {data.quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="cd-student-quick-action-tile"
                  onClick={() => {
                    if (action.title === 'Apply Shadowing') {
                      setApplyShadowingOpen(true)
                    } else {
                      setSelectedQuickActionTitle(action.title)
                      setQuickActionOpen(true)
                    }
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--cd-primary)' }}>
                    {action.icon}
                  </span>
                  <Typography.Text style={{ textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.02em', fontSize: 'var(--cd-font-size-label-sm)' }}>
                    {action.title}
                  </Typography.Text>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {agendaModal}
      {logbookModal}
      {batchModal}
      {quickActionModal}
      {logHoursModal}
      {applyShadowingModal}
    </>
  )
}

function MyPostingsSection() {
  const accessToken = useAuth((s) => s.accessToken)
  const pq = usePostingsList(accessToken, { limit: 20, offset: 0 })
  const rows = pq.data?.items ?? []

  return (
    <div id="my-postings">
      <Card
        style={{
          border: 'none',
          borderRadius: 'var(--cd-rounded-md)',
          background: 'var(--cd-surface-container-lowest)',
          boxShadow: 'var(--cd-shadow-standard)',
        }}
      >
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          My postings
        </Typography.Title>
        {pq.isLoading ? (
          <Spin />
        ) : (
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={rows}
            columns={[
              { title: 'Title', dataIndex: 'title', key: 'title' },
              { title: 'Status', dataIndex: 'status', key: 'status' },
              { title: 'Start', dataIndex: 'start_date', key: 'sd' },
              { title: 'End', dataIndex: 'end_date', key: 'ed' },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

