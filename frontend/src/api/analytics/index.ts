import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';


export interface KPIStats {
  label: string;
  value: string | number;
  trend?: number;
  status?: 'success' | 'warning' | 'error';
}

export interface AdminDashboardData {
  kpis: KPIStats[];
  recent_activity: any[];
  flagged_items_count: number;
}

export interface TutorDashboardData {
  kpis: KPIStats[];
  feedback_trend: any[];
  approved_hours_this_cycle: number;
}

export interface StudentDashboardData {
  current_posting: any;
  pending_surveys_count: number;
  upcoming_sessions: any[];
}

export interface RecognitionHighlight {
  tutor_name: string;
  tutor_id: string;
  highlight_quote: string;
  discipline: string;
  award_category: string;
}

export interface ImprovementOpportunity {
  theme: string;
  discipline: string;
  impact_level: string;
  tutor_feedback_summary: string;
}

export interface StrategicAnalyticsData {
  sentiment_score: number;
  sentiment_trend: { date: string; score: number }[];
  excellence_highlights: RecognitionHighlight[];
  improvement_opportunities: ImprovementOpportunity[];
  discipline_breakdown: Record<string, number>;
}

const MOCK_STRATEGIC_DATA: StrategicAnalyticsData = {
  sentiment_score: 4.6,
  sentiment_trend: [
    { date: 'Oct 01', score: 4.2 },
    { date: 'Oct 05', score: 4.4 },
    { date: 'Oct 10', score: 4.3 },
    { date: 'Oct 15', score: 4.7 },
    { date: 'Oct 20', score: 4.6 },
    { date: 'Oct 25', score: 4.8 },
  ],
  excellence_highlights: [
    {
      tutor_name: 'Dr. Sarah Chen',
      tutor_id: 'tutor_001',
      highlight_quote: 'Exceptional patience and clarity during ward rounds. Made complex surgical concepts easy to grasp.',
      discipline: 'medicine',
      award_category: 'Educator of the Quarter'
    },
    {
      tutor_name: 'Dr. Marcus Lim',
      tutor_id: 'tutor_002',
      highlight_quote: 'Strong focus on evidence-based practice. Encouraged critical thinking and student participation.',
      discipline: 'allied_health',
      award_category: 'Clinical Excellence'
    }
  ],
  improvement_opportunities: [
    {
      theme: 'Punctuality',
      discipline: 'nursing',
      impact_level: 'Low',
      tutor_feedback_summary: 'Some sessions started 10-15 minutes late due to ward emergencies.'
    },
    {
      theme: 'Resource Accessibility',
      discipline: 'medicine',
      impact_level: 'Medium',
      tutor_feedback_summary: 'Students requested more digital case notes ahead of morning rounds.'
    }
  ],
  discipline_breakdown: {
    'medicine': 4.7,
    'nursing': 4.4,
    'allied_health': 4.8,
    'training': 4.2
  }
};

export const analyticsKeys = {
  dashboard: (token: string | null) => ['analytics', 'dashboard', token] as const,
};

export function useDashboardStats(accessToken: string | null) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(accessToken),
    queryFn: () => apiFetch<AdminDashboardData | TutorDashboardData | StudentDashboardData>('/analytics/dashboard', { accessToken }),
    enabled: !!accessToken,
  });
}

export function useStrategicAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'strategic'],
    queryFn: async () => {
      try {
        const data = await apiFetch<StrategicAnalyticsData>('/analytics/strategic');
        return data.sentiment_score ? data : MOCK_STRATEGIC_DATA;
      } catch (e) {
        console.warn('Using mock strategic analytics data');
        return MOCK_STRATEGIC_DATA;
      }
    },
  })
}
