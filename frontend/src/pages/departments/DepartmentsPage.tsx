import { Button, Form, Input, Select, Table, Typography } from 'antd'
import { useState } from 'react'

import { useAuth } from '../../auth/useAuth'
import { useCreateDepartment, useDepartments } from '../../api/departments'
import type { DepartmentOut } from '../../types/lifecycle'

export default function DepartmentsPage() {
  const accessToken = useAuth((s) => s.accessToken)
  const q = useDepartments(accessToken, {})
  const create = useCreateDepartment(accessToken)
  const [name, setName] = useState('')
  const [discipline, setDiscipline] = useState('medicine')

  return (
    <>
      <Typography.Title level={3}>Departments</Typography.Title>
      <Form
        layout="inline"
        style={{ marginBottom: 16 }}
        onFinish={() => void create.mutateAsync({ name, discipline })}
      >
        <Form.Item label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Discipline">
          <Select
            value={discipline}
            onChange={(v) => setDiscipline(v)}
            options={[
              { value: 'medicine', label: 'Medicine' },
              { value: 'allied_health', label: 'Allied Health' },
              { value: 'nursing', label: 'Nursing' },
              { value: 'training', label: 'Training' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={!name}>
            Add department
          </Button>
        </Form.Item>
      </Form>
      <Table<DepartmentOut>
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data?.items ?? []}
        pagination={false}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Discipline', dataIndex: 'discipline' },
          { title: 'Head user', dataIndex: 'head_user_id' },
        ]}
      />
    </>
  )
}
