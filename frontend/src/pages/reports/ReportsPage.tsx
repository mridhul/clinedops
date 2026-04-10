import { useState } from 'react';
import { Card, Tabs, Select, Button, Table, Tag, Space, Typography, message } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined, FileTextOutlined, PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { useReportTemplates, useReportHistory, useCreateReportExecution } from '../../api/reports';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ReportsPage() {
  const accessToken = useAuth((s) => s.accessToken);
  const { data: templates, isLoading: loadingTemplates } = useReportTemplates(accessToken);
  const { data: history, isLoading: loadingHistory } = useReportHistory(accessToken);
  const createReport = useCreateReportExecution(accessToken);

  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      message.error('Please select a report template');
      return;
    }
    try {
      await createReport.mutateAsync({ template_id: selectedTemplate, format: selectedFormat });
      message.success('Report generation started. Check history for status.');
    } catch (err) {
      message.error('Failed to start report generation');
    }
  };

  const columns = [
    {
      title: 'Report Name',
      key: 'name',
      render: (record: any) => {
        const template = templates?.find(t => t.id === record.template_id);
        return template?.name || 'Unknown Report';
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed') color = 'success';
        if (status === 'failed') color = 'error';
        if (status === 'processing') color = 'processing';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => (
        <Space>
          {format === 'pdf' && <FilePdfOutlined />}
          {format === 'xlsx' && <FileExcelOutlined />}
          {format === 'csv' && <FileTextOutlined />}
          {format.toUpperCase()}
        </Space>
      )
    },
    {
        title: 'Timeline',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: any) => (
        <Button 
          type="link" 
          icon={<DownloadOutlined />} 
          disabled={record.status !== 'completed'}
          href={record.file_url}
          target="_blank"
        >
          Download
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Reports & Analytics</Title>
      
      <Tabs defaultActiveKey="builder" items={[
        {
          key: 'builder',
          label: <span><PlusOutlined /> Report Builder</span>,
          children: (
            <Card bordered={false} className="glass-card">
              <div style={{ maxWidth: 600 }}>
                <Title level={4}>Create New Report</Title>
                <Text type="secondary">Select a template and format to generate a customized report.</Text>
                
                <div style={{ marginTop: 24 }}>
                  <div style={{ marginBottom: 8 }}><Text strong>Template</Text></div>
                  <Select 
                    placeholder="Select a report template" 
                    style={{ width: '100%' }} 
                    size="large"
                    onChange={setSelectedTemplate}
                    loading={loadingTemplates}
                  >
                    {templates?.map(t => (
                      <Option key={t.id} value={t.id}>{t.name}</Option>
                    ))}
                  </Select>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ marginBottom: 8 }}><Text strong>Format</Text></div>
                  <Select 
                    defaultValue="pdf" 
                    style={{ width: '100%' }} 
                    size="large"
                    onChange={setSelectedFormat}
                  >
                    <Option value="pdf">PDF Document</Option>
                    <Option value="xlsx">Excel Spreadsheet</Option>
                    <Option value="csv">CSV (Comma Separated)</Option>
                  </Select>
                </div>

                <Button 
                    type="primary" 
                    size="large" 
                    style={{ marginTop: 32 }} 
                    icon={<RocketOutlined />} 
                    block
                    loading={createReport.isPending}
                    onClick={handleGenerate}
                >
                  Generate Report
                </Button>
              </div>
            </Card>
          )
        },
        {
          key: 'history',
          label: <span><HistoryOutlined /> Generation History</span>,
          children: (
            <Card bordered={false} className="glass-card">
              <PageState
                loading={loadingHistory}
                error={null}
                isEmpty={!loadingHistory && !history?.length}
              >
                <Table 
                  dataSource={history} 
                  columns={columns} 
                  rowKey="id" 
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10 }}
                />
              </PageState>
            </Card>
          )
        }
      ]} />
    </div>
  );
}

// Helper mock icon
const RocketOutlined = () => <FileTextOutlined />;
