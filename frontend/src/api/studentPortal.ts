import { useQuery } from '@tanstack/react-query'

import type { StudentPortalData } from '../types/studentPortal'

type StudentPortalResponse = StudentPortalData

const MOCK_STUDENT_PORTAL: StudentPortalData = {
  displayName: 'Aisha',
  profileAvatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBM0MWy4ujaFxZQ0fXmXiQnWoIZ5au4a-j41EeBa5bHzBJti1bIZHeoilak0DgURK5sAAXU6H_LQxlend-aEYPhr1xnLGUj7evgzF5bC0M2eoY5DiYNJzskHISgQWknQV-51wfmif-jHAs2VWjj1zAzeXc7EVWupWgVe2_SthZCbE4mNQQXZslSVW2CwNB4urdD8nNiSjDicYqPtHqu6BfdWa_XkzXfkMdaJLRWWIb6gt5jQDRWB6wX2C35e527hlwLgu7DvV8hdQ',
  currentPostingLabel: 'General Surgery',
  currentPostingPhaseLabel: 'Phase 3',
  rotation: {
    activeRotationLabel: 'Active Rotation',
    unitName: 'Gastrointestinal Surgery Unit',
    leadTutorName: 'Dr. Sarah Chen',
    location: 'NUH Ward 5A',
    leadTutorAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDukTlLCN0eXPszELnnl3B9mgnhAT1ODujXOKXmlnoKZe4VUh52rNuhIfnswaRclUtT6cYJmvdgZtHRUha5tlHXDe6aYD4VrDjiv47oiNTDwb6oeQiNPJ44R_kmxBN6v2VicscS8OP5jzy24HkBCy_cQ1E4V23Mv74pmomf27QyCbozvdjRuuLy6-9jIOteml4OkLeL8gc70TIg3_EqrGqICQNcpApGm_5PxmfaL89RlJ44TDH--mpDS8HNQo5fcpEmhrCbKz6sIfo',
  },
  rotationRotationMeta: 'Week 4 of 8',
  agendaItems: [
    {
      id: 'agenda-1',
      time: '08:00',
      title: 'Morning Ward Rounds',
      meetingPoint: 'Meeting Point: Nurse Station 5A',
    },
    {
      id: 'agenda-2',
      time: '11:30',
      title: 'Case Presentation: Appendicitis',
      meetingPoint: 'Seminar Room 2, Level 3',
    },
  ],
  teachingHistoryRows: [
    {
      id: 'log-1',
      date: 'Oct 24, 2023',
      clinicalInteractionTitle: 'Bedside Ultrasound Clinic',
      tutorName: 'Dr. Marcus Lim',
      hours: 2.5,
      status: 'Verified',
    },
    {
      id: 'log-2',
      date: 'Oct 22, 2023',
      clinicalInteractionTitle: 'OPD Observation - Hernia Repair',
      tutorName: 'Dr. Sarah Chen',
      hours: 3.0,
      status: 'Pending',
    },
  ],
  pendingSurveyBatch: {
    id: 'batch-1',
    title: 'General Surgery Weekly Batch',
    statusLabel: 'Action Required',
    description:
      "We've batched your recent interactions to save you time. One survey for all last week's GS Unit sessions.",
    actionLabel: 'Start Batch Survey',
  },
  postingProgress: {
    teachingHoursLogged: 24,
    teachingHoursTotal: 40,
    feedbackRatePercent: 92,
  },
  clinicalInsight: {
    title: 'Clinical Insight',
    description:
      "You're 2 hours ahead of the average for Phase 3! Great job keeping up with the logbook.",
  },
  quickActions: [
    { id: 'qa-1', title: 'Resources', icon: 'description' },
    { id: 'qa-2', title: 'Apply Shadowing', icon: 'clinical_notes' },
    { id: 'qa-3', title: 'Contact Tutors', icon: 'mail' },
  ],
}

export function useStudentPortalData(accessToken: string | null) {
  return useQuery<StudentPortalResponse>({
    queryKey: ['studentPortal', accessToken],
    enabled: true,
    queryFn: async () => {
      // TODO: Replace this mock with a real API call once Student Portal endpoints exist.
      // Expected eventual shape: Envelope<StudentPortalData> from backend.
      if (!accessToken) {
        return MOCK_STUDENT_PORTAL
      }

      // Example future wiring:
      // return apiFetch<StudentPortalData>('/students/portal', { accessToken })
      return MOCK_STUDENT_PORTAL
    },
  })
}

