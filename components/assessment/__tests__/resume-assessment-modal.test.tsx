import { render, screen } from '@testing-library/react'
import { ResumeAssessmentModal } from '../resume-assessment-modal'

describe('ResumeAssessmentModal', () => {
  const mockAssessment = {
    id: 'test-id',
    created_at: '2024-01-01',
    assessment_type: 'combined' as const,
    progress_data: { currentStep: 1 }
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
    expect(screen.getByText('Retomar Avaliação')).toBeInTheDocument()
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