import { render, screen } from '@testing-library/react'
import { ResumeAssessmentModal } from '../resume-assessment-modal'

describe('ResumeAssessmentModal', () => {
  const mockAssessment = {
    id: 'test-id',
    user_id: 'user-id',
    type: 'complete' as const,
    status: 'in_progress' as const,
    disc_results: null,
    soft_skills_results: null,
    sjt_results: null,
    created_at: '2024-01-01T10:00:00.000Z',
    completed_at: null
  }

  it('should render when open', () => {
    render(
      <ResumeAssessmentModal 
        isOpen={true}
        onClose={jest.fn()}
        assessment={mockAssessment}
        onResume={jest.fn()}
        onStartNew={jest.fn()}
      />
    )
    expect(screen.getByText('Avaliação Incompleta Encontrada')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    const { container } = render(
      <ResumeAssessmentModal 
        isOpen={false}
        onClose={jest.fn()}
        assessment={mockAssessment}
        onResume={jest.fn()}
        onStartNew={jest.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })
})