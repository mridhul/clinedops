import { Alert, Button, Form, Input, Typography, Upload } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useTutorBatchImport } from '../../api/tutors'

type RowResult = { row_number: number; ok: boolean; errors: string[]; data: Record<string, string> }

export default function TutorBatchImportPage() {
  const accessToken = useAuth((s) => s.accessToken)
  const batch = useTutorBatchImport(accessToken)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<RowResult[] | null>(null)
  const [lastMapping, setLastMapping] = useState<Record<string, string>>({})
  const [defaultPassword, setDefaultPassword] = useState('DemoPassword1!')
  const [done, setDone] = useState(false)

  const commit = async (m: Record<string, string>) => {
    if (!file) return
    await batch.mutateAsync({ file, mapping: m, dryRun: false, defaultPassword })
    setDone(true)
  }

  return (
    <>
      <Typography.Title level={3}>Batch import tutors</Typography.Title>
      <Upload
        maxCount={1}
        beforeUpload={(f) => {
          setFile(f)
          return false
        }}
      >
        <Button>Select file</Button>
      </Upload>
      <Typography.Paragraph type="secondary">
        Provide mapping: for each canonical field, type the exact column header from your file. Keys are file headers,
        values are canonical names (email, tutor_code, discipline, full_name, academic_cycle_name).
      </Typography.Paragraph>
      <Form
        layout="vertical"
        onFinish={async (values) => {
          const m: Record<string, string> = {}
          if (values.h_email) m[values.h_email] = 'email'
          if (values.h_code) m[values.h_code] = 'tutor_code'
          if (values.h_disc) m[values.h_disc] = 'discipline'
          if (values.h_name) m[values.h_name] = 'full_name'
          if (values.h_cycle) m[values.h_cycle] = 'academic_cycle_name'
          setLastMapping(m)
          if (!file) return
          const res = (await batch.mutateAsync({
            file,
            mapping: m,
            dryRun: true,
            defaultPassword,
          })) as { rows?: RowResult[] }
          setPreview((res.rows as RowResult[]) ?? null)
        }}
      >
        <Form.Item name="h_email" label="File column header for email" rules={[{ required: true }]}>
          <Input placeholder="e.g. email" />
        </Form.Item>
        <Form.Item name="h_code" label="File column header for tutor_code" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="h_disc" label="File column header for discipline" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="h_name" label="File column header for full_name (optional)">
          <Input />
        </Form.Item>
        <Form.Item name="h_cycle" label="File column header for academic_cycle_name (optional)">
          <Input />
        </Form.Item>
        <Form.Item label="Default password">
          <Input.Password value={defaultPassword} onChange={(e) => setDefaultPassword(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Validate
          </Button>
        </Form.Item>
      </Form>

      {preview ? (
        <>
          <Alert
            type={preview.some((r) => !r.ok) ? 'warning' : 'success'}
            message="Validation result"
            style={{ marginBottom: 16 }}
          />
          <pre style={{ maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(preview, null, 2)}</pre>
          {!preview.some((r) => !r.ok) && !done ? (
            <Button type="primary" style={{ marginTop: 8 }} onClick={() => void commit(lastMapping)}>
              Commit
            </Button>
          ) : null}
        </>
      ) : null}
      {done ? <Alert type="success" message="Import completed" style={{ marginTop: 16 }} /> : null}
      <div style={{ marginTop: 24 }}>
        <Link to="/dashboard/tutors">Back</Link>
      </div>
    </>
  )
}
