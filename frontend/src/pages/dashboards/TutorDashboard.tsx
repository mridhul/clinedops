import { Card, Col, Row, Statistic, Typography, Space, Skeleton, Button } from 'antd';
import { ClockCircleOutlined, StarOutlined, RocketOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '../../api/analytics';
import type { TutorDashboardData } from '../../api/analytics';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';

const { Title, Text } = Typography;

export default function TutorDashboard() {
  const accessToken = useAuth((s) => s.accessToken);
  const { data, isLoading } = useDashboardStats(accessToken);
  const tutorData = data as TutorDashboardData;

  if (isLoading) {
    return <Skeleton active />;
  }

  const kpis = tutorData?.kpis || [];
  const trendData = tutorData?.feedback_trend || [
    { name: 'Week 1', score: 4.2 },
    { name: 'Week 2', score: 4.5 },
    { name: 'Week 3', score: 4.3 },
    { name: 'Week 4', score: 4.8 },
  ];

  const getIcon = (label: string) => {
    if (label.includes('Hours')) return <ClockCircleOutlined />;
    if (label.includes('Feedback')) return <StarOutlined />;
    return <RocketOutlined />;
  };

  return (
    <PageState
      loading={isLoading}
      error={null}
      isEmpty={!data}
    >
      <Title level={2}>Tutor Dashboard</Title>
      <Row gutter={[16, 16]}>
        {kpis.map((kpi, index) => (
          <Col xs={24} sm={12} lg={12} key={index}>
            <Card bordered={false} className="glass-card">
              <Statistic
                title={<Space>{getIcon(kpi.label)} {kpi.label}</Space>}
                value={kpi.value}
                valueStyle={{ color: '#0055ff' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Feedback Trends" bordered={false} className="glass-card">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#0055ff" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
            <Card title="My Students" extra={<Button type="link">View All</Button>} bordered={false} className="glass-card">
                <Text type="secondary">View and manage your currently assigned students and their progress.</Text>
            </Card>
        </Col>
      </Row>
    </PageState>
  );
}
