import '@testing-library/jest-dom'

// Mock Next.js Environment
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Headers(options.headers || {})
    this.body = options.body
  }
  async json() {
    return JSON.parse(this.body || '{}')
  }
}

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Headers(options.headers || {})
    this.ok = this.status >= 200 && this.status < 300
  }
  async json() {
    return JSON.parse(this.body)
  }
  async text() {
    return this.body
  }
}

global.Headers = class MockHeaders {
  constructor(init) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }
  get(name) {
    return this.headers.get(name.toLowerCase()) || null
  }
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  }
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends global.Request {},
  NextResponse: {
    json: (body, init) => {
      const response = new global.Response(JSON.stringify(body), init)
      response.json = async () => body
      return response
    }
  }
}))

// Mock Supabase clients
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    }))
  }
}))

jest.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    }))
  }))
}))

// Global test setup
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock timers configuration
beforeEach(() => {
  jest.clearAllMocks()
})