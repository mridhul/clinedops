import { Card, Col, Row, Statistic, Typography, Space, Skeleton, Button } from 'antd';
import { ClockCircleOutlined, StarOutlined, RocketOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '../../api/analytics';
import type { TutorDashboardData } from '../../api/analytics';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';

const { Title, Text, Paragraph } = Typography;

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
      <div className="cd-section-lg">
        <Title level={2} className="!mb-2 font-manrope">Tutor dashboard</Title>
        <Paragraph type="secondary" className="!mb-0 max-w-2xl text-sm">
          Teaching hours, learner feedback trends, and assigned students.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Row gutter={[16, 16]}>
            {kpis.map((kpi, index) => (
              <Col xs={24} sm={12} key={index}>
                <Card bordered={false} className="glass-card h-full">
                  <Statistic
                    title={<Space className="text-muted-foreground">{getIcon(kpi.label)} {kpi.label}</Space>}
                    value={kpi.value}
                    valueStyle={{ color: 'var(--cd-primary)' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Card title={<span className="font-manrope">My students</span>} extra={<Button type="link">View all</Button>} bordered={false} className="glass-card mt-6">
            <Text type="secondary">View and manage your currently assigned students and their progress.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<span className="font-manrope">Feedback trends</span>} bordered={false} className="glass-card shadow-premium h-full">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(43,52,56,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--cd-on-surface-variant)', fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'var(--cd-on-surface-variant)', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="var(--cd-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </PageState>
  );
}
