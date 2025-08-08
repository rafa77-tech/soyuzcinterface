// Import and test the actual client creation
describe('Supabase Client', () => {
  it('should be defined from jest setup mock', () => {
    // Test that mocks are working correctly
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://mock-project.supabase.co')
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('mock-anon-key')
  })
  
  it('should create client successfully', () => {
    // This will test the actual client creation logic when imported
    const { supabase } = require('../client')
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined() 
    expect(typeof supabase.from).toBe('function')
  })
})