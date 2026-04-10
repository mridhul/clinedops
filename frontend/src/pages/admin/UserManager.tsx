import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, Popconfirm, Avatar, Drawer, Form, Badge, Switch, notification } from 'antd';
import { SearchOutlined, UserAddOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAdminUsers, useCreateAdminUser } from '../../api/admin';
import type { User, UserListResponse } from '../../api/admin';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';

const { Option } = Select;

const UserManager: React.FC = () => {
  const accessToken = useAuth((s) => s.accessToken);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(50);
  const [roleFilter, setRoleFilter] = useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: usersData, isLoading, error } = useAdminUsers(accessToken, skip, limit, roleFilter);
  const createUserMutation = useCreateAdminUser(accessToken);

  const dataSource = usersData?.items || [];
  const total = usersData?.total || 0;

  const [form] = Form.useForm();

  const handleCreateUser = async (values: any) => {
    try {
      await createUserMutation.mutateAsync(values);
      notification.success({
        message: 'User Created',
        description: `Successfully created user ${values.email}`,
        placement: 'topRight',
      });
      setIsDrawerOpen(false);
      form.resetFields();
    } catch (error: any) {
      notification.error({
        message: 'Creation Failed',
        description: error.message || 'An error occurred while creating the user.',
        placement: 'topRight',
      });
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-primary/20 text-primary font-bold">
            {record.full_name ? record.full_name.charAt(0) : record.email.charAt(0).toUpperCase()}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{record.full_name || 'Unnamed User'}</span>
            <span className="text-xs text-muted-foreground">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue" className="uppercase text-[10px] font-bold rounded">{role}</Tag>,
    },
    {
      title: 'Discipline',
      dataIndex: 'discipline',
      key: 'discipline',
      render: (discipline: string) => discipline ? <Tag className="rounded-full bg-surface-lowest text-xs">{discipline.replace('_', ' ')}</Tag> : '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'error'} text={isActive ? 'Active' : 'Deactivated'} className="text-xs" />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Button type="text" size="small" icon={<EditOutlined />} className="text-muted-foreground hover:text-primary" />
          <Popconfirm
            title={record.is_active ? "Deactivate User?" : "Reactivate User?"}
            description="Are you sure you want to change this user's access?"
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              size="small" 
              danger={record.is_active}
              className={record.is_active ? '' : 'text-green-600'}
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />} 
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-6 pl-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold mb-1">User Directory</h4>
          <p className="text-xs text-muted-foreground">Manage active accounts, roles, and discipline assignments.</p>
        </div>
        <Button 
          type="primary" 
          icon={<UserAddOutlined />} 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-primary hover:bg-primary/90 shadow-sm rounded-lg"
        >
          Add New User
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
        <Input 
          placeholder="Search by name or email..." 
          prefix={<SearchOutlined className="text-muted-foreground" />} 
          className="max-w-[300px] w-full md:w-auto rounded-lg"
        />
        <Select
          allowClear
          placeholder="Filter by Role"
          style={{ width: 200 }}
          onChange={(v) => setRoleFilter(v)}
          className="admin-select w-full md:w-auto"
        >
          <Option value="student">Student</Option>
          <Option value="tutor">Tutor</Option>
          <Option value="supervisor">Supervisor</Option>
          <Option value="programme_admin">Programme Admin</Option>
          <Option value="super_admin">Super Admin</Option>
        </Select>
      </div>

      <PageState
        loading={isLoading}
        error={error as Error} 
        isEmpty={!isLoading && dataSource.length === 0}
        onRetry={() => {}} 
      >
        <Table 
          dataSource={dataSource} 
          columns={columns} 
          rowKey="id"
          size="middle"
          className="clinical-table border rounded-xl overflow-hidden shadow-sm"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: Math.floor(skip / limit) + 1,
            pageSize: limit,
            total: total as number,
            onChange: (page: number, pageSize: number) => {
              setSkip((page - 1) * pageSize);
              setLimit(pageSize);
            },
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
        />
      </PageState>

      <Drawer
        title={<span className="font-semibold text-lg">Create New User</span>}
        width={400}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        footer={
          <div className="flex justify-end gap-3 px-2 py-2">
            <Button onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()} loading={createUserMutation.isPending}>
              Create User
            </Button>
          </div>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleCreateUser} className="clinical-form">
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="user@nuhs.edu.sg" className="rounded-lg h-10" />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name">
            <Input placeholder="Dr. John Doe" className="rounded-lg h-10" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select Role" className="h-10">
              <Option value="programme_admin">Programme Admin</Option>
              <Option value="tutor">Tutor</Option>
              <Option value="supervisor">Supervisor</Option>
              <Option value="student">Student</Option>
              <Option value="super_admin">Super Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item name="discipline" label="Discipline Scope">
            <Select placeholder="Optional Discipline Scope" allowClear className="h-10">
              <Option value="medicine">Medicine</Option>
              <Option value="nursing">Nursing</Option>
              <Option value="allied_health">Allied Health</Option>
              <Option value="training">Training Programmes</Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" label="Account Status" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default UserManager;
