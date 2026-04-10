import { Button, Form, Input, Table, Typography } from 'antd'
import { useState } from 'react'

import { useAuth } from '../../auth/useAuth'
import { useAcademicCycles, useCreateAcademicCycle, useUpdateAcademicCycle } from '../../api/academicCycles'
import type { AcademicCycleOut } from '../../types/lifecycle'

export default function AcademicCyclesPage() {
  const accessToken = useAuth((s) => s.accessToken)
  const q = useAcademicCycles(accessToken)
  const create = useCreateAcademicCycle(accessToken)
  const [name, setName] = useState('')

  return (
    <>
      <Typography.Title level={3}>Academic cycles</Typography.Title>
      <Form layout="inline" style={{ marginBottom: 16 }} onFinish={() => void create.mutateAsync({ name, is_current: false })}>
        <Form.Item label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={!name}>
            Add cycle
          </Button>
        </Form.Item>
      </Form>
      <Table<AcademicCycleOut>
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data?.items ?? []}
        pagination={false}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Current', dataIndex: 'is_current', render: (v: boolean) => (v ? 'Yes' : 'No') },
          {
            title: 'Actions',
            key: 'a',
            render: (_: unknown, row: AcademicCycleOut) => (
              <SetActiveButton accessToken={accessToken} cycleId={row.id} />
            ),
          },
        ]}
      />
    </>
  )
}

function SetActiveButton(props: { accessToken: string | null; cycleId: string }) {
  const update = useUpdateAcademicCycle(props.accessToken, props.cycleId)
  return (
    <Button size="small" loading={update.isPending} onClick={() => void update.mutateAsync({ is_current: true })}>
      Set active
    </Button>
  )
}
