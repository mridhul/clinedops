import { Button, Form, Select, Space, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useTutorsList } from '../../api/tutors'
import type { TutorListItem } from '../../types/lifecycle'
import PageState from '../../components/common/PageState'

export default function TutorsListPage() {
  const accessToken = useAuth((s) => s.accessToken)
  const [discipline, setDiscipline] = useState<string | undefined>()
  const [offset, setOffset] = useState(0)
  const limit = 20
  const q = useTutorsList(accessToken, { discipline, limit, offset })

  const columns = useMemo(
    () => [
      { title: 'Code', dataIndex: 'tutor_code', key: 'code' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Discipline', dataIndex: 'discipline', key: 'discipline' },
      {
        title: 'Actions',
        key: 'a',
        render: (_: unknown, row: TutorListItem) => <Link to={`/dashboard/tutors/${row.id}`}>View</Link>,
      },
    ],
    [],
  )

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Tutors
        </Typography.Title>
        <Space wrap>
          <Link to="/dashboard/tutors/import">
            <Button>Batch Import</Button>
          </Link>
          <Link to="/dashboard/tutors/new">
            <Button type="primary">Add Tutor</Button>
          </Link>
        </Space>
      </Space>
      <Form 
        layout="inline" 
        style={{ marginBottom: 16 }}
        className="clinical-filter-form"
      >
        <Form.Item label="Discipline">
          <Select
            allowClear
            style={{ minWidth: 160 }}
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
      </Form>
      <PageState
        loading={q.isLoading}
        error={q.error}
        isEmpty={!q.isLoading && !q.data?.items.length}
        onRetry={() => q.refetch()}
      >
        <Table<TutorListItem>
          rowKey="id"
          columns={columns}
          dataSource={q.data?.items ?? []}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: Math.floor(offset / limit) + 1,
            pageSize: limit,
            total: q.data?.total ?? 0,
            onChange: (page) => setOffset((page - 1) * limit),
          }}
        />
      </PageState>
    </>
  )
}
