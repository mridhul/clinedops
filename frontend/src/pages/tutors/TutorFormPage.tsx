import { Button, Form, Input, Select, Typography, notification, Card } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useCreateTutor, useTutorDetail, useUpdateTutor } from '../../api/tutors'

export default function TutorFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const accessToken = useAuth((s) => s.accessToken)
  const profile = useAuth((s) => s.profile)
  const isEdit = Boolean(id)
  const detail = useTutorDetail(accessToken, isEdit ? id : undefined)
  const create = useCreateTutor(accessToken)
  const update = useUpdateTutor(accessToken, id ?? '')
  const [form] = Form.useForm()

  useEffect(() => {
    if (detail.data) {
      form.setFieldsValue({
        email: detail.data.email,
        full_name: detail.data.full_name,
        tutor_code: detail.data.tutor_code,
        discipline: detail.data.discipline,
      })
    } else if (!isEdit && profile?.discipline) {
      form.setFieldsValue({ discipline: profile.discipline })
    }
  }, [detail.data, form, isEdit, profile?.discipline])

  const onFinish = async (values: Record<string, any>) => {
    try {
      if (isEdit) {
        await update.mutateAsync({
          full_name: values.full_name,
          discipline: values.discipline,
        })
        notification.success({ message: 'Tutor updated successfully' })
        navigate(`/dashboard/tutors/${id}`)
      } else {
        await create.mutateAsync({
          email: values.email,
          password: values.password,
          full_name: values.full_name,
          tutor_code: values.tutor_code,
          discipline: values.discipline,
        })
        notification.success({ message: 'Tutor created successfully' })
        navigate('/dashboard/tutors')
      }
    } catch (err: any) {
      notification.error({
        message: 'Failed to save tutor',
        description: err.message || 'An unexpected error occurred',
      })
    }
  }

  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Typography.Title level={3} className="mb-6">{isEdit ? 'Edit tutor' : 'Add tutor'}</Typography.Title>
      <Card className="border-none shadow-sm">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {!isEdit ? (
            <>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="Enter tutor email" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password placeholder="Create a temporary password" />
              </Form.Item>
              <Form.Item name="tutor_code" label="Tutor code" rules={[{ required: true }]}>
                <Input placeholder="e.g. TUT2001" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="full_name" label="Full name">
            <Input placeholder="First and last name" />
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
          <Form.Item className="mb-0 mt-8">
            <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending} size="large" className="w-full sm:w-auto">
              {isEdit ? 'Save Changes' : 'Create Tutor'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
