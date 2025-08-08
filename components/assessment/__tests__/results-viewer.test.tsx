import { render, screen } from '@testing-library/react'
import { ResultsViewer } from '../results-viewer'

describe('ResultsViewer', () => {
  it('should render without crashing', () => {
    const mockResults = {
      mini_disc: { dominancia: 8, influencia: 7, estabilidade: 6, consciencia: 9 },
      soft_skills: { comunicacao: 8, lideranca: 7 },
      sjt: [8, 9, 7]
    }
    
    render(<ResultsViewer results={mockResults} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})