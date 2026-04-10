import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/auth/useAuth';
import { useSurveyAssignments, useSubmitSurvey } from '@/api/surveys';
import { cn } from '@/lib/utils';

const SurveyFillingPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const token = useAuth((s) => s.accessToken);
  const profile = useAuth((s) => s.profile);
  
  const { data: assignmentsData } = useSurveyAssignments(token);
  const submitMutation = useSubmitSurvey(token);
  
  const assignment = assignmentsData?.find(a => a.id === assignmentId);
  const template = assignment?.template;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const questions = template?.questions || [];
  const activeQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleSubmit = () => {
    if (!assignment || !profile) return;
    
    submitMutation.mutate({
      assignment_id: assignment.id,
      template_id: assignment.template_id,
      student_id: profile.id, // Assuming profile.id is the student_id or linked
      responses
    }, {
      onSuccess: () => setIsSubmitted(true)
    });
  };

  if (!assignment || !template) {
    return <div className="p-20 text-center font-bold">Loading assessment context...</div>;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8 animate-in zoom-in duration-500">
        <Card className="max-w-md w-full glass-card border-none shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-primary" size={40} />
          </div>
          <h2 className="text-3xl font-manrope font-extrabold text-foreground mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-8 font-medium">Your feedback has been recorded and will help improve clinical education standards.</p>
          <Button onClick={() => navigate('/dashboard/surveys/pending')} className="w-full primary-gradient text-white py-6 rounded-xl font-bold">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary font-bold mb-4 cursor-pointer hover:translate-x-1 transition-transform inline-flex" onClick={() => navigate('/dashboard/surveys/pending')}>
          <ChevronLeft size={18} />
          Back to List
        </div>
        <h1 className="text-3xl font-manrope font-extrabold text-foreground tracking-tight">{template.name}</h1>
        <p className="text-muted-foreground mt-1 font-medium italic">Assignment for {assignment.session_ids.length} clinical interactions</p>
      </div>

      <div className="mb-10">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2 bg-surface-low" />
      </div>

      <Card className="glass-card border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 primary-gradient" />
        <CardHeader className="pt-10 pb-6 px-10">
          <CardTitle className="text-2xl font-manrope font-bold leading-tight">
            {activeQuestion.text}
            {activeQuestion.required && <span className="text-destructive ml-1">*</span>}
          </CardTitle>
          {activeQuestion.type === 'likert' && (
            <CardDescription className="text-sm font-medium mt-2">1 = Strongly Disagree, 5 = Strongly Agree</CardDescription>
          )}
        </CardHeader>

        <CardContent className="px-10 pb-10">
          {(activeQuestion.type === 'likert' || activeQuestion.type === 'rating') && (
            <div className="flex flex-col gap-8">
              <RadioGroup 
                value={String(responses[activeQuestion.id] || '')} 
                onValueChange={(val) => handleResponse(activeQuestion.id, parseInt(val))}
                className="flex items-center justify-between gap-2"
              >
                {[1, 2, 3, 4, 5].map((val) => (
                  <div key={val} className="flex flex-col items-center gap-3">
                    <RadioGroupItem 
                      value={String(val)} 
                      id={`q-${activeQuestion.id}-${val}`}
                      className="sr-only"
                    />
                    <Label 
                      htmlFor={`q-${activeQuestion.id}-${val}`}
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold cursor-pointer transition-all border-2",
                        responses[activeQuestion.id] === val 
                          ? "primary-gradient text-white border-primary shadow-lg scale-110" 
                          : "bg-surface-lowest text-muted-foreground border-border/10 hover:border-primary/30 hover:bg-primary/5"
                      )}
                    >
                      {val}
                    </Label>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-tighter">
                      {val === 1 ? 'Poor' : val === 5 ? 'Excellent' : ''}
                    </span>
                  </div>
                ))}
              </RadioGroup>

              {/* Conditional Logic for Low Scores */}
              {responses[activeQuestion.id] && responses[activeQuestion.id] <= template.low_score_threshold && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-6 bg-destructive/5 rounded-2xl border border-destructive/10">
                  <div className="flex items-center gap-2 text-destructive font-bold text-sm mb-3">
                    <AlertCircle size={16} />
                    Additional Feedback Needed
                  </div>
                  <Label className="text-sm font-bold text-muted-foreground mb-2 block">
                    Please provide a reason for this score (Mandatory)
                  </Label>
                  <Textarea 
                    placeholder="Describe specific interactions or areas for improvement..."
                    className="bg-white/50 border-destructive/20 focus:ring-destructive/20 min-h-[100px]"
                    value={responses[`${activeQuestion.id}_comment`] || ''}
                    onChange={(e) => handleResponse(`${activeQuestion.id}_comment`, e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {activeQuestion.type === 'text' && (
            <Textarea 
              placeholder="Your thoughts..."
              className="bg-surface-lowest/50 border-border/20 focus:ring-primary/20 min-h-[150px] text-lg p-6 rounded-2xl"
              value={responses[activeQuestion.id] || ''}
              onChange={(e) => handleResponse(activeQuestion.id, e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          disabled={currentStep === 0}
          className="font-bold text-muted-foreground hover:text-foreground h-12 px-6"
        >
          <ChevronLeft size={20} className="mr-2" />
          Previous
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={!responses[activeQuestion.id] || (responses[activeQuestion.id] <= template.low_score_threshold && !responses[`${activeQuestion.id}_comment`])}
          className="primary-gradient text-white px-8 py-6 h-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
        >
          {currentStep === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
          {currentStep !== questions.length - 1 && <ChevronRight size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default SurveyFillingPage;
