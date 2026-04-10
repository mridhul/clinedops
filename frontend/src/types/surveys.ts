export interface Question {
  id: string;
  text: string;
  type: 'likert' | 'rating' | 'text' | 'multi-choice';
  options?: string[];
  required: boolean;
  lowScoreThreshold?: number;
}

export type SurveyType = 'midpoint' | 'end_of_posting' | 'ad_hoc';

export type SurveyStatus = 'pending' | 'completed' | 'expired' | 'overdue';

export interface SurveyTemplate {
  id: string;
  name: string;
  discipline: string;
  posting_type?: string;
  survey_type: SurveyType;
  questions: Question[];
  low_score_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyAssignment {
  id: string;
  template_id: string;
  student_id: string;
  posting_id?: string;
  session_ids: string[];
  tutor_ids: string[];
  status: SurveyStatus;
  due_date?: string;
  created_at: string;
  template?: SurveyTemplate;
}

export interface SurveySubmission {
  id: string;
  assignment_id?: string;
  template_id: string;
  student_id: string;
  responses: Record<string, any>;
  overall_score?: number;
  has_low_scores: boolean;
  status: string;
  created_at: string;
}

export interface TutorFeedbackSummary {
  tutor_id: string;
  average_score: number;
  total_responses: number;
  low_score_count: number;
  trends: { date: string; score: number }[];
  recent_comments: string[];
}
