import { Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadExport, useDashboardData } from '../../api/teachingHours'

const { Title } = Typography
const { RangePicker } = DatePicker

export default function TeachingHoursDashboard() {
  const [filters, setFilters] = useState({
    group_by: 'tutor' as 'tutor' | 'department',
    discipline: undefined as string | undefined,
    date_range: [dayjs().subtract(30, 'days'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  })

  const { data, isLoading } = useDashboardData({
    group_by: filters.group_by,
    discipline: filters.discipline,
    date_from: filters.date_range?.[0]?.format('YYYY-MM-DD'),
    date_to: filters.date_range?.[1]?.format('YYYY-MM-DD'),
  })

  const handleExport = () => {
    downloadExport({
      discipline: filters.discipline,
      date_from: filters.date_range?.[0]?.format('YYYY-MM-DD'),
      date_to: filters.date_range?.[1]?.format('YYYY-MM-DD'),
    })
  }

  // Transform minutes to hours for display
  const chartData = data?.bars.map(b => ({
    name: b.label.substring(0, 8), // truncate UUIDs
    hours: Math.round((b.total_minutes / 60) * 10) / 10,
    sessions: b.session_count,
  })) || []

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Teaching Hours Dashboard</Title>
        <Button size="large" type="primary" onClick={handleExport}>Export to XLSX</Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <Space direction="vertical">
            <span>Discipline</span>
            <Select
              style={{ width: 150 }}
              placeholder="All Disciplines"
              allowClear
              value={filters.discipline}
              onChange={val => setFilters(f => ({ ...f, discipline: val }))}
              options={[
                { label: 'Medicine', value: 'medicine' },
                { label: 'Nursing', value: 'nursing' },
                { label: 'Allied Health', value: 'allied_health' },
                { label: 'Training', value: 'training' },
              ]}
            />
          </Space>
          <Space direction="vertical">
            <span>Group By</span>
            <Select
              style={{ width: 150 }}
              value={filters.group_by}
              onChange={val => setFilters(f => ({ ...f, group_by: val }))}
              options={[
                { label: 'By Tutor', value: 'tutor' },
                { label: 'By Department', value: 'department' },
              ]}
            />
          </Space>
          <Space direction="vertical">
            <span>Date Range</span>
            <RangePicker
              value={filters.date_range}
              onChange={val => setFilters(f => ({ ...f, date_range: val as any }))}
            />
          </Space>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card loading={isLoading}>
            <Statistic title="Total Hours" value={Math.round((data?.total_minutes || 0) / 60)} suffix="h" />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={isLoading}>
            <Statistic title="Approved Sessions" value={data?.approved_sessions} />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={isLoading}>
            <Statistic title="Average Duration" value={data && data.total_sessions ? Math.round(data.total_minutes / data.total_sessions) : 0} suffix="min" />
          </Card>
        </Col>
      </Row>

      <Card title={filters.group_by === 'tutor' ? 'Teaching Hours by Tutor' : 'Teaching Hours by Department'} loading={isLoading}>
        <div style={{ height: 400, width: '100%' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#1890ff" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography.Text type="secondary">No approved data for selected filters.</Typography.Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
