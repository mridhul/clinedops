import { Button, Card, Form, Input, Select, Space, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useAcademicCycles } from '../../api/academicCycles'
import { useDepartments } from '../../api/departments'
import { usePostingsList } from '../../api/postings'
import { usePreviewBroadcast, useSendBroadcast } from '../../api/notifications'

const { Title, Text } = Typography

type TargetRole = 'student' | 'tutor'
type Discipline = 'medicine' | 'allied_health' | 'nursing' | 'training'

type FormValues = {
  title: string
  message: string
  target_role: TargetRole
  discipline?: Discipline
  academic_cycle_id?: string
  department_id?: string
  posting_id?: string
}

export default function BroadcastForm() {
  const accessToken = useAuth((s) => s.accessToken)
  const [form] = Form.useForm<FormValues>()
  const [previewCount, setPreviewCount] = useState<number | null>(null)

  const discipline = Form.useWatch('discipline', form)

  const { data: cycles, isLoading: cyclesLoading } = useAcademicCycles(accessToken)
  const { data: departments, isLoading: departmentsLoading } = useDepartments(accessToken, {
    discipline,
    limit: 200,
    offset: 0,
  })
  const { data: postings, isLoading: postingsLoading } = usePostingsList(accessToken, {
    discipline,
    limit: 50,
    offset: 0,
  })

  const previewMutation = usePreviewBroadcast()
  const sendMutation = useSendBroadcast()

  const cycleOptions = useMemo(
    () => (cycles?.items ?? []).map((c) => ({ label: c.name, value: c.id })),
    [cycles?.items],
  )
  const deptOptions = useMemo(
    () => (departments?.items ?? []).map((d) => ({ label: d.name, value: d.id })),
    [departments?.items],
  )
  const postingOptions = useMemo(
    () => (postings?.items ?? []).map((p) => ({ label: p.title, value: p.id })),
    [postings?.items],
  )

  const handlePreview = async () => {
    try {
      const values = await form.validateFields()
      const res = await previewMutation.mutateAsync(values)
      setPreviewCount(res.matched_count)
      if (res.matched_count === 0) {
        message.warning('No recipients matched. Try different filters or ensure users exist for that role.')
      } else {
        message.success(`Matched ${res.matched_count} user(s).`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Preview failed'
      message.error(msg)
    }
  }

  const handleSend = async () => {
    try {
      const values = await form.validateFields()
      const res = await sendMutation.mutateAsync(values)
      if (res.sent_count === 0) {
        message.warning('No notifications were sent — zero recipients matched.')
      } else {
        message.success(`Broadcast sent to ${res.sent_count} user(s).`)
      }
      setPreviewCount(null)
      form.resetFields()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Send failed'
      message.error(msg)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Admin Broadcasts
          </Title>
          <Text type="secondary">
            Send in-app announcements to student or tutor groups. Only super admins can send. Recipients are all
            active users in the selected role (optional filters narrow by profile or posting).
          </Text>
        </div>

        <Card>
          <Form<FormValues>
            form={form}
            layout="vertical"
            initialValues={{ target_role: 'student' }}
            onValuesChange={() => setPreviewCount(null)}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Title is required' }]}
            >
              <Input maxLength={100} placeholder="e.g., Mandatory App Update" />
            </Form.Item>

            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: 'Message is required' }]}
            >
              <Input.TextArea rows={4} maxLength={2000} placeholder="Type your announcement here..." />
            </Form.Item>

            <Space size="large" wrap style={{ width: '100%' }}>
              <Form.Item name="target_role" label="Target Role" rules={[{ required: true }]}>
                <Select
                  style={{ minWidth: 220 }}
                  options={[
                    { label: 'Students', value: 'student' },
                    { label: 'Tutors', value: 'tutor' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="discipline" label="Discipline (optional)">
                <Select
                  allowClear
                  style={{ minWidth: 220 }}
                  options={[
                    { label: 'Medicine', value: 'medicine' },
                    { label: 'Allied Health', value: 'allied_health' },
                    { label: 'Nursing', value: 'nursing' },
                    { label: 'Training', value: 'training' },
                  ]}
                />
              </Form.Item>
            </Space>

            <Space size="large" wrap style={{ width: '100%' }}>
              <Form.Item name="academic_cycle_id" label="Academic Cycle (optional)">
                <Select
                  allowClear
                  loading={cyclesLoading}
                  style={{ minWidth: 260 }}
                  options={cycleOptions}
                />
              </Form.Item>

              <Form.Item name="department_id" label="Department (optional)">
                <Select
                  allowClear
                  loading={departmentsLoading}
                  style={{ minWidth: 260 }}
                  options={deptOptions}
                />
              </Form.Item>
            </Space>

            <Form.Item name="posting_id" label="Posting (optional)">
              <Select
                allowClear
                loading={postingsLoading}
                options={postingOptions}
                placeholder="Select a posting to target (optional)"
              />
            </Form.Item>

            <Space>
              <Button onClick={handlePreview} loading={previewMutation.isPending}>
                Preview Recipients
              </Button>
              <Button
                type="primary"
                onClick={handleSend}
                loading={sendMutation.isPending}
                disabled={previewCount === 0}
              >
                Send Broadcast
              </Button>
              {previewCount !== null && <Text type="secondary">Matched: {previewCount}</Text>}
            </Space>
          </Form>
        </Card>
      </Space>
    </div>
  )
}
