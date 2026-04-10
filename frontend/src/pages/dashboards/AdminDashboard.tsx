import { Card, Col, Row, Statistic, List, Avatar, Typography, Space, Skeleton } from 'antd';
import { UserOutlined, ClockCircleOutlined, FormOutlined, FlagOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useDashboardStats } from '../../api/analytics';
import type { AdminDashboardData } from '../../api/analytics';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';

const { Title } = Typography;

export default function AdminDashboard() {
  const accessToken = useAuth((s) => s.accessToken);
  const { data, isLoading, error } = useDashboardStats(accessToken);
  const adminData = data as AdminDashboardData;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton active />
        <Skeleton active className="mt-8" />
      </div>
    );
  }

  const kpis = adminData?.kpis || [];

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'active students': return <UserOutlined />;
      case 'pending hours': return <ClockCircleOutlined />;
      case 'survey completion': return <FormOutlined />;
      case 'flagged items': return <FlagOutlined />;
      default: return <FormOutlined />;
    }
  };

  return (
    <PageState
      loading={isLoading}
      error={error}
      isEmpty={!data}
    >
      <Title level={2}>Admin Dashboard</Title>
      <Row gutter={[16, 16]}>
        {kpis.map((kpi, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card bordered={false} className="glass-card" style={{ height: '100%' }}>
              <Statistic
                title={<Space>{getIcon(kpi.label)} {kpi.label}</Space>}
                value={kpi.value}
                precision={typeof kpi.value === 'number' ? 1 : 0}
                valueStyle={{ color: kpi.status === 'error' ? '#cf1322' : kpi.status === 'success' ? '#3f8600' : 'inherit' }}
                prefix={kpi.trend ? (kpi.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />) : null}
                suffix={kpi.trend ? `${Math.abs(kpi.trend)}%` : null}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Recent Activity" bordered={false} className="glass-card">
            <List
              itemLayout="horizontal"
              dataSource={adminData?.recent_activity || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.title}
                    description={item.description}
                  />
                  <div>{item.timestamp}</div>
                </List.Item>
              )}
              locale={{ emptyText: 'No recent activity' }}
            />
          </Card>
        </Col>
      </Row>
    </PageState>
  );
}
