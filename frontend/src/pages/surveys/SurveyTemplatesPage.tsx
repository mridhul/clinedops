import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  ChevronRight,
  ClipboardList,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Button as AntButton } from 'antd';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/auth/useAuth';
import { 
  useSurveyTemplates, 
  useCreateSurveyTemplate, 
  useDeleteSurveyTemplate, 
  useBatchAssignSurveys,
  useManualAssignSurveys
} from '@/api/surveys';
import { useStudentsList } from '@/api/students';
import { useTutorsList } from '@/api/tutors';
import { usePostingsList } from '@/api/postings';
import { apiFetch } from '@/api/client';
import PageState from '@/components/common/PageState';
import { Modal, Form, Select as AntSelect, Input as AntInput, InputNumber, Divider, message, Popconfirm, Drawer, Descriptions, Tag } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';

const SurveyTemplatesPage: React.FC = () => {
  const token = useAuth((s) => s.accessToken);
  const { data: envelope, isLoading } = useSurveyTemplates(token);
  const createMutation = useCreateSurveyTemplate(token);
  const deleteMutation = useDeleteSurveyTemplate(token);
  const batchMutation = useBatchAssignSurveys(token);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [manualAssignOpen, setManualAssignOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [manualAssignForm] = Form.useForm();

  const manualAssignMutation = useManualAssignSurveys(token);
  const { data: studentsData } = useStudentsList(token, { limit: 200 });
  const { data: tutorsData } = useTutorsList(token, { limit: 200 });
  const { data: postingsData } = usePostingsList(token, { limit: 200 });

  const profile = useAuth((s) => s.profile);
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'programme_admin';

  const templates = envelope || [];

  const filteredTemplates = templates.filter(t => 
    (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (t.discipline?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (values: any) => {
    try {
      const payload = {
        ...values,
        questions: values.questions.map((q: any, idx: number) => ({
          ...q,
          id: `q_${Date.now()}_${idx}`,
          low_score_threshold: q.low_score_threshold ?? values.low_score_threshold,
          options: q.type === 'multi-choice' && q.options 
            ? typeof q.options === 'string' ? q.options.split(',').map((o: string) => o.trim()) : q.options
            : undefined
        }))
      };

      await createMutation.mutateAsync(payload);
      message.success('Survey template created successfully');
      setCreateOpen(false);
      form.resetFields();
    } catch (e) {}
  };

  const handleUpdate = async (values: any) => {
    if (!selectedTemplate) return;
    try {
      const payload = {
        ...values,
        questions: values.questions.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `q_${Date.now()}_${idx}`,
          low_score_threshold: q.low_score_threshold ?? values.low_score_threshold,
          options: q.type === 'multi-choice' && q.options 
            ? typeof q.options === 'string' ? q.options.split(',').map((o: string) => o.trim()) : q.options
            : undefined
        }))
      };

      // We need a custom update hook that takes an ID
      // For now we use a simpler approach or just mutate directly
      await apiFetch(`/templates/${selectedTemplate.id}`, { 
        method: 'PATCH', 
        body: payload, 
        accessToken: token 
      });
      
      message.success('Survey template updated successfully');
      setEditOpen(false);
      setSelectedTemplate(null);
      // invalidate handled by caller or just let react-query handle it if we used the hook
    } catch (e) {
      message.error('Failed to update template');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Template deleted');
    } catch (e) {}
  };

  const handleBatchAssign = async () => {
    try {
      await batchMutation.mutateAsync();
    } catch (e) {}
  };

  const handleManualAssign = async (values: any) => {
    if (!selectedTemplate) return;
    try {
      await manualAssignMutation.mutateAsync({
        template_id: selectedTemplate.id,
        ...values
      });
      setManualAssignOpen(false);
      manualAssignForm.resetFields();
    } catch (e) {}
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-foreground tracking-tight">Survey Templates</h1>
          <p className="text-muted-foreground mt-1">Design and manage feedback instruments across disciplines.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
             <AntButton 
              onClick={handleBatchAssign}
              loading={batchMutation.isPending}
              className="border-primary/30 text-primary h-12 px-6 rounded-xl font-bold hover:bg-primary/5 transition-all flex items-center gap-2"
            >
              <ThunderboltOutlined />
              Auto-Assign Surveys
            </AntButton>
            <Button 
              onClick={() => {
                form.resetFields();
                setCreateOpen(true);
              }}
              className="primary-gradient text-white px-6 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus size={18} />
              Create Template
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card md:col-span-2 lg:col-span-3 border-none shadow-sm mb-2">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search templates by name or discipline..." 
                className="pl-10 bg-surface-lowest/50 border-border/20 focus:ring-primary/20 rounded-lg h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-lowest/50 rounded-lg border border-border/20 text-sm font-medium text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {templates.length} Total Templates
            </div>
          </CardContent>
        </Card>

      </div>

      <PageState
        loading={isLoading}
        isEmpty={!isLoading && filteredTemplates.length === 0}
        emptyText="No templates found matching your search."
        skeletonType="cards"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="glass-card border-none shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-inter text-[10px] uppercase tracking-wider font-bold">
                    {template.survey_type.replace('_', ' ')}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 glass-card border-border/20">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedTemplate(template);
                          editForm.setFieldsValue({
                            ...template,
                            questions: template.questions.map((q: any) => ({
                              ...q,
                              options: Array.isArray(q.options) ? q.options.join(', ') : q.options
                            }))
                          });
                          setEditOpen(true);
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Edit size={14} /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedTemplate(template);
                          manualAssignForm.resetFields();
                          setManualAssignOpen(true);
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <UserPlus size={14} /> Manual Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer"><Copy size={14} /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Popconfirm
                          title="Delete Template"
                          description="Are you sure you want to delete this template?"
                          onConfirm={() => handleDelete(template.id)}
                          okText="Yes"
                          cancelText="No"
                          okButtonProps={{ danger: true }}
                        >
                          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-destructive cursor-pointer hover:bg-destructive/10 outline-none">
                            <Trash2 size={14} /> Delete
                          </div>
                        </Popconfirm>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-xl font-manrope font-bold group-hover:text-primary transition-colors mt-2">{template.name}</CardTitle>
                <CardDescription className="text-sm font-inter">{template.discipline}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <ClipboardList size={14} />
                    {template.questions.length} Questions
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedTemplate(template);
                      setViewOpen(true);
                    }}
                    className="text-primary hover:text-primary hover:bg-primary/5 font-bold gap-1 group-hover:translate-x-1 transition-all"
                  >
                    View Details
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageState>

      <Modal
        title={<span className="font-manrope font-bold text-xl">Create New Survey Template</span>}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={720}
        destroyOnClose
        className="rounded-2xl overflow-hidden"
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleCreate} 
          className="mt-6"
          initialValues={{ 
            survey_type: 'end_of_posting',
            questions: [{ text: '', type: 'likert', required: true }] 
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label={<span className="font-bold">Template Name</span>} rules={[{ required: true }]}>
              <AntInput placeholder="e.g. End of Med Posting Evaluation" className="rounded-lg py-2" />
            </Form.Item>
            <Form.Item name="discipline" label={<span className="font-bold">Target Discipline</span>} rules={[{ required: true }]}>
              <AntSelect className="w-full h-10 rounded-lg">
                <AntSelect.Option value="medicine">Medicine</AntSelect.Option>
                <AntSelect.Option value="nursing">Nursing</AntSelect.Option>
                <AntSelect.Option value="allied_health">Allied Health</AntSelect.Option>
                <AntSelect.Option value="training">Training</AntSelect.Option>
              </AntSelect>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="survey_type" label={<span className="font-bold">Survey Timing</span>} rules={[{ required: true }]}>
              <AntSelect className="w-full h-10">
                <AntSelect.Option value="midpoint">Midpoint Review</AntSelect.Option>
                <AntSelect.Option value="end_of_posting">End of Posting</AntSelect.Option>
                <AntSelect.Option value="ad_hoc">Ad-hoc Feedback</AntSelect.Option>
              </AntSelect>
            </Form.Item>
            <Form.Item name="low_score_threshold" label={<span className="font-bold">Low Score Alert Buffer</span>} rules={[{ required: true }]} tooltip="Scores at or below this value will trigger a governance notification.">
              <InputNumber min={0} max={5} step={0.5} className="w-full h-10 flex items-center rounded-lg" />
            </Form.Item>
          </div>

          <Divider orientation="left" className="font-bold text-muted-foreground">Question Builder</Divider>

          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} className="bg-surface-low border-none shadow-sm shadow-slate-200/50 p-4">
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-4">
                        <Form.Item
                          {...restField}
                          name={[name, 'text']}
                          rules={[{ required: true, message: 'Question text is required' }]}
                          className="mb-0"
                        >
                          <AntInput.TextArea placeholder="Enter question text..." autoSize={{ minRows: 2 }} className="rounded-lg" />
                        </Form.Item>
                        <div className="flex gap-4">
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            rules={[{ required: true }]}
                            className="flex-1 mb-0"
                          >
                            <AntSelect placeholder="Type" className="h-9">
                              <AntSelect.Option value="likert">Likert Scale (1-5)</AntSelect.Option>
                              <AntSelect.Option value="rating">Numeric Rating</AntSelect.Option>
                              <AntSelect.Option value="text">Written Response</AntSelect.Option>
                              <AntSelect.Option value="multi-choice">Multiple Choice</AntSelect.Option>
                            </AntSelect>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'required']}
                            valuePropName="checked"
                            className="mb-0 pt-1"
                          >
                            <span className="text-sm font-medium pr-2">Required</span>
                          </Form.Item>
                        </div>
                        
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) => 
                            prevValues.questions?.[name]?.type !== currentValues.questions?.[name]?.type
                          }
                        >
                          {({ getFieldValue }) => 
                            getFieldValue(['questions', name, 'type']) === 'multi-choice' ? (
                              <Form.Item
                                {...restField}
                                name={[name, 'options']}
                                label={<span className="text-xs font-bold text-muted-foreground">Options (comma separated)</span>}
                                rules={[{ required: true, message: 'Please provide options' }]}
                                className="mt-2 mb-0"
                              >
                                <AntInput placeholder="Excellent, Good, Fair, Poor" className="rounded-md h-8 text-xs" />
                              </Form.Item>
                            ) : null
                          }
                        </Form.Item>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10" 
                        onClick={() => remove(name)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => add()} 
                  className="w-full border-dashed border-2 py-8 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all font-bold"
                >
                  <PlusOutlined />
                  Add New Question
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Edit Modal - Reuses logic from Create Modal */}
      <Modal
        title={<span className="font-manrope font-bold text-xl">Edit Survey Template</span>}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        width={720}
        destroyOnClose
      >
        <Form 
          form={editForm} 
          layout="vertical" 
          onFinish={handleUpdate} 
          className="mt-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label={<span className="font-bold">Template Name</span>} rules={[{ required: true }]}>
              <AntInput className="rounded-lg py-2" />
            </Form.Item>
            <Form.Item name="discipline" label={<span className="font-bold">Target Discipline</span>}>
              <AntSelect className="w-full h-10 rounded-lg">
                <AntSelect.Option value="medicine">Medicine</AntSelect.Option>
                <AntSelect.Option value="nursing">Nursing</AntSelect.Option>
                <AntSelect.Option value="allied_health">Allied Health</AntSelect.Option>
                <AntSelect.Option value="training">Training</AntSelect.Option>
              </AntSelect>
            </Form.Item>
          </div>
          <Form.Item name="low_score_threshold" label={<span className="font-bold">Low Score Alert Buffer</span>} rules={[{ required: true }]}>
            <InputNumber min={0} max={5} className="w-full h-10" />
          </Form.Item>
          
          <Divider orientation="left" className="font-bold">Questions</Divider>
          
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} className="bg-surface-low p-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-4">
                        <Form.Item {...restField} name={[name, 'text']} rules={[{ required: true }]} className="mb-0">
                          <AntInput.TextArea autoSize={{ minRows: 2 }} />
                        </Form.Item>
                        <div className="flex gap-4">
                          <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true }]} className="flex-1 mb-0">
                            <AntSelect className="h-9">
                              <AntSelect.Option value="likert">Likert Scale (1-5)</AntSelect.Option>
                              <AntSelect.Option value="rating">Numeric Rating</AntSelect.Option>
                              <AntSelect.Option value="text">Written Response</AntSelect.Option>
                              <AntSelect.Option value="multi-choice">Multiple Choice</AntSelect.Option>
                            </AntSelect>
                          </Form.Item>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove(name)} className="text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={() => add()} className="w-full">
                  <PlusOutlined /> Add Question
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Manual Assign Modal */}
      <Modal
        title={<span className="font-manrope font-bold text-xl">Manual Assign Survey</span>}
        open={manualAssignOpen}
        onCancel={() => setManualAssignOpen(false)}
        onOk={() => manualAssignForm.submit()}
        confirmLoading={manualAssignMutation.isPending}
        width={600}
        destroyOnClose
      >
        <Form 
          form={manualAssignForm} 
          layout="vertical" 
          onFinish={handleManualAssign} 
          className="mt-6"
        >
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-bold">Template: {selectedTemplate?.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedTemplate?.discipline}</p>
          </div>

          <Form.Item name="student_ids" label={<span className="font-bold">Students (Required)</span>} rules={[{ required: true, message: 'Select at least one student' }]}>
            <AntSelect 
              mode="multiple" 
              className="w-full" 
              placeholder="Select students"
              optionFilterProp="children"
              showSearch
            >
              {studentsData?.items.map(s => (
                <AntSelect.Option key={s.id} value={s.id}>
                  {s.full_name || s.email} ({s.student_code})
                </AntSelect.Option>
              ))}
            </AntSelect>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="tutor_ids" label={<span className="font-bold">Linked Tutors (Optional)</span>}>
              <AntSelect 
                mode="multiple" 
                className="w-full" 
                placeholder="Select tutors"
                optionFilterProp="children"
                showSearch
              >
                {tutorsData?.items.map(t => (
                  <AntSelect.Option key={t.id} value={t.id}>
                    {t.full_name || t.email}
                  </AntSelect.Option>
                ))}
              </AntSelect>
            </Form.Item>

            <Form.Item name="posting_id" label={<span className="font-bold">Linked Posting (Optional)</span>}>
              <AntSelect 
                className="w-full" 
                placeholder="Select posting"
                optionFilterProp="children"
                showSearch
                allowClear
              >
                {postingsData?.items.map(p => (
                  <AntSelect.Option key={p.id} value={p.id}>
                    {p.title}
                  </AntSelect.Option>
                ))}
              </AntSelect>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* View Details Drawer */}
      <Drawer
        title={<span className="font-manrope font-bold text-xl">{selectedTemplate?.name} Details</span>}
        placement="right"
        onClose={() => setViewOpen(false)}
        open={viewOpen}
        width={600}
      >
        {selectedTemplate && (
          <div className="space-y-8">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Discipline"><Tag color="blue">{selectedTemplate.discipline}</Tag></Descriptions.Item>
              <Descriptions.Item label="Type"><Tag color="green">{selectedTemplate.survey_type.replace('_', ' ')}</Tag></Descriptions.Item>
              <Descriptions.Item label="Low Score Buffer">{selectedTemplate.low_score_threshold}</Descriptions.Item>
              <Descriptions.Item label="Created At">{new Date(selectedTemplate.created_at).toLocaleDateString()}</Descriptions.Item>
            </Descriptions>

            <div>
              <h3 className="text-lg font-bold mb-4">Survey Questions ({selectedTemplate.questions.length})</h3>
              <div className="space-y-4">
                {selectedTemplate.questions.map((q: any, i: number) => (
                  <Card key={i} className="bg-surface-lowest border-border/10">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i+1}</div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{q.text}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                          {q.required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
                        </div>
                        {q.options && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {q.options.map((opt: string, j: number) => (
                              <Tag key={j} className="text-[10px] m-0">{opt}</Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SurveyTemplatesPage;
