import { Card, Col, Row, Statistic, List, Avatar, Typography, Space, Skeleton } from 'antd';
import { UserOutlined, ClockCircleOutlined, FormOutlined, FlagOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useDashboardStats } from '../../api/analytics';
import type { AdminDashboardData } from '../../api/analytics';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';

const { Title, Paragraph } = Typography;

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
      <div className="cd-section-lg">
        <Title level={2} className="!mb-2 font-manrope">
          Admin Dashboard
        </Title>
        <Paragraph type="secondary" className="!mb-0 max-w-2xl text-sm">
          Operational overview for clinical education programmes. Key metrics refresh with live data.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Row gutter={[16, 16]}>
            {kpis.map((kpi, index) => (
              <Col xs={24} sm={12} key={index}>
                <Card bordered={false} className="glass-card h-full shadow-premium">
                  <Statistic
                    title={<Space className="text-muted-foreground">{getIcon(kpi.label)} {kpi.label}</Space>}
                    value={kpi.value}
                    precision={typeof kpi.value === 'number' ? 1 : 0}
                    valueStyle={{
                      color:
                        kpi.status === 'error'
                          ? 'var(--cd-error)'
                          : kpi.status === 'success'
                            ? 'var(--cd-on-tertiary-container)'
                            : 'var(--cd-on-surface)',
                    }}
                    prefix={kpi.trend ? (kpi.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />) : null}
                    suffix={kpi.trend ? `${Math.abs(kpi.trend)}%` : null}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            bordered={false}
            className="glass-card h-full shadow-premium"
            style={{ background: 'var(--cd-tertiary-container)', border: 'none' }}
            title={<span className="font-manrope text-[#0a4a56]">Clinical notes</span>}
          >
            <Paragraph className="!mb-0 text-sm" style={{ color: 'var(--cd-on-tertiary-container)' }}>
              Use flagged items and pending hours to prioritise tutor approvals and learner follow-up. Survey completion reflects
              engagement across postings.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-2">
        <Col span={24}>
          <Card title={<span className="font-manrope">Recent activity</span>} bordered={false} className="glass-card">
            <List
              itemLayout="horizontal"
              dataSource={adminData?.recent_activity || []}
              renderItem={(item: { title: string; description?: string; timestamp?: string }) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} className="bg-surface-highest text-secondary" />}
                    title={item.title}
                    description={item.description}
                  />
                  <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </div>
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
