import { render, screen } from '@testing-library/react'

import Sidebar from './Sidebar'

describe('Sidebar', () => {
  it('renders student menu items for student role', () => {
    render(<Sidebar role="student" />)

    expect(screen.getByText('My Sessions')).toBeInTheDocument()
    expect(screen.getByText('My Feedback')).toBeInTheDocument()
    expect(screen.queryByText('Students')).not.toBeInTheDocument()
  })

  it('renders admin menu items for non-student role', () => {
    render(<Sidebar role="super_admin" />)

    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('Tutors')).toBeInTheDocument()
    expect(screen.queryByText('My Sessions')).not.toBeInTheDocument()
  })
})

