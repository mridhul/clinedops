import React from 'react';
import { Button, Form, InputNumber, Typography, Row, Col, Switch, message, Divider } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { useAdminSettings, useUpdateAdminSetting } from '../../api/admin';
import { useAuth } from '../../auth/useAuth';

const { Title, Text } = Typography;

const SystemSettingsViewer: React.FC = () => {
  const accessToken = useAuth((s) => s.accessToken);
  const { data: settingsData, isLoading } = useAdminSettings(accessToken);
  const updateSettingMutation = useUpdateAdminSetting(accessToken);
  const [form] = Form.useForm();

  // Assuming settingsData comes back as an array of SystemSetting objects
  // We will map them by key to easily feed them into the form init
  const initialValues = settingsData?.reduce((acc: any, curr: any) => {
    acc[curr.setting_key] = curr.setting_value?.value || curr.setting_value;
    return acc;
  }, {}) || {
    pdpa_retention_days: 1825, // 5 years
    require_email_mfa: false,
    max_upload_size_mb: 50,
    notification_retention_days: 90
  };

  const handleSave = (values: any) => {
    // Iterate over form values and save them
    Object.keys(values).forEach(key => {
      // Create a payload structured similarly to what the backend expects
      updateSettingMutation.mutate({ key, value: values[key] });
    });
    message.success('System settings have been updated globally.', 3);
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-muted-foreground">Loading settings...</div>;

  return (
    <div className="h-full flex flex-col gap-6 p-4 md:p-0 md:pl-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-0 flex items-center gap-2">
            <SettingOutlined className="text-primary" />
            Global Platform Parameters
          </Title>
          <p className="text-xs text-muted-foreground mt-1 max-w-[600px] mb-0">
            Adjusting these values directly impacts compliance routines, retention jobs, and system guardrails.
          </p>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={() => form.submit()}
          loading={updateSettingMutation.isPending}
          className="bg-primary hover:bg-primary/90 shadow-sm rounded-lg"
        >
          Enforce Globals
        </Button>
      </div>

      <div className="bg-surface-lowest p-6 rounded-2xl border border-border/40">
        <Form 
          form={form} 
          layout="vertical" 
          initialValues={initialValues} 
          onFinish={handleSave}
          className="clinical-form max-w-4xl"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div className="mb-6">
                <Text strong className="text-sm uppercase tracking-wider text-muted-foreground block mb-4">Data Retention & Compliance (PDPA)</Text>
                
                <Form.Item 
                  name="pdpa_retention_days" 
                  label={<span className="font-semibold text-foreground">Audit Log Retention (Days)</span>}
                  tooltip="Number of days to store immutable audit logs before archiving. Mof (Ministry of Finance) suggests 5 years minimum."
                >
                  <InputNumber min={30} max={3650} className="w-full h-10 rounded-lg" />
                </Form.Item>
 
                <Form.Item 
                  name="notification_retention_days" 
                  label={<span className="font-semibold text-foreground">Notification TTL (Days)</span>}
                  tooltip="Number of days to keep unread notifications before they are expunged."
                >
                  <InputNumber min={7} max={365} className="w-full h-10 rounded-lg" />
                </Form.Item>
              </div>
            </Col>
 
            <Col xs={24} md={12}>
              <div className="mb-6">
                <Text strong className="text-sm uppercase tracking-wider text-muted-foreground block mb-4">Security & Storage Limits</Text>
 
                <Form.Item 
                  name="require_email_mfa" 
                  label={<span className="font-semibold text-foreground">Require Email MFA Checks</span>}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Enforced" unCheckedChildren="Disabled" />
                </Form.Item>
                
                <Form.Item 
                  name="max_upload_size_mb" 
                  label={<span className="font-semibold text-foreground">Upload Payload Limit (MB)</span>}
                  tooltip="Maximum allowed file size per CSV upload via the batch ingest system."
                >
                  <InputNumber min={1} max={500} className="w-full h-10 rounded-lg" />
                </Form.Item>
              </div>
            </Col>
          </Row>
          
          <Divider dashed />

          <Row gutter={48}>
            <Col span={24}>
               <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <Text className="text-amber-700 font-semibold mb-2 block text-sm">Cautionary Notice</Text>
                  <Text className="text-amber-700/80 text-xs">
                    Lowering retention values will trigger asynchronous deletion jobs. Data removed cannot be recovered unless through cold backups.
                  </Text>
               </div>
            </Col>
          </Row>

        </Form>
      </div>
    </div>
  );
};

export default SystemSettingsViewer;
