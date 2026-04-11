import { Button, Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType, ColumnType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { SearchOutlined } from '@ant-design/icons'
import { useConfirmAttendance, useTeachingSessions } from '../../api/teachingHours'
import type { TeachingSessionOut } from '../../types/teachingHours'

const { Title, Text } = Typography

export default function MySessionsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useTeachingSessions()
  const confirmMutation = useConfirmAttendance()

  const getColumnSearchProps = (dataIndex: keyof TeachingSessionOut, title: string): ColumnType<TeachingSessionOut> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const targetValue = record[dataIndex]
      if (typeof targetValue !== 'string') return false
      return targetValue.toLowerCase().includes((value as string).toLowerCase())
    },
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          // focus logic could go here
        }
      },
    },
  })

  const columns: ColumnsType<TeachingSessionOut> = [
    {
      title: 'Date',
      dataIndex: 'starts_at',
      render: (val: string) => dayjs(val).format('DD MMM YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.starts_at).unix() - dayjs(b.starts_at).unix(),
    },
    {
      title: 'Tutor',
      ...getColumnSearchProps('tutor_full_name', 'Tutor'),
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.tutor_full_name || 'Unknown Tutor'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.tutor_code || record.tutor_id.substring(0, 8)}</Text>
        </Space>
      ),
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
