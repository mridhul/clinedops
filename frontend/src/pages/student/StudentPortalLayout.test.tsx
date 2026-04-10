import { fireEvent, render, screen } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import StudentPortalLayout from './StudentPortalLayout'
import { themeConfig } from '../../theme/themeConfig'
import { useAuth } from '../../auth/useAuth'
import type { MeResponse } from '../../types/auth'

describe('StudentPortalLayout', () => {
  it('renders key student modules', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={themeConfig}>
          <MemoryRouter>
            <StudentPortalLayout />
          </MemoryRouter>
        </ConfigProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('My Schedule')).toBeInTheDocument()
    expect(await screen.findByText('Teaching History')).toBeInTheDocument()
    expect(await screen.findByText('Survey Pulse')).toBeInTheDocument()
    expect(await screen.findByText('My postings')).toBeInTheDocument()
  })

  it('opens agenda modal when an agenda item is clicked', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    })

    const profile: MeResponse = {
      id: 'student-1',
      email: 'student1@example.com',
      full_name: null,
      role: 'student',
      discipline: 'medicine',
    }

    useAuth.setState({ accessToken: null, profile })

    render(
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={themeConfig}>
          <MemoryRouter>
            <StudentPortalLayout />
          </MemoryRouter>
        </ConfigProvider>
      </QueryClientProvider>,
    )

    fireEvent.click(await screen.findByText('Morning Ward Rounds'))

    expect((await screen.findAllByText('Meeting Point: Nurse Station 5A')).length).toBeGreaterThan(0)
  })
})

