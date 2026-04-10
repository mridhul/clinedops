import { Button, Form, Input, Select, Typography, notification, Card } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useCreateStudent, useStudentDetail, useUpdateStudent } from '../../api/students'

export default function StudentFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const accessToken = useAuth((s) => s.accessToken)
  const profile = useAuth((s) => s.profile)
  const isEdit = Boolean(id)
  const detail = useStudentDetail(accessToken, isEdit ? id : undefined)
  const create = useCreateStudent(accessToken)
  const update = useUpdateStudent(accessToken, id ?? '')

  const [form] = Form.useForm()

  useEffect(() => {
    if (detail.data) {
      form.setFieldsValue({
        email: detail.data.email,
        full_name: detail.data.full_name,
        student_code: detail.data.student_code,
        institution: detail.data.institution,
        discipline: detail.data.discipline,
        lifecycle_status: detail.data.lifecycle_status,
      })
    } else if (!isEdit) {
      const defaultValues: Record<string, any> = { lifecycle_status: 'pending_onboarding' }
      if (profile?.discipline) {
        defaultValues.discipline = profile.discipline
      }
      form.setFieldsValue(defaultValues)
    }
  }, [detail.data, form, isEdit, profile?.discipline])

  const onFinish = async (values: Record<string, any>) => {
    try {
      if (isEdit) {
        await update.mutateAsync({
          full_name: values.full_name,
          institution: values.institution,
          // discipline is disabled for non-super-admins in edit mode; read directly from form state
          discipline: isSuperAdmin ? values.discipline : form.getFieldValue('discipline'),
          lifecycle_status: values.lifecycle_status,
        })
        notification.success({ message: 'Student updated successfully' })
        navigate(`/dashboard/students/${id}`)
      } else {
        await create.mutateAsync({
          email: values.email,
          password: values.password,
          full_name: values.full_name,
          student_code: values.student_code,
          institution: values.institution,
          discipline: values.discipline,
          lifecycle_status: values.lifecycle_status ?? 'pending_onboarding',
        })
        notification.success({ message: 'Student created successfully' })
        navigate('/dashboard/students')
      }
    } catch (err: any) {
      notification.error({
        message: 'Failed to save student',
        description: err.message || 'An unexpected error occurred',
      })
    }
  }

  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Typography.Title level={3} className="mb-6">{isEdit ? 'Edit student' : 'Add student'}</Typography.Title>
      <Card className="border-none shadow-sm">
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          onFinishFailed={(errorInfo) => {
            console.error('Validation failed:', errorInfo);
            notification.error({
              message: 'Validation Error',
              description: 'Please check the form fields for errors.',
            });
          }}
        >
          {!isEdit ? (
            <>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="Enter student email" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password placeholder="Create a temporary password" />
              </Form.Item>
              <Form.Item name="student_code" label="Student code" rules={[{ required: true }]}>
                <Input placeholder="e.g. STU1001" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="full_name" label="Full name">
            <Input placeholder="First and last name" />
          </Form.Item>
          <Form.Item name="institution" label="Institution">
            <Input placeholder="University or college" />
          </Form.Item>
          <Form.Item name="discipline" label="Discipline" rules={isEdit ? [] : [{ required: true, message: 'Please select a discipline' }]}>
            <Select
              disabled={isEdit ? !isSuperAdmin : false}
              placeholder="Select discipline"
              options={[
                { value: 'medicine', label: 'Medicine' },
                { value: 'allied_health', label: 'Allied Health' },
                { value: 'nursing', label: 'Nursing' },
                { value: 'training', label: 'Training' },
              ]}
            />
          </Form.Item>
          <Form.Item name="lifecycle_status" label="Lifecycle status" rules={[{ required: true }]}>
            <Select
              placeholder="Select status"
              options={[
                { value: 'pending_onboarding', label: 'Pending Onboarding' },
                { value: 'active_posting', label: 'Active Posting' },
                { value: 'completed', label: 'Completed' },
                { value: 'offboarded', label: 'Offboarded' },
              ]}
            />
          </Form.Item>
          <Form.Item className="mb-0 mt-8">
            <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending} size="large" className="w-full sm:w-auto">
              {isEdit ? 'Save Changes' : 'Create Student'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
