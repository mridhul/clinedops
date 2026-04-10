import { Button, DatePicker, Form, Input, Select, Typography, notification, Card } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'

import { useAuth } from '../../auth/useAuth'
import { useAcademicCycles } from '../../api/academicCycles'
import { useDepartments } from '../../api/departments'
import { useCreatePosting, usePostingDetail, useUpdatePosting } from '../../api/postings'
import { useStudentsList } from '../../api/students'
import { useTutorsList } from '../../api/tutors'

export default function PostingFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const accessToken = useAuth((s) => s.accessToken)
  const profile = useAuth((s) => s.profile)
  const isEdit = Boolean(id)
  const detail = usePostingDetail(accessToken, isEdit ? id : undefined)
  const create = useCreatePosting(accessToken)
  const update = useUpdatePosting(accessToken, id ?? '')
  const cycles = useAcademicCycles(accessToken)
  const depts = useDepartments(accessToken, {})
  const students = useStudentsList(accessToken, { limit: 200, offset: 0 })
  const tutors = useTutorsList(accessToken, { limit: 200, offset: 0 })
  const [form] = Form.useForm()

  useEffect(() => {
    if (isEdit && detail.data) {
      form.setFieldsValue({
        title: detail.data.title,
        status: detail.data.status,
        start_date: detail.data.start_date ? dayjs(detail.data.start_date) : undefined,
        end_date: detail.data.end_date ? dayjs(detail.data.end_date) : undefined,
        tutor_ids: detail.data.tutor_ids,
      })
    } else if (!isEdit && profile?.discipline) {
      form.setFieldsValue({ discipline: profile.discipline })
    }
  }, [isEdit, detail.data, form, profile?.discipline])

  const onFinish = async (values: Record<string, any>) => {
    try {
      const body = {
        title: values.title,
        student_id: values.student_id,
        academic_cycle_id: values.academic_cycle_id,
        department_id: values.department_id,
        discipline: values.discipline,
        tutor_ids: values.tutor_ids ?? [],
        start_date: values.start_date ? (values.start_date as any).format('YYYY-MM-DD') : null,
        end_date: values.end_date ? (values.end_date as any).format('YYYY-MM-DD') : null,
      }
      if (isEdit) {
        await update.mutateAsync({
          title: body.title,
          start_date: body.start_date,
          end_date: body.end_date,
          status: values.status,
          tutor_ids: body.tutor_ids,
        })
        notification.success({ message: 'Posting updated successfully' })
      } else {
        await create.mutateAsync(body)
        notification.success({ message: 'Posting created successfully' })
      }
      navigate('/dashboard/postings')
    } catch (err: any) {
      notification.error({
        message: 'Failed to save posting',
        description: err.message || 'An unexpected error occurred',
      })
    }
  }

  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Typography.Title level={3} className="mb-6">{isEdit ? 'Edit posting' : 'Create posting'}</Typography.Title>
      <Card className="border-none shadow-sm">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Clinical Rotation 2024" />
          </Form.Item>
          {!isEdit ? (
            <>
              <Form.Item name="student_id" label="Student" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="Select a student"
                  optionFilterProp="label"
                  options={(students.data?.items ?? []).map((s) => ({
                    value: s.id,
                    label: `${s.student_code} — ${s.email}`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="academic_cycle_id" label="Academic cycle" rules={[{ required: true }]}>
                <Select
                  placeholder="Select an academic cycle"
                  options={(cycles.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>
              <Form.Item name="department_id" label="Department" rules={[{ required: true }]}>
                <Select
                  placeholder="Select a department"
                  options={(depts.data?.items ?? []).map((d) => ({ value: d.id, label: `${d.name} (${d.discipline})` }))}
                />
              </Form.Item>
              <Form.Item name="discipline" label="Discipline" rules={[{ required: true }]}>
                <Select
                  disabled={!isSuperAdmin && !isEdit}
                  placeholder="Select discipline"
                  options={[
                    { value: 'medicine', label: 'Medicine' },
                    { value: 'allied_health', label: 'Allied Health' },
                    { value: 'nursing', label: 'Nursing' },
                    { value: 'training', label: 'Training' },
                  ]}
                />
              </Form.Item>
            </>
          ) : (
            <Form.Item name="status" label="Status">
              <Select
                placeholder="Select status"
                options={[
                  { value: 'active', label: 'active' },
                  { value: 'cancelled', label: 'cancelled' },
                  { value: 'completed', label: 'completed' },
                ]}
              />
            </Form.Item>
          )}
          <Form.Item name="tutor_ids" label="Tutors">
            <Select mode="multiple" placeholder="Assign tutors" options={(tutors.data?.items ?? []).map((t) => ({ value: t.id, label: t.email }))} />
          </Form.Item>
          <Form.Item name="start_date" label="Start date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="End date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item className="mb-0 mt-8">
            <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending} size="large" className="w-full sm:w-auto">
              {isEdit ? 'Save Changes' : 'Create Posting'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
