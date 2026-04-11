import { useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Space, Skeleton, Button, Progress, List, Tag, Form, Modal, Input, Select } from 'antd';
import { ThunderboltOutlined, CarryOutOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { useDashboardStats } from '../../api/analytics';
import type { StudentDashboardData } from '../../api/analytics';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';
import { useApplyShadowing } from '../../api/shadowing';

const { Title, Text } = Typography;

export default function StudentDashboard() {
  const accessToken = useAuth((s) => s.accessToken);
  const { data, isLoading } = useDashboardStats(accessToken);
  const studentData = data as StudentDashboardData;
  const navigate = useNavigate();
  const applyShadowingMutation = useApplyShadowing();
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleApplyShadowing = async (values: any) => {
    try {
      await applyShadowingMutation.mutateAsync(values);
      setIsApplyModalVisible(false);
      form.resetFields();
    } catch (e) {
      // Handled by mutation
    }
  };

  if (isLoading) {
    return <Skeleton active />;
  }

  const posting = studentData?.current_posting;

  return (
    <PageState
      loading={isLoading}
      error={null}
      isEmpty={!data}
    >
      <div className="cd-section-lg">
        <Title level={2} className="!mb-2 font-manrope">Student Dashboard</Title>
        <Text type="secondary" className="text-sm block max-w-2xl">
          Your posting, surveys, and teaching sessions in one place.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card 
            title={<Space><ThunderboltOutlined /> Active Posting</Space>} 
            bordered={false} 
            className="glass-card"
            extra={<Tag color="blue">In Progress</Tag>}
          >
            {posting ? (
              <div style={{ padding: '8px 0' }}>
                <Title level={4}>{posting.title}</Title>
                <Text type="secondary">{posting.start_date} — {posting.end_date}</Text>
                <div style={{ marginTop: 20 }}>
                  <Text strong>Rotation Progress</Text>
                  <Progress percent={45} status="active" strokeColor="var(--cd-primary)" />
                </div>
                <Button type="primary" style={{ marginTop: 20 }} block onClick={() => navigate('/dashboard/postings')}>
                  View Posting Details
                </Button>
              </div>
            ) : (
              <Text type="secondary">No active posting at the moment.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card bordered={false} className="glass-card shadow-premium" style={{ height: '100%' }}>
            <Statistic
              title={<Space><CarryOutOutlined /> Pending Surveys</Space>}
              value={studentData?.pending_surveys_count || 0}
              valueStyle={{
                color:
                  (studentData?.pending_surveys_count || 0) > 0 ? 'var(--cd-secondary)' : 'var(--cd-on-tertiary-container)',
              }}
            />
            <Button 
                type="link" 
                icon={<RightOutlined />} 
                style={{ marginTop: 10, padding: 0 }}
                onClick={() => navigate('/dashboard/surveys/pending')}
            >
              Take Action
            </Button>
          </Card>
          
          <Card
            bordered={false}
            className="glass-card mt-4"
            style={{ background: 'var(--cd-tertiary-container)', border: 'none' }}
          >
            <Title level={5} style={{ margin: 0, color: 'var(--cd-on-tertiary-container)' }}>
              Clinical exposure
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>Boost your portfolio with job shadowing.</Text>
            <Button 
              type="primary" 
              icon={<ThunderboltOutlined />} 
              style={{ marginTop: 12 }} 
              block
              onClick={() => setIsApplyModalVisible(true)}
            >
              Apply for Shadowing
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title={<Space><CalendarOutlined /> Upcoming Sessions</Space>} bordered={false} className="glass-card">
            <List
              dataSource={studentData?.upcoming_sessions || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={`${item.date} | ${item.tutor}`}
                  />
                  <Tag color="cyan">{item.type}</Tag>
                </List.Item>
              )}
              locale={{ emptyText: 'No upcoming sessions' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Apply for Job Shadowing"
        open={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={applyShadowingMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleApplyShadowing} initialValues={{ discipline: 'medicine' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
            Request clinical shadowing in a specific discipline. Applications are reviewed by the Department Head.
          </Text>
          <Form.Item
            name="discipline"
            label="Target Discipline"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="medicine">Medicine</Select.Option>
              <Select.Option value="nursing">Nursing</Select.Option>
              <Select.Option value="allied_health">Allied Health</Select.Option>
              <Select.Option value="training">Training</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason for Request"
            rules={[{ required: true, message: 'Please provide a short reason' }]}
          >
            <Input.TextArea rows={4} placeholder="E.g., Interested in observing advanced cardiac procedures..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageState>
  );
}
