import { Button, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeachingSessions } from '../../api/teachingHours'
import type { TeachingSessionOut } from '../../types/teachingHours'
import PageState from '../../components/common/PageState'

const { Title, Text } = Typography

export default function BillingHoursPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useTeachingSessions({ status: 'approved', limit: 200 })

  const billableItems = useMemo(() => {
    const items = data?.items ?? []
    return items.filter((s) => (s.billable_minutes ?? 0) > 0 || !!s.billable_amount)
  }, [data?.items])

  const columns: ColumnsType<TeachingSessionOut> = [
    {
      title: 'Date',
      dataIndex: 'starts_at',
      key: 'starts_at',
      render: (val: string) => dayjs(val).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Tutor',
      dataIndex: 'tutor_id',
      key: 'tutor_id',
      render: (val: string) => <Text>{val?.substring(0, 8)}</Text>,
    },
    {
      title: 'Billable',
      key: 'billable',
      render: (_, record) => {
        const mins = record.billable_minutes ?? 0
        const hours = Math.round((mins / 60) * 10) / 10
        return (
          <Space direction="vertical" size={0}>
            <Text>{mins} min</Text>
            <Text type="secondary">{hours} h</Text>
          </Space>
        )
      },
    },
    {
      title: 'Amount',
      dataIndex: 'billable_amount',
      key: 'billable_amount',
      render: (val: string | null) => (val ? <Tag color="green">{val} SGD</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Session Duration',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (val: number | null) => (val != null ? `${val} min` : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" onClick={() => navigate(`/dashboard/teaching-sessions/${record.id}`)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          Billing Hours
        </Title>
      </div>

      <PageState loading={isLoading} error={null} isEmpty={!isLoading && billableItems.length === 0}>
        <Table columns={columns} dataSource={billableItems} rowKey="id" scroll={{ x: 'max-content' }} />
      </PageState>
    </div>
  )
}

