const nextJest = require('next/jest')({ dir: './' });

module.exports = nextJest({
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'app/lib/local-memo-storage.ts',
    'app/lib/security.ts',
    'app/lib/utils.ts'
  ],
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/scripts/'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90,
    },
  },
});
