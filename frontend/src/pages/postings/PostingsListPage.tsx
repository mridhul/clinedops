import { Card, DatePicker, Form, Radio, Select, Space, Table, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { usePostingsList } from '../../api/postings'
import type { PostingOut } from '../../types/lifecycle'
import PageState from '../../components/common/PageState'

export default function PostingsListPage() {
  const accessToken = useAuth((s) => s.accessToken)
  const [view, setView] = useState<'table' | 'calendar'>('table')
  const [discipline, setDiscipline] = useState<string | undefined>()
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const date_from = range?.[0]?.format('YYYY-MM-DD')
  const date_to = range?.[1]?.format('YYYY-MM-DD')

  const q = usePostingsList(accessToken, {
    discipline,
    date_from,
    date_to,
    limit: 200,
    offset: 0,
  })

  const columns = useMemo(
    () => [
      { title: 'Title', dataIndex: 'title', key: 'title' },
      { title: 'Status', dataIndex: 'status', key: 'status' },
      { title: 'Start', dataIndex: 'start_date', key: 'sd' },
      { title: 'End', dataIndex: 'end_date', key: 'ed' },
      {
        title: 'Actions',
        key: 'a',
        render: (_: unknown, row: PostingOut) => {
          const profile = useAuth.getState().profile
          if (profile?.role === 'super_admin' || profile?.role === 'programme_admin') {
            return <Link to={`/dashboard/postings/${row.id}/edit`}>Edit</Link>
          }
          return null
        },
      },
    ],
    [],
  )

  return (
    <>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Typography.Title level={2} style={{ margin: 0 }} className="!font-manrope">
          Postings
        </Typography.Title>
        {(useAuth.getState().profile?.role === 'super_admin' || useAuth.getState().profile?.role === 'programme_admin') && (
          <Link to="/dashboard/postings/new">
            <Typography.Link>Create posting</Typography.Link>
          </Link>
        )}
      </Space>

      <Form 
        layout="inline" 
        style={{ marginBottom: 16 }}
        className="clinical-filter-form"
      >
        <Form.Item label="View">
          <Radio.Group value={view} onChange={(e) => setView(e.target.value)}>
            <Radio.Button value="table">Table</Radio.Button>
            <Radio.Button value="calendar">Calendar</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="Discipline">
          <Select
            allowClear
            style={{ minWidth: 140 }}
            placeholder="All"
            value={discipline}
            onChange={(v) => setDiscipline(v)}
            options={[
              { value: 'medicine', label: 'Medicine' },
              { value: 'allied_health', label: 'Allied Health' },
              { value: 'nursing', label: 'Nursing' },
              { value: 'training', label: 'Training' },
            ]}
            className="w-full md:w-auto"
          />
        </Form.Item>
        <Form.Item label="Date range">
          <DatePicker.RangePicker value={range ?? undefined} onChange={(v) => setRange(v)} className="w-full md:w-auto" />
        </Form.Item>
      </Form>

      <PageState
        loading={q.isLoading}
        error={q.error}
        isEmpty={!q.isLoading && !q.data?.items.length}
        onRetry={() => q.refetch()}
      >
        {view === 'table' ? (
          <Table<PostingOut>
            rowKey="id"
            columns={columns}
            dataSource={q.data?.items ?? []}
            scroll={{ x: 'max-content' }}
            pagination={false}
          />
        ) : (
          <Card title="Calendar-style list (same data, compact)">
            <Table<PostingOut>
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={q.data?.items ?? []}
              scroll={{ x: 'max-content' }}
              pagination={false}
            />
          </Card>
        )}
      </PageState>
    </>
  )
}
