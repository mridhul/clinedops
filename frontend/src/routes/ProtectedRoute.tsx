import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuth((s) => s.accessToken)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

