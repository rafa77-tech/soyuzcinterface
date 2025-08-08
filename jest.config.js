const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  fakeTimers: {
    enableGlobally: false, // Let individual tests control their timer setup
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/__tests__/e2e/'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'app/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!components/ui/**', // UI components têm menor prioridade
  ],
  coverageThreshold: {
    // Focus on critical components only to avoid false failures
    './lib/services/assessment-service.ts': {
      branches: 65,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './hooks/use-assessment-autosave.ts': {
      branches: 65,
      functions: 80,
      lines: 75,
      statements: 75,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 10000,
}

module.exports = createJestConfig(customJestConfig)