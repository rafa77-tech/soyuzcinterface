import { renderHook } from '@testing-library/react'
import { useMobile } from '../use-mobile'

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('useMobile', () => {
  it('should return false for desktop screens', () => {
    mockMatchMedia(false)
    
    const { result } = renderHook(() => useMobile())
    
    expect(result.current).toBe(false)
  })

  it('should return true for mobile screens', () => {
    mockMatchMedia(true)
    
    const { result } = renderHook(() => useMobile())
    
    expect(result.current).toBe(true)
  })
})