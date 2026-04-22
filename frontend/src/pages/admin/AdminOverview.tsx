import React, { useState, useEffect } from 'react';
import { Tabs, Typography } from 'antd';
import { SafetyOutlined, UserOutlined, SettingOutlined, HistoryOutlined } from '@ant-design/icons'; 
import AuditLogViewer from './AuditLogViewer';
import UserManager from './UserManager';
import RBACEditor from './RBACEditor';
import SystemSettingsViewer from './SystemSettingsViewer';
import ImportHistoryViewer from './ImportHistoryViewer';
import { useAuth } from '@/auth/useAuth';

const { Title, Text } = Typography;

const AdminOverview: React.FC = () => {
  const [tabPosition, setTabPosition] = useState<'left' | 'top'>(
    window.innerWidth < 768 ? 'top' : 'left'
  );

  const profile = useAuth((s) => s.profile);
  const hasPermission = (perm: string) => profile?.role === 'super_admin' || profile?.permissions?.includes(perm);

  useEffect(() => {
    const handleResize = () => {
      setTabPosition(window.innerWidth < 768 ? 'top' : 'left');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const items = [
    {
      label: (
        <span className="flex items-center gap-2">
          <SafetyOutlined />
          Audit Logs
        </span>
      ),
      key: 'audit',
      children: <AuditLogViewer />,
      show: hasPermission('view_reports'),
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined />
          Users
        </span>
      ),
      key: 'users',
      children: <UserManager />,
      show: hasPermission('view_students') || hasPermission('view_tutors'),
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          RBAC Config
        </span>
      ),
      key: 'rbac',
      children: <RBACEditor />,
      show: hasPermission('manage_settings'),
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          System Settings
        </span>
      ),
      key: 'settings',
      children: <SystemSettingsViewer />,
      show: hasPermission('manage_settings'),
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <HistoryOutlined />
          Import History
        </span>
      ),
      key: 'imports',
      children: <ImportHistoryViewer />,
      show: hasPermission('view_reports'),
    },
  ].filter(item => item.show);

  return (
    <div className="max-w-[1400px] mx-auto w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Typography>
          <Title level={2} className="mb-1! font-semibold text-foreground tracking-tight">System Admin Console</Title>
          <Text className="text-muted-foreground text-sm">Monitor audit trails, configure RBAC, and manage users globally.</Text>
        </Typography>
      </div>

      <div className="glass-card cd-glass rounded-lg shadow-premium p-4 md:p-6">
        <Tabs
          defaultActiveKey={items[0]?.key || 'audit'}
          tabPosition={tabPosition}
          className="admin-console-tabs min-h-[500px]"
          items={items}
        />
      </div>
    </div>
  );
};

export default AdminOverview;
