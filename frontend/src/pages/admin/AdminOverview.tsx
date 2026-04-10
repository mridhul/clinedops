import React, { useState, useEffect } from 'react';
import { Tabs, Typography } from 'antd';
import { SafetyOutlined, UserOutlined, SettingOutlined, HistoryOutlined } from '@ant-design/icons'; 
import AuditLogViewer from './AuditLogViewer';
import UserManager from './UserManager';
import RBACEditor from './RBACEditor';
import SystemSettingsViewer from './SystemSettingsViewer';
import ImportHistoryViewer from './ImportHistoryViewer';

const { Title, Text } = Typography;

const AdminOverview: React.FC = () => {
  const [tabPosition, setTabPosition] = useState<'left' | 'top'>(
    window.innerWidth < 768 ? 'top' : 'left'
  );

  useEffect(() => {
    const handleResize = () => {
      setTabPosition(window.innerWidth < 768 ? 'top' : 'left');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Typography>
          <Title level={2} className="mb-1! font-semibold text-foreground tracking-tight">System Admin Console</Title>
          <Text className="text-muted-foreground text-sm">Monitor audit trails, configure RBAC, and manage users globally.</Text>
        </Typography>
      </div>

      <div className="bg-surface glass rounded-2xl border border-border/40 shadow-premium p-4 md:p-6">
        <Tabs
          defaultActiveKey="audit"
          tabPosition={tabPosition}
          className="admin-console-tabs min-h-[500px]"
          items={[
            {
              label: (
                <span className="flex items-center gap-2">
                  <SafetyOutlined />
                  Audit Logs
                </span>
              ),
              key: 'audit',
              children: <AuditLogViewer />,
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
            },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminOverview;
