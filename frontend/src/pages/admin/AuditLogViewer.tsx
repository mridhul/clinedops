import React, { useState } from 'react';
import { Table, Button, Input, DatePicker, Row, Col, Typography, Tag, Card } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAdminAuditLogs } from '../../api/admin';
import { useAuth } from '../../auth/useAuth';
import PageState from '../../components/common/PageState';
import type { Envelope } from '../../types/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AuditLogViewer: React.FC = () => {
  const accessToken = useAuth((s) => s.accessToken);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(50);
  const [actionFilter, setActionFilter] = useState<string>();
  const [dateRange, setDateRange] = useState<[string, string] | [undefined, undefined]>([undefined, undefined]);

  const { data: logsData, isLoading } = useAdminAuditLogs(
    accessToken, 
    skip, 
    limit, 
    actionFilter, 
    undefined, 
    dateRange[0], 
    dateRange[1]
  );
  
  // Type coerce because TanStack's useQuery usually wraps API responses
  const logsEnvelope = logsData as unknown as Envelope<any[]>;
  const dataSource = logsEnvelope?.data || [];
  const total = logsEnvelope?.meta?.total || 0;

  const handleExport = () => {
    const qs = new URLSearchParams();
    if (actionFilter) qs.append('action', actionFilter);
    if (dateRange[0]) qs.append('date_from', dateRange[0]);
    if (dateRange[1]) qs.append('date_to', dateRange[1]);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    window.open(`${baseUrl}/admin/audit-logs/export?${qs.toString()}`, '_blank');
  };


  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => <span className="text-xs text-muted-foreground">{new Date(text).toLocaleString()}</span>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        let color = 'default';
        if (action.includes('CREATE')) color = 'green';
        if (action.includes('UPDATE') || action.includes('APPROVE')) color = 'blue';
        if (action.includes('DELETE') || action.includes('REJECT')) color = 'red';
        return <Tag color={color} className="font-medium rounded border-0 uppercase text-[10px]">{action}</Tag>;
      },
    },
    {
      title: 'Actor ID',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (id: string) => <span className="font-mono text-xs text-muted-foreground truncate w-24 block">{id || 'System'}</span>,
    },
    {
      title: 'Entity',
      key: 'entity',
      render: (_: any, record: any) => (
        <span className="text-xs font-mono">{record.entity_type || 'Unknown'} <span className="text-muted-foreground">{record.entity_id?.split('-')[0]}</span></span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-6 pl-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="mb-0!">System Audit Trail</Title>
          <p className="text-xs text-muted-foreground mt-1">Immutable ledger of all administrative and structural operations.</p>
        </div>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleExport}
          className="bg-primary hover:bg-primary/90 shadow-sm rounded-lg"
        >
          Export CSV
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm rounded-xl!" bodyStyle={{ padding: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input 
              placeholder="Search explicitly by action (e.g. APPROVE)" 
              prefix={<SearchOutlined className="text-muted-foreground" />} 
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-lg h-9"
            />
          </Col>
          <Col xs={24} md={10}>
            <RangePicker 
              className="w-full rounded-lg h-9" 
              onChange={(values) => {
                if (values && values[0] && values[1]) {
                  setDateRange([values[0].toISOString(), values[1].toISOString()]);
                } else {
                  setDateRange([undefined, undefined]);
                }
              }}
            />
          </Col>

        </Row>
      </Card>

      <PageState
        loading={isLoading}
        error={null}
        isEmpty={!isLoading && dataSource.length === 0}
        onRetry={() => {}} 
      >
        <Table 
          dataSource={dataSource} 
          columns={columns} 
          rowKey="id"
          size="small"
          className="clinical-table border rounded-xl overflow-hidden"
          scroll={{ x: 'max-content' }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-muted/20 border border-border/30 rounded-lg m-2">
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-widest">Before State</p>
                    <pre className="text-[10px] bg-background p-3 rounded-md border border-border/50 text-foreground/80 overflow-auto max-h-40">
                      {JSON.stringify(record.before_state, null, 2) || "None or N/A"}
                    </pre>
                  </Col>
                  <Col xs={24} lg={12}>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-widest">After State</p>
                    <pre className="text-[10px] bg-background p-3 rounded-md border border-border/50 text-foreground/80 overflow-auto max-h-40">
                      {JSON.stringify(record.after_state, null, 2) || "None or N/A"}
                    </pre>
                  </Col>
                </Row>
              </div>
            ),
            rowExpandable: (record) => record.action.includes('UPDATE') || record.action.includes('APPROVE') || record.action.includes('CREATE')
          }}
          pagination={{
            current: Math.floor(skip / limit) + 1,
            pageSize: limit,
            total: total as number,
            onChange: (page: number, pageSize: number) => {
              setSkip((page - 1) * pageSize);
              setLimit(pageSize);
            },
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} entries`,
            className: "px-4 pb-4"
          }}
        />
      </PageState>
    </div>
  );
};

export default AuditLogViewer;
