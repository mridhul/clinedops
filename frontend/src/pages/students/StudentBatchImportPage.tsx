import { Alert, Button, Form, Input, Steps, Table, Typography, Upload } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useStudentBatchImport } from '../../api/students'

type RowResult = { row_number: number; ok: boolean; errors: string[]; data: Record<string, string> }

export default function StudentBatchImportPage() {
  const accessToken = useAuth((s) => s.accessToken)
  const batch = useStudentBatchImport(accessToken)
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<RowResult[] | null>(null)
  const [defaultPassword, setDefaultPassword] = useState('DemoPassword1!')

  const onMap = (values: Record<string, string>) => {
    const m: Record<string, string> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v) m[k] = v
    }
    setMapping(m)
    setStep(2)
  }

  const runDryRun = async () => {
    if (!file) return
    const res = (await batch.mutateAsync({
      file,
      mapping,
      dryRun: true,
      defaultPassword,
    })) as { rows?: RowResult[] }
    setPreview((res.rows as RowResult[]) ?? null)
    setStep(3)
  }

  const commit = async () => {
    if (!file) return
    await batch.mutateAsync({
      file,
      mapping,
      dryRun: false,
      defaultPassword,
    })
    setStep(4)
  }

  return (
    <>
      <Typography.Title level={3}>Batch import students</Typography.Title>
      <Steps
        style={{ marginBottom: 24 }}
        current={step}
        items={[
          { title: 'Upload' },
          { title: 'Map columns' },
          { title: 'Map confirm' },
          { title: 'Validate' },
          { title: 'Done' },
        ]}
      />

      {step === 0 && (
        <Upload
          maxCount={1}
          beforeUpload={(f) => {
            setFile(f)
            setStep(1)
            return false
          }}
        >
          <Button>Select .csv or .xlsx</Button>
        </Upload>
      )}

      {step === 1 && file ? (
        <Typography.Paragraph>
          File: {file.name}. Enter column headers from your file for each field.
        </Typography.Paragraph>
      ) : null}

      {step >= 1 && step < 2 && file ? (
        <Form
          layout="vertical"
          onFinish={onMap}
          initialValues={{
            email: 'email',
            student_code: 'student_code',
            discipline: 'discipline',
            full_name: 'full_name',
            institution: 'institution',
            lifecycle_status: 'lifecycle_status',
            academic_cycle_name: 'academic_cycle_name',
          }}
        >
          {['email', 'student_code', 'discipline', 'full_name', 'institution', 'lifecycle_status', 'academic_cycle_name'].map(
            (field) => (
              <Form.Item key={field} name={field} label={`Source column for ${field}`}>
                <Input placeholder={`Header in file, e.g. ${field}`} />
              </Form.Item>
            ),
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Next
            </Button>
          </Form.Item>
        </Form>
      ) : null}

      {step === 2 ? (
        <>
          <Typography.Paragraph>Mapping: {JSON.stringify(mapping)}</Typography.Paragraph>
          <Form.Item label="Default password for new accounts">
            <Input.Password value={defaultPassword} onChange={(e) => setDefaultPassword(e.target.value)} />
          </Form.Item>
          <Button type="primary" onClick={() => void runDryRun()}>
            Run validation
          </Button>
        </>
      ) : null}

      {step >= 3 && preview ? (
        <>
          <Alert
            type={preview.some((r) => !r.ok) ? 'warning' : 'success'}
            message={preview.some((r) => !r.ok) ? 'Some rows have errors' : 'All rows valid'}
            style={{ marginBottom: 16 }}
          />
          <Table<RowResult>
            rowKey="row_number"
            dataSource={preview}
            pagination={false}
            columns={[
              { title: 'Row', dataIndex: 'row_number' },
              {
                title: 'OK',
                dataIndex: 'ok',
                render: (v: boolean) => (v ? 'Yes' : 'No'),
              },
              { title: 'Errors', dataIndex: 'errors', render: (e: string[]) => e.join('; ') },
            ]}
          />
          {step === 3 && !preview.some((r) => !r.ok) ? (
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => void commit()}>
              Commit import
            </Button>
          ) : null}
        </>
      ) : null}

      {step === 4 ? (
        <Alert type="success" message="Import completed" />
      ) : null}

      <div style={{ marginTop: 24 }}>
        <Link to="/dashboard/students">Back to students</Link>
      </div>
    </>
  )
}
