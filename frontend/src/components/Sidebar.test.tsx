import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Sidebar from './Sidebar'

function renderSidebar(role: 'student' | 'super_admin', pathname: string) {
  return render(
    <MemoryRouter>
      <Sidebar role={role} pathname={pathname} />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('renders student menu items for student role', () => {
    renderSidebar('student', '/dashboard')

    expect(screen.getByText('My Sessions')).toBeInTheDocument()
    expect(screen.getByText('My Feedback')).toBeInTheDocument()
    expect(screen.queryByText('Students')).not.toBeInTheDocument()
  })

  it('renders admin menu items for non-student role', () => {
    renderSidebar('super_admin', '/dashboard/students')

    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('Tutors')).toBeInTheDocument()
    expect(screen.queryByText('My Sessions')).not.toBeInTheDocument()
  })
})

