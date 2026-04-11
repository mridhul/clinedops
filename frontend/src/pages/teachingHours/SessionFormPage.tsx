import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  TimePicker,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBulkCreateSessions, useCreateSession, useTeachingSession, useUpdateSession } from '../../api/teachingHours'
import { usePostingsList } from '../../api/postings'
import { useStudentsList } from '../../api/students'
import { useAuth } from '../../auth/useAuth'
import type { AnomalyFlag } from '../../types/teachingHours'

const { Title, Text } = Typography

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 'monday' },
  { label: 'Tue', value: 'tuesday' },
  { label: 'Wed', value: 'wednesday' },
  { label: 'Thu', value: 'thursday' },
  { label: 'Fri', value: 'friday' },
  { label: 'Sat', value: 'saturday' },
  { label: 'Sun', value: 'sunday' },
]

export default function SessionFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [isBulk, setIsBulk] = useState(false)
  const [savedFlags, setSavedFlags] = useState<AnomalyFlag[]>([])

  const accessToken = useAuth((s) => s.accessToken)
  const { data: postingsData, isLoading: loadingPostings } = usePostingsList(accessToken, { limit: 100 })
  const { data: studentsData, isLoading: loadingStudents } = useStudentsList(accessToken, { limit: 200 })

  const { data: existing } = useTeachingSession(id)
  const createMutation = useCreateSession()
  const bulkMutation = useBulkCreateSessions()
  const updateMutation = useUpdateSession(id ?? '')

  const isEdit = !!id

  const initialValues = existing
    ? {
        posting_id: existing.posting_id,
        session_type: existing.session_type,
        duration_minutes: existing.duration_minutes,
        description: existing.description,
        student_ids: existing.session_students?.map(s => s.student_id) ?? [],
      }
    : {}

  async function onFinish(values: Record<string, unknown>) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          session_type: values.session_type as 'scheduled' | 'ad_hoc' | 'consultation',
          duration_minutes: values.duration_minutes as number,
          description: values.description as string | undefined,
        })
        navigate('/dashboard/teaching-sessions')
        return
      }

      const startsAt = values.starts_at
        ? (values.starts_at as dayjs.Dayjs).toISOString()
        : new Date().toISOString()

      if (isBulk) {
        await bulkMutation.mutateAsync({
          posting_id: values.posting_id as string,
          session_type: values.session_type as 'scheduled' | 'ad_hoc' | 'consultation',
          duration_minutes: values.duration_minutes as number,
          student_ids: (values.student_ids as string[]) || [],
          description: values.description as string | undefined,
          start_date: (values.bulk_start as dayjs.Dayjs).format('YYYY-MM-DD'),
          end_date: (values.bulk_end as dayjs.Dayjs).format('YYYY-MM-DD'),
          days_of_week: values.days_of_week as string[],
          start_time: (values.bulk_time as dayjs.Dayjs).format('HH:mm'),
        })
      } else {
        const result = await createMutation.mutateAsync({
          posting_id: values.posting_id as string,
          starts_at: startsAt,
          session_type: values.session_type as 'scheduled' | 'ad_hoc' | 'consultation',
          duration_minutes: values.duration_minutes as number,
          student_ids: (values.student_ids as string[]) || [],
          description: values.description as string | undefined,
        })
        if (result.is_flagged) {
          setSavedFlags(result.anomaly_flags)
          return
        }
      }
      navigate('/dashboard/teaching-sessions')
    } catch {
      // errors handled by mutation
    }
  }

  const handlePostingChange = (postingId: string) => {
    const posting = postingsData?.items.find((p) => p.id === postingId)
    if (posting?.student_id) {
      const currentStudents = form.getFieldValue('student_ids') || []
      if (!currentStudents.includes(posting.student_id)) {
        form.setFieldsValue({ student_ids: [...currentStudents, posting.student_id] })
      }
    }
  }

  const loading = createMutation.isPending || bulkMutation.isPending || updateMutation.isPending || loadingPostings || loadingStudents

  const pageTitle = isEdit ? 'Edit session' : isBulk ? 'Create recurring sessions' : 'Log teaching session'

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:py-8">
      <div className="cd-section-lg">
        <Title level={2} className="!mb-2 !font-manrope">
          {pageTitle}
        </Title>
        <Text type="secondary" className="text-sm block max-w-lg">
          Record a teaching encounter or set up a recurring schedule. Fields use your programme defaults until you
          change them.
        </Text>
      </div>

      {savedFlags.length > 0 && (
        <Space direction="vertical" className="w-full mb-6">
          <Alert
            type="warning"
            showIcon
            message="Session saved with anomaly flags"
            description={
              <ul>
                {savedFlags.map((f, i) => (
                  <li key={i}>
                    <strong>{f.type}:</strong> {f.detail}
                  </li>
                ))}
              </ul>
            }
            action={
              <Button size="small" onClick={() => navigate('/dashboard/teaching-sessions')}>
                View Sessions
              </Button>
            }
          />
        </Space>
      )}

      {!isEdit && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Text id="bulk-mode-label" className="text-sm font-medium text-foreground">
            Recurring / bulk mode
          </Text>
          <Switch
            checked={isBulk}
            onChange={setIsBulk}
            id="bulk-toggle"
            aria-labelledby="bulk-mode-label"
          />
        </div>
      )}

      <Card bordered={false} className="glass-card shadow-premium p-6 md:p-8">
        <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onFinish}>
        <Form.Item name="posting_id" label="Posting" rules={[{ required: !isEdit, message: 'Please select a posting' }]}>
          <Select
            size="large"
            placeholder="Select a posting"
            disabled={isEdit}
            id="posting-id-select"
            onChange={handlePostingChange}
            options={postingsData?.items.map((p) => ({
              label: `${p.title} (${p.discipline})`,
              value: p.id,
            }))}
            loading={loadingPostings}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item name="student_ids" label="Students" rules={[{ required: true, message: 'Please select at least one student' }]}>
          <Select
            size="large"
            mode="multiple"
            placeholder="Select students"
            id="students-select"
            options={studentsData?.items.map((s) => ({
              label: `${s.full_name} (${s.student_code})`,
              value: s.id,
            }))}
            loading={loadingStudents}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item name="session_type" label="Session Type" rules={[{ required: true }]}>
          <Select
            size="large"
            id="session-type-select"
            placeholder="Select session type"
            options={[
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Ad Hoc', value: 'ad_hoc' },
            { label: 'Consultation', value: 'consultation' },
          ]}
          />
        </Form.Item>

        <Form.Item name="duration_minutes" label="Duration (minutes)" rules={[{ required: true }]}>
          <InputNumber min={1} max={1440} size="large" className="w-full" style={{ width: '100%' }} id="duration-input" />
        </Form.Item>

        {!isBulk && !isEdit && (
          <Form.Item name="starts_at" label="Session Date & Time" rules={[{ required: true }]}>
            <DatePicker showTime size="large" className="w-full" style={{ width: '100%' }} id="starts-at-picker" />
          </Form.Item>
        )}

        {isBulk && (
          <>
            <Form.Item name="bulk_start" label="Start Date" rules={[{ required: true }]}>
              <DatePicker size="large" className="w-full" style={{ width: '100%' }} id="bulk-start-picker" />
            </Form.Item>
            <Form.Item name="bulk_end" label="End Date" rules={[{ required: true }]}>
              <DatePicker size="large" className="w-full" style={{ width: '100%' }} id="bulk-end-picker" />
            </Form.Item>
            <Form.Item name="days_of_week" label="Repeat on" rules={[{ required: true }]}>
              <Checkbox.Group options={DAYS_OF_WEEK} />
            </Form.Item>
            <Form.Item name="bulk_time" label="Start Time" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" size="large" className="w-full" style={{ width: '100%' }} id="bulk-time-picker" />
            </Form.Item>
          </>
        )}

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} size="large" placeholder="Optional notes about this session" id="description-input" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} id="submit-session-btn" size="large">
              {isEdit ? 'Save Changes' : isBulk ? 'Create All Sessions' : 'Save Draft'}
            </Button>
            <Button onClick={() => navigate('/dashboard/teaching-sessions')} size="large">
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
      </Card>
    </div>
  )
}
