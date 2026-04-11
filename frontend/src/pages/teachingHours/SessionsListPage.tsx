import { Badge, Button, Input, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorsList } from '../../api/tutors'
import { useApproveSession, useRejectSession, useSubmitSession, useTeachingSessions } from '../../api/teachingHours'
import type { TeachingSessionOut } from '../../types/teachingHours'
import PageState from '../../components/common/PageState'

import { useAuth } from '../../auth/useAuth'

const { Title } = Typography

export default function SessionsListPage() {
  const profile = useAuth((s) => s.profile)
  const accessToken = useAuth((s) => s.accessToken)
  const canApprove = profile?.role === 'supervisor' || profile?.role === 'programme_admin' || profile?.role === 'super_admin'
  const isTutor = profile?.role === 'tutor'
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('1')
  const [tutorFilterId, setTutorFilterId] = useState<string | undefined>()
  const [studentSearch, setStudentSearch] = useState<string | undefined>()

  const { data: tutorsData, isLoading: tutorsLoading } = useTutorsList(
    canApprove ? accessToken : null,
    { limit: 200, active_only: true },
  )

  const { data, isLoading } = useTeachingSessions({
    status: activeTab === '2' ? 'submitted' : undefined,
    tutor_id: tutorFilterId,
    student_search: isTutor ? studentSearch : undefined,
  })

  const submitMutation = useSubmitSession()
  const approveMutation = useApproveSession()
  const rejectMutation = useRejectSession()

  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleReject = async () => {
    if (!rejectId || !rejectReason) return
    try {
      await rejectMutation.mutateAsync({ id: rejectId, payload: { reason: rejectReason } })
      setRejectId(null)
      setRejectReason('')
    } catch (e) {
      // Handled by mutation
    }
  }

  const tutorSelectOptions = useMemo(
    () =>
      (tutorsData?.items ?? []).map((t) => ({
        value: t.id,
        label: [t.tutor_code, t.full_name, t.email].filter(Boolean).join(' — '),
      })),
    [tutorsData?.items],
  )

  const columns: ColumnsType<TeachingSessionOut> = [
    {
      title: 'Date',
      dataIndex: 'starts_at',
      key: 'starts_at',
      render: (val: string) => dayjs(val).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Tutor',
      key: 'tutor',
      render: (_: unknown, record: TeachingSessionOut) => {
        const name = record.tutor_full_name?.trim()
        const code = record.tutor_code?.trim()
        if (name && code) return `${name} (${code})`
        if (name) return name
        if (code) return code
        return <Typography.Text type="secondary">—</Typography.Text>
      },
    },
    {
      title: 'Students',
      key: 'students',
      render: (_: unknown, record: TeachingSessionOut) => {
        const parts =
          record.session_students?.map((s) => s.full_name?.trim() || `${s.student_id.slice(0, 8)}…`) ?? []
        if (!parts.length) return <Typography.Text type="secondary">—</Typography.Text>
        const text = parts.join(', ')
        return (
          <Typography.Text ellipsis={{ tooltip: text }} style={{ maxWidth: 240 }}>
            {text}
          </Typography.Text>
        )
      },
    },
    {
      title: 'Type',
      dataIndex: 'session_type',
      key: 'session_type',
      render: (val: string) => <Tag color="blue">{val?.toUpperCase()}</Tag>,
    },
    {
      title: 'Duration',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (val: number) => `${val} min`,
    },
    {
      title: 'Billable',
      key: 'billable_minutes',
      render: (_, record) => {
        const mins = record.billable_minutes ?? 0
        if (!mins) return <Typography.Text type="secondary">—</Typography.Text>
        const hours = Math.round((mins / 60) * 10) / 10
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text>{mins} min</Typography.Text>
            <Typography.Text type="secondary">{hours} h</Typography.Text>
          </Space>
        )
      },
    },
    {
      title: 'Amount',
      dataIndex: 'billable_amount',
      key: 'billable_amount',
      render: (val: string | null) => (val ? <Tag color="green">{val} SGD</Tag> : <Typography.Text type="secondary">—</Typography.Text>),
    },
    {
      title: 'Status',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          draft: 'default',
          submitted: 'processing',
          pending_review: 'processing',
          approved: 'success',
          rejected: 'error',
        }
        return <Badge status={colors[status] as any} text={status.toUpperCase()} />
      },
    },
    {
      title: 'Flags',
      dataIndex: 'is_flagged',
      key: 'is_flagged',
      render: (flagged: boolean) => flagged ? <Tag color="warning">FLAGGED</Tag> : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/dashboard/teaching-sessions/${record.id}`)}>View</Button>
          {(record.approval_status === 'draft' || record.approval_status === 'draft ') && (
            <>
              <Button size="small" onClick={() => navigate(`/dashboard/teaching-sessions/${record.id}/edit`)}>Edit</Button>
              <Button size="small" type="primary" onClick={() => submitMutation.mutate(record.id)}>Submit</Button>
            </>
          )}
          {['submitted', 'submitted ', 'pending_review'].includes(record.approval_status) && canApprove && (
            <>
              <Button size="small" type="primary" ghost onClick={() => approveMutation.mutate(record.id)}>Approve</Button>
              <Button size="small" danger ghost onClick={() => setRejectId(record.id)}>Reject</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const items = [
    {
      key: '1',
      label: 'All Sessions',
      children: (
        <PageState
          loading={isLoading}
          error={null}
          isEmpty={!isLoading && !data?.items.length}
        >
          <Table columns={columns} dataSource={data?.items} rowKey="id" scroll={{ x: 'max-content' }} />
        </PageState>
      ),
    },
    {
      key: '2',
      label: 'Pending Review',
      children: (
        <PageState
          loading={isLoading}
          error={null}
          isEmpty={!isLoading && !data?.items.length}
        >
          <Table columns={columns} dataSource={data?.items} rowKey="id" />
        </PageState>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2} className="!font-manrope">
          Teaching sessions{' '}
          <span className="text-sm font-normal text-muted-foreground font-inter">({profile?.role})</span>
        </Title>
        <Button type="primary" onClick={() => navigate('/dashboard/teaching-sessions/new')}>Log New Session</Button>
      </div>

      {canApprove ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Typography.Text className="text-muted-foreground">Filter by tutor</Typography.Text>
          <Select
            allowClear
            showSearch
            placeholder="All tutors"
            className="min-w-[280px] w-full max-w-md"
            optionFilterProp="label"
            loading={tutorsLoading}
            value={tutorFilterId}
            onChange={(v) => setTutorFilterId(v)}
            options={tutorSelectOptions}
          />
        </div>
      ) : null}

      {isTutor ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Typography.Text className="text-muted-foreground">Filter by student</Typography.Text>
          <Input.Search
            allowClear
            placeholder="Name, email, or student code — press Enter"
            className="max-w-md w-full"
            enterButton
            onSearch={(v) => setStudentSearch(v.trim() || undefined)}
          />
        </div>
      ) : null}

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />

      <Modal
        title="Reject Session"
        open={!!rejectId}
        onOk={handleReject}
        onCancel={() => setRejectId(null)}
        confirmLoading={rejectMutation.isPending}
      >
        <Typography.Text>Please provide a reason for rejection:</Typography.Text>
        <Input.TextArea
          rows={4}
          style={{ marginTop: 8 }}
          value={rejectReason}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection..."
        />
      </Modal>
    </div>
  )
}
