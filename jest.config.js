const nextJest = require('next/jest')();

module.exports = nextJest({
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@server/(.*)$': '<rootDir>/src/server/$1',
    '^@app/(.*)$': '<rootDir>/src/server/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\.(t|j)sx?$': ['@swc/jest'],
    '^.+\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
});