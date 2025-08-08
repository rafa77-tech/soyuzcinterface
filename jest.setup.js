import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
}))

// Mock window.matchMedia for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'

// --- ADIÇÃO 1: mock do Supabase (evita timeout/erros no AuthProvider)
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: 'u1' } }, error: null,
        }),
        signUp: jest.fn().mockResolvedValue({
          data: { user: { id: 'u2' } }, error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    }),
  };
});

// --- ADIÇÃO 2: mock de next/font/google (evita erro do Inter() no Jest)
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' }),
}));

// --- ADIÇÃO 3 (opcional, só se seus testes tocam código server): next/headers
jest.mock('next/headers', () => ({
  cookies: () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
