import { Badge, Button, Input, Modal, Space, Table, Tabs, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApproveSession, useRejectSession, useSubmitSession, useTeachingSessions } from '../../api/teachingHours'
import type { TeachingSessionOut } from '../../types/teachingHours'
import PageState from '../../components/common/PageState'

import { useAuth } from '../../auth/useAuth'

const { Title } = Typography

export default function SessionsListPage() {
  const profile = useAuth((s) => s.profile)
  const canApprove = profile?.role === 'supervisor' || profile?.role === 'programme_admin' || profile?.role === 'super_admin'
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('1')
  
  const { data, isLoading } = useTeachingSessions({
    status: activeTab === '2' ? 'submitted' : undefined,
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

  const columns: ColumnsType<TeachingSessionOut> = [
    {
      title: 'Date',
      dataIndex: 'starts_at',
      key: 'starts_at',
      render: (val: string) => dayjs(val).format('DD MMM YYYY HH:mm'),
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
        <Title level={2}>Teaching Sessions <span style={{fontSize: 14, color: 'gray'}}>({profile?.role})</span></Title>
        <Button type="primary" onClick={() => navigate('/dashboard/teaching-sessions/new')}>Log New Session</Button>
      </div>

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
