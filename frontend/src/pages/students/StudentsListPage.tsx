import { Button, Form, Input, Select, Space, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useStudentsList } from '../../api/students'
import type { StudentListItem } from '../../types/lifecycle'
import PageState from '../../components/common/PageState'

const disciplines = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'allied_health', label: 'Allied Health' },
  { value: 'nursing', label: 'Nursing' },
  { value: 'training', label: 'Training' },
]

export default function StudentsListPage() {
  const accessToken = useAuth((s) => s.accessToken)
  const [discipline, setDiscipline] = useState<string | undefined>()
  const [institution, setInstitution] = useState<string | undefined>()
  const [lifecycle, setLifecycle] = useState<string | undefined>()
  const [offset, setOffset] = useState(0)
  const limit = 20

  const q = useStudentsList(accessToken, {
    discipline,
    institution: institution || undefined,
    lifecycle_status: lifecycle,
    limit,
    offset,
  })

  const columns = useMemo(
    () => [
      { title: 'Code', dataIndex: 'student_code', key: 'code' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Discipline', dataIndex: 'discipline', key: 'discipline' },
      { title: 'Status', dataIndex: 'lifecycle_status', key: 'lifecycle_status' },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, row: StudentListItem) => (
          <Link to={`/dashboard/students/${row.id}`}>View</Link>
        ),
      },
    ],
    [],
  )

  const exportCsv = () => {
    if (!q.data?.items.length) return
    const headers = ['student_code', 'email', 'discipline', 'lifecycle_status']
    const lines = [headers.join(',')]
    for (const r of q.data.items) {
      lines.push([r.student_code, r.email, r.discipline, r.lifecycle_status].join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'students.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Students
        </Typography.Title>
        <Space wrap>
          <Button onClick={exportCsv}>Export CSV</Button>
          <Link to="/dashboard/students/import">
            <Button>Batch Import</Button>
          </Link>
          <Link to="/dashboard/students/new">
            <Button type="primary">Add Student</Button>
          </Link>
        </Space>
      </Space>

      <Form 
        layout="inline" 
        style={{ marginBottom: 16 }} 
        onFinish={() => setOffset(0)}
        className="clinical-filter-form"
      >
        <Form.Item label="Discipline">
          <Select
            allowClear
            style={{ minWidth: 160 }}
            placeholder="All"
            options={disciplines}
            value={discipline}
            onChange={(v) => setDiscipline(v)}
            className="w-full md:w-auto"
          />
        </Form.Item>
        <Form.Item label="Institution">
          <Input allowClear value={institution} onChange={(e) => setInstitution(e.target.value || undefined)} className="w-full md:w-auto" />
        </Form.Item>
        <Form.Item label="Lifecycle">
          <Select
            allowClear
            style={{ minWidth: 180 }}
            placeholder="All"
            value={lifecycle}
            onChange={(v) => setLifecycle(v)}
            options={[
              { value: 'pending_onboarding', label: 'Pending Onboarding' },
              { value: 'active_posting', label: 'Active Posting' },
              { value: 'completed', label: 'Completed' },
              { value: 'offboarded', label: 'Offboarded' },
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
        <Table<StudentListItem>
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
