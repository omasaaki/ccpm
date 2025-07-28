/**
 * Jest Configuration for CI/CD Tests
 */

module.exports = {
  displayName: 'CI/CD Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/ci-cd/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/ci-cd/test-setup.js'
  ],
  collectCoverageFrom: [
    'backend/src/**/*.{js,ts}',
    'frontend/src/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: '<rootDir>/tests/ci-cd/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
    '^@frontend/(.*)$': '<rootDir>/frontend/src/$1'
  }
};