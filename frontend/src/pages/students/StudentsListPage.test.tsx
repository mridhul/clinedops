import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import StudentsListPage from './StudentsListPage'
import { useAuth } from '../../auth/useAuth'

vi.mock('../../api/students', () => ({
  useStudentsList: () => ({
    isLoading: false,
    data: {
      items: [
        {
          id: '1',
          student_code: 'STU-1',
          email: 'a@example.com',
          full_name: 'A',
          discipline: 'medicine',
          institution: null,
          lifecycle_status: 'active_posting',
          academic_cycle_id: null,
          department_id: null,
          is_active: true,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    },
  }),
}))

describe('StudentsListPage', () => {
  it('renders filters and table', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    useAuth.setState({ accessToken: 'tok', profile: null })

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <StudentsListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Students')).toBeInTheDocument()
    expect(screen.getByText('STU-1')).toBeInTheDocument()
    expect(screen.getByText('Batch Import')).toBeInTheDocument()
  })
})
