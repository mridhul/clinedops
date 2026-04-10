import React from 'react';
import { 
  ClipboardCheck, 
  Clock, 
  ChevronRight, 
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/auth/useAuth';
import { useSurveyAssignments } from '@/api/surveys';
import { useNavigate } from 'react-router-dom';
import PageState from '@/components/common/PageState';

const PendingSurveysPage: React.FC = () => {
  const token = useAuth((s) => s.accessToken);
  const { data: assignmentsData, isLoading } = useSurveyAssignments(token);
  const navigate = useNavigate();

  const assignments = assignmentsData || [];

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-manrope font-extrabold text-foreground tracking-tight">Your Feedback Tasks</h1>
        <p className="text-muted-foreground mt-1 text-lg">Help us maintain clinical excellence by sharing your experience.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
      <PageState
        loading={isLoading}
        isEmpty={!isLoading && assignments.length === 0}
        emptyText="All caught up! No pending surveys."
        skeletonType="list"
      >
        <div className="grid grid-cols-1 gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="glass-card border-none shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardContent className="flex-1 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ClipboardCheck size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl font-manrope font-bold">{assignment.template?.name || 'Weekly Clinical Feedback'}</CardTitle>
                        <Badge variant="secondary" className="bg-surface-lowest text-muted-foreground border-border/20 font-inter text-[10px] uppercase">
                          {assignment.session_ids.length} Interactions
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm font-medium">
                        <span className="flex items-center gap-1.5 break-all">
                          <Clock size={14} className="text-primary" />
                          Due {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Next Week'}
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-600">
                          <AlertCircle size={14} />
                          Mandatory
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-40">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        <span>Progress</span>
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
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </PageState>
      </div>

      <div className="mt-12 p-6 glass-card border-primary/10 border bg-primary/5 rounded-2xl flex items-start gap-4">
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
    </div>
  );
};

export default PendingSurveysPage;
