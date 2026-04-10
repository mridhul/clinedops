import { Button, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useConfirmAttendance, useTeachingSessions } from '../../api/teachingHours'
import type { TeachingSessionOut } from '../../types/teachingHours'

const { Title, Text } = Typography

export default function MySessionsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useTeachingSessions()
  const confirmMutation = useConfirmAttendance()

  const columns: ColumnsType<TeachingSessionOut> = [
    {
      title: 'Date',
      dataIndex: 'starts_at',
      render: (val: string) => dayjs(val).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Tutor',
      dataIndex: 'tutor_id',
      render: (val: string) => `Tutor: ${val.substring(0, 8)}`,
    },
    {
      title: 'Duration',
      dataIndex: 'duration_minutes',
      render: (val: number) => `${val} min`,
    },
    {
       title: 'Attendance',
       render: (_, record) => {
         const attendanceObj = record.session_students[0]
         if (attendanceObj?.attendance_confirmed_at) {
           return <Tag color="success">Confirmed</Tag>
         }
         return <Tag color="warning">Pending</Tag>
       }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
           <Button size="small" onClick={() => navigate(`/dashboard/teaching-sessions/${record.id}`)}>View</Button>
           {!record.session_students[0]?.attendance_confirmed_at && (
             <Button 
               size="small" 
               type="primary" 
               onClick={() => confirmMutation.mutate(record.id)}
               loading={confirmMutation.isPending && confirmMutation.variables === record.id}
             >
               Confirm Attendance
             </Button>
           )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>My Teaching Sessions</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Check your teaching session schedule and confirm your attendance for the completed sessions.
      </Text>
      
      <Table 
        columns={columns} 
        dataSource={data?.items} 
        rowKey="id" 
        loading={isLoading} 
      />
    </div>
  )
}
