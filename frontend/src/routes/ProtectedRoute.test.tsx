import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../auth/useAuth'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuth.setState({ accessToken: null, profile: null })
  })

  it('redirects to login when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})

