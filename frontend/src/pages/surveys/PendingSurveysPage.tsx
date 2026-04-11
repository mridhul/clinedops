import React from 'react';
import { 
  ClipboardCheck, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/auth/useAuth';
import { useSurveyAssignments } from '@/api/surveys';
import { useNavigate } from 'react-router-dom';
import PageState from '@/components/common/PageState';
import { cn } from '@/lib/utils';

const PendingSurveysPage: React.FC = () => {
  const token = useAuth((s) => s.accessToken);
  const { data: assignmentsData, isLoading } = useSurveyAssignments(token);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'pending' | 'completed'>('pending');

  const assignments = assignmentsData || [];
  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const completedAssignments = assignments.filter(a => a.status === 'completed');
  
  const currentList = activeTab === 'pending' ? pendingAssignments : completedAssignments;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-manrope font-extrabold text-foreground tracking-tight">Clinical Assessments</h1>
        <p className="text-muted-foreground mt-1 text-lg font-medium">Coordinate your feedback tasks and review your completed submissions.</p>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-1 p-1 bg-surface-low rounded-2xl mb-8 w-fit border border-border/10 shadow-inner">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "px-8 py-3 rounded-xl font-bold font-manrope transition-all duration-300 flex items-center gap-2",
            activeTab === 'pending' 
              ? "bg-white text-primary shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-white/30"
          )}
        >
          <Clock size={18} />
          Pending Tasks
          {pendingAssignments.length > 0 && (
            <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
              {pendingAssignments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            "px-8 py-3 rounded-xl font-bold font-manrope transition-all duration-300 flex items-center gap-2",
            activeTab === 'completed' 
              ? "bg-white text-primary shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-white/30"
          )}
        >
          <CheckCircle2 size={18} className="text-emerald-500" />
          Completed
          {completedAssignments.length > 0 && (
            <span className="ml-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px]">
              {completedAssignments.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
      <PageState
        loading={isLoading}
        isEmpty={!isLoading && currentList.length === 0}
        emptyText={activeTab === 'pending' ? "All caught up! No pending surveys." : "No completed surveys yet."}
        skeletonType="list"
      >
        <div className="grid grid-cols-1 gap-6">
          {currentList.map((assignment) => (
            <Card key={assignment.id} className="glass-card border-none shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className={cn(
                  "md:w-2 transition-colors",
                  activeTab === 'pending' ? "bg-primary/20 group-hover:bg-primary" : "bg-emerald-400"
                )} />
                <CardContent className="flex-1 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      activeTab === 'pending' ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {activeTab === 'pending' ? <ClipboardCheck size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl font-manrope font-bold">{assignment.template?.name || 'Weekly Clinical Feedback'}</CardTitle>
                        <Badge variant="secondary" className="bg-surface-lowest text-muted-foreground border-border/20 font-inter text-[10px] uppercase">
                          {assignment.session_ids.length} Interactions
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm font-medium">
                        {activeTab === 'pending' ? (
                          <>
                            <span className="flex items-center gap-1.5 break-all text-amber-600">
                              <AlertCircle size={14} />
                              Due {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Next Week'}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground opacity-60">
                              Mandatory Requirement
                            </span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
                            Successfully Submitted
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {activeTab === 'pending' ? (
                      <>
                        <div className="flex-1 md:w-32">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            <span>Ready to start</span>
                            <span>0%</span>
                          </div>
                          <Progress value={0} className="h-1.5 bg-surface-low" />
                        </div>
                        <Button 
                          onClick={() => navigate(`/dashboard/surveys/fill/${assignment.id}`)}
                          className="primary-gradient text-white px-6 py-5 rounded-xl font-bold font-manrope shadow-md group-hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                          Start Survey
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm">
                        <CheckCircle2 size={16} />
                        Completed
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </PageState>
      </div>

      {activeTab === 'pending' && (
        <div className="mt-12 p-6 glass-card border-primary/10 border bg-primary/5 rounded-2xl flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Feedback Policy</h4>
            <p className="text-sm text-primary/80 leading-relaxed font-medium">
              Surveys are batched weekly to value your time. Completion of mandatory clinical surveys is required for final sign-off on your posting requirements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingSurveysPage;
