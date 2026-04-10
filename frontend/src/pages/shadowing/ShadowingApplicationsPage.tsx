import React, { useState } from 'react';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Modal, 
  Form, 
  Select, 
  Input, 
  Typography, 
  Card,
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  UserAddOutlined, 
  EyeOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { 
  useShadowingApplications, 
  useUpdateShadowingStatus, 
  useAssignShadowingMentor 
} from '../../api/shadowing';
import { useTutorsList } from '../../api/tutors';
import { useAuth } from '../../auth/useAuth';
import type { ShadowingApplicationOut } from '../../types/shadowing';

const { Title, Text } = Typography;

const ShadowingApplicationsPage: React.FC = () => {
  const token = useAuth((s) => s.accessToken);
  const { data: applications = [], isLoading } = useShadowingApplications();
  
  const { data: tutorsData } = useTutorsList(token, { limit: 100 });
  const tutors = tutorsData?.items || [];

  const updateStatusMutation = useUpdateShadowingStatus();
  const assignMentorMutation = useAssignShadowingMentor();

  const [selectedApp, setSelectedApp] = useState<ShadowingApplicationOut | null>(null);
  const [isMentorModalVisible, setIsMentorModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleStatusUpdate = async (id: string, status: 'shortlisted' | 'rejected') => {
    try {
      await updateStatusMutation.mutateAsync({ id, payload: { status } });
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleAssignMentor = async (values: any) => {
    if (!selectedApp) return;
    try {
      await assignMentorMutation.mutateAsync({ 
        id: selectedApp.id, 
        payload: { 
          mentor_user_id: values.mentor_user_id,
          notes: values.notes 
        } 
      });
      setIsMentorModalVisible(false);
      form.resetFields();
    } catch (e) {
      // Error handled by mutation
    }
  };

  const columns = [
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (id: string) => <Text copyable ellipsis>{id}</Text>,
    },
    {
      title: 'Discipline',
      dataIndex: 'discipline',
      key: 'discipline',
      render: (d: string) => <Tag color="blue">{d}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'gold';
        if (status === 'shortlisted') color = 'cyan';
        if (status === 'rejected') color = 'volcano';
        if (status === 'completed') color = 'green';
        return <Tag color={color} className="uppercase font-bold">{status}</Tag>;
      },
    },
    {
      title: 'Applied On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ShadowingApplicationOut) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <>
              <Button 
                type="text" 
                icon={<CheckCircleOutlined className="text-emerald-500" />} 
                onClick={() => handleStatusUpdate(record.id, 'shortlisted')}
              >
                Shortlist
              </Button>
              <Button 
                type="text" 
                danger 
                icon={<CloseCircleOutlined />} 
                onClick={() => handleStatusUpdate(record.id, 'rejected')}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'shortlisted' && (
             <Button 
                type="primary" 
                ghost
                icon={<UserAddOutlined />} 
                onClick={() => {
                  setSelectedApp(record);
                  setIsMentorModalVisible(true);
                }}
              >
                Assign Mentor
              </Button>
          )}
          <Button icon={<EyeOutlined />} type="link">Details</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Title level={2}>Shadowing Applications</Title>
          <Text type="secondary">Review and shortlist students for clinical job shadowing.</Text>
        </div>
        <div className="flex gap-2">
            <Input prefix={<SearchOutlined />} placeholder="Search students..." className="w-64 rounded-lg" />
            <Button icon={<Filter />} className="rounded-lg">Filter</Button>
        </div>
      </div>

      <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={applications} 
          loading={isLoading} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Assign Mentor"
        open={isMentorModalVisible}
        onCancel={() => setIsMentorModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={assignMentorMutation.isPending}
        destroyOnClose
        className="rounded-2xl"
      >
        <Form form={form} layout="vertical" onFinish={handleAssignMentor} className="mt-4">
          <Form.Item
            name="mentor_user_id"
            label="Select Mentor (Tutor)"
            rules={[{ required: true, message: 'Please select a mentor' }]}
          >
            <Select 
              showSearch 
              placeholder="Search by name or code"
              optionFilterProp="children"
            >
              {tutors.map((t: any) => (
                <Select.Option key={t.user_id} value={t.user_id}>
                  {t.user.full_name} ({t.tutor_code}) - {t.discipline}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="Assignment Notes"
          >
            <Input.TextArea rows={4} placeholder="Initial instructions for the mentor..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const Filter = () => <span>Filter</span>; // Placeholder for Lucide icon in antd

export default ShadowingApplicationsPage;
