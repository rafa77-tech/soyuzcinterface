import { useState, useEffect } from 'react'

/**
 * Hook para debounce de valores
 * @param value - O valor que será debounced
 * @param delay - Delay em millisegundos para o debounce
 * @returns O valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on component unmount)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
} 