import {
  Alert,
  Button,
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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Title level={3}>{isEdit ? 'Edit Session' : isBulk ? 'Create Recurring Sessions' : 'Log Teaching Session'}</Title>

      {savedFlags.length > 0 && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
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
        <div style={{ marginBottom: 16 }}>
          <Text>Recurring / Bulk mode: </Text>
          <Switch checked={isBulk} onChange={setIsBulk} id="bulk-toggle" />
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onFinish}>
        <Form.Item name="posting_id" label="Posting" rules={[{ required: !isEdit, message: 'Please select a posting' }]}>
          <Select
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
          <Select id="session-type-select" options={[
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Ad Hoc', value: 'ad_hoc' },
            { label: 'Consultation', value: 'consultation' },
          ]} />
        </Form.Item>

        <Form.Item name="duration_minutes" label="Duration (minutes)" rules={[{ required: true }]}>
          <InputNumber min={1} max={1440} style={{ width: '100%' }} id="duration-input" />
        </Form.Item>

        {!isBulk && !isEdit && (
          <Form.Item name="starts_at" label="Session Date & Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} id="starts-at-picker" />
          </Form.Item>
        )}

        {isBulk && (
          <>
            <Form.Item name="bulk_start" label="Start Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} id="bulk-start-picker" />
            </Form.Item>
            <Form.Item name="bulk_end" label="End Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} id="bulk-end-picker" />
            </Form.Item>
            <Form.Item name="days_of_week" label="Repeat on" rules={[{ required: true }]}>
              <Checkbox.Group options={DAYS_OF_WEEK} />
            </Form.Item>
            <Form.Item name="bulk_time" label="Start Time" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} id="bulk-time-picker" />
            </Form.Item>
          </>
        )}

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Optional notes about this session" id="description-input" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} id="submit-session-btn">
              {isEdit ? 'Save Changes' : isBulk ? 'Create All Sessions' : 'Save Draft'}
            </Button>
            <Button onClick={() => navigate('/dashboard/teaching-sessions')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}
