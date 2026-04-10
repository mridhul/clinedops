export type TeachingHistoryStatus = 'Verified' | 'Pending'

export type AgendaItem = {
  id: string
  time: string
  title: string
  meetingPoint: string
}

export type Rotation = {
  activeRotationLabel: string
  unitName: string
  leadTutorName: string
  location: string
  leadTutorAvatarUrl: string
}

export type TeachingHistoryRow = {
  id: string
  date: string
  clinicalInteractionTitle: string
  tutorName: string
  hours: number
  status: TeachingHistoryStatus
}

export type PendingSurveyBatch = {
  id: string
  title: string
  statusLabel: string
  description: string
  actionLabel: string
}

export type PostingProgress = {
  teachingHoursLogged: number
  teachingHoursTotal: number
  feedbackRatePercent: number
}

export type ClinicalInsight = {
  title: string
  description: string
}

export type StudentPortalData = {
  displayName: string
  profileAvatarUrl: string
  currentPostingLabel: string
  currentPostingPhaseLabel: string

  rotation: Rotation
  rotationRotationMeta: string
  agendaItems: AgendaItem[]

  teachingHistoryRows: TeachingHistoryRow[]

  pendingSurveyBatch: PendingSurveyBatch
  postingProgress: PostingProgress
  clinicalInsight: ClinicalInsight

  quickActions: Array<{
    id: string
    title: string
    icon: string
  }>
}

