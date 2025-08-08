import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../use-debounce'

jest.useFakeTimers()

describe('useDebounce', () => {
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Change the value
    rerender({ value: 'changed', delay: 500 })

    // Should still return initial value before delay
    expect(result.current).toBe('initial')

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Now should return the changed value
    expect(result.current).toBe('changed')
  })

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    rerender({ value: 'change1', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    rerender({ value: 'change2', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    // Should still be initial because timer was reset
    expect(result.current).toBe('initial')
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    // Now should be the final value
    expect(result.current).toBe('change2')
  })
})