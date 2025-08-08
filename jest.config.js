const nextJest = require('next/jest')();

module.exports = nextJest({
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    // serverやappのエイリアスは使われていないため削除
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
