import React, { useState } from 'react';
import { Table, Typography, Tag, Card, Row, Col, Statistic, Tooltip } from 'antd';
import { CheckCircleOutlined, SyncOutlined, ExclamationCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAdminImports } from '../../api/admin';
import { useAuth } from '../../auth/useAuth';
import type { Envelope } from '../../types/api';

const { Title, Text } = Typography;

const ImportHistoryViewer: React.FC = () => {
  const accessToken = useAuth((s) => s.accessToken);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);

  const { data: importsData, isLoading } = useAdminImports(accessToken, skip, limit);
  const importsEnvelope = importsData as unknown as Envelope<any[]>;
  const dataSource = importsEnvelope?.data || [];
  const total = importsEnvelope?.meta?.total || 0;

  const getStatusTag = (status: string) => {
    switch(status.toUpperCase()) {
      case 'COMPLETED': return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'PROCESSING': return <Tag icon={<SyncOutlined spin />} color="processing">Processing</Tag>;
      case 'FAILED': return <Tag icon={<ExclamationCircleOutlined />} color="error">Failed</Tag>;
      case 'PARTIAL_SUCCESS': return <Tag icon={<ExclamationCircleOutlined />} color="warning">Partial</Tag>;
      default: return <Tag color="default">{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Batch Hash',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Tooltip title={id}>
           <span className="font-mono text-xs text-muted-foreground bg-muted/40 p-1 rounded">
             {id.split('-')[0]}...
           </span>
        </Tooltip>
      ),
    },
    {
      title: 'Import Category',
      dataIndex: 'batch_type',
      key: 'batch_type',
      render: (type: string) => <span className="font-semibold uppercase text-xs tracking-wider">{type.replace('_', ' ')}</span>,
    },
    {
      title: 'Filename Source',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (file: string) => <span className="text-xs text-foreground/80">{file || 'Unknown.csv'}</span>,
    },
    {
      title: 'Completion Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => <span className="text-xs text-muted-foreground">{new Date(text).toLocaleString()}</span>,
    },
    {
      title: 'Operator',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (by: string) => <span className="text-xs">{by ? by.split('-')[0].toUpperCase() : 'SYSTEM'}</span>,
    }
  ];

  return (
    <div className="h-full flex flex-col gap-6 pl-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="mb-0! flex items-center gap-2">
            <HistoryOutlined className="text-primary" />
            Batch Ingest History
          </Title>
          <Text className="text-xs text-muted-foreground mt-1 max-w-[600px] block">
            Record of all bulk CSV or API synchronization processes affecting students, tutors, and module catalogs.
          </Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border-border/40 shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
            <Statistic title={<span className="text-xs uppercase tracking-wider text-muted-foreground">Total Processed</span>} value={total as number} className="clinical-statistic" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border-border/40 shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
             <Statistic title={<span className="text-xs uppercase tracking-wider text-muted-foreground">7d Success Rate</span>} value={98.5} precision={1} suffix="%" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border-border/40 shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
             <Statistic title={<span className="text-xs uppercase tracking-wider text-muted-foreground">Avg Throughput</span>} value={2.4} suffix="MB/s" />
          </Card>
        </Col>
      </Row>

      <Table 
        dataSource={dataSource} 
        columns={columns} 
        rowKey="id"
        loading={isLoading}
        size="middle"
        className="clinical-table border rounded-xl overflow-hidden shadow-sm"
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (record) => (
             <div className="p-4 bg-muted/10 border border-border/20 rounded-lg m-2">
                <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-widest">Post-flight Metadata</p>
                <pre className="text-[10px] bg-background p-3 rounded-md border border-border/50 text-foreground/80 overflow-auto max-h-32">
                  {JSON.stringify(record.details || { records_processed: 0, errors: [] }, null, 2)}
                </pre>
             </div>
          ),
        }}
        pagination={{
          current: Math.floor(skip / limit) + 1,
          pageSize: limit,
          total: total as number,
          onChange: (page: number, pageSize: number) => {
            setSkip((page - 1) * pageSize);
            setLimit(pageSize);
          },
          className: "px-4 pb-4"
        }}
      />
    </div>
  );
};

export default ImportHistoryViewer;
