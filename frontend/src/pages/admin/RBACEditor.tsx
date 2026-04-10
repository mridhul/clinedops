import React, { useState } from 'react';
import { Table, Checkbox, Typography, Button, message, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useAdminRBAC, useUpdateAdminRBAC } from '../../api/admin';
import { useAuth } from '../../auth/useAuth';

const { Title, Paragraph } = Typography;

const PERMISSION_KEYS = [
  'view_students', 'edit_students',
  'view_tutors', 'edit_tutors',
  'approve_hours', 'manage_surveys',
  'view_reports', 'manage_settings'
];

const RBACEditor: React.FC = () => {
  const accessToken = useAuth((s) => s.accessToken);
  const { data: rbacData, isLoading } = useAdminRBAC(accessToken);
  const updateRbacMutation = useUpdateAdminRBAC(accessToken);
  const [editedRoles, setEditedRoles] = useState<Record<string, string[]>>({});

  const dataSource = rbacData || [];

  const handleTogglePermission = (role: string, permission: string, checked: boolean) => {
    setEditedRoles(prev => {
      const currentPerms = prev[role] || (dataSource.find(r => r.role === role)?.permissions || []);
      if (checked) {
        return { ...prev, [role]: [...currentPerms, permission] };
      } else {
        return { ...prev, [role]: currentPerms.filter(p => p !== permission) };
      }
    });
  };

  const handleSave = () => {
    Object.keys(editedRoles).forEach(role => {
      updateRbacMutation.mutate({ role, permissions: editedRoles[role] });
    });
    message.success("RBAC configurations updated successfully");
    setEditedRoles({});
  };

  const hasChanges = Object.keys(editedRoles).length > 0;

  const columns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      fixed: 'left' as const,
      width: 150,
      render: (role: string) => <span className="font-semibold uppercase text-xs tracking-wider">{role.replace('_', ' ')}</span>,
    },
    ...PERMISSION_KEYS.map(perm => ({
      title: <span className="text-[10px] uppercase text-muted-foreground whitespace-nowrap px-2">{perm.replace('_', ' ')}</span>,
      key: perm,
      align: 'center' as const,
      width: 120,
      render: (_: any, record: any) => {
        const isSuperAdmin = record.role === 'super_admin';
        const permsToUse = editedRoles[record.role] || record.permissions;
        const hasPerm = permsToUse.includes(perm) || isSuperAdmin;
        
        return (
          <Checkbox 
            checked={hasPerm} 
            disabled={isSuperAdmin}
            className={isSuperAdmin ? "opacity-50" : ""}
            onChange={(e) => handleTogglePermission(record.role, perm, e.target.checked)}
          />
        );
      }
    }))
  ];

  return (
    <div className="h-full flex flex-col gap-6 pl-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-0">RBAC Configuration</Title>
          <Paragraph className="text-xs text-muted-foreground mt-1 max-w-[600px] mb-0">
            Dynamically adjust the permission matrix. Super Admins always possess all overriding privileges.
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleSave}
          disabled={!hasChanges}
          loading={updateRbacMutation.isPending}
          className={`${hasChanges ? 'bg-primary' : 'bg-muted text-muted-foreground'} shadow-sm rounded-lg border-0`}
        >
          Save Changes
        </Button>
      </div>

      <Alert 
        message="Changes to RBAC immediately affect API endpoints governed by the `require_roles` or permission dependencies." 
        type="info" 
        showIcon 
        className="rounded-xl border-blue-500/20 bg-blue-500/5 text-blue-700 font-medium" 
      />

      <Table 
        dataSource={dataSource} 
        columns={columns} 
        rowKey="id"
        loading={isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="middle"
        bordered
        className="rbac-table rounded-xl overflow-hidden shadow-sm border border-border/50"
      />
    </div>
  );
};

export default RBACEditor;
