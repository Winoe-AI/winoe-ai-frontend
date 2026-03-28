import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/platform/(.*)$': '<rootDir>/src/platform/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.*',
    '!**/*.config.*',
    '!**/.DS_Store',
  ],
  coverageThreshold: {
    global: {
      statements: 99,
      branches: 99,
      functions: 99,
      lines: 99,
    },
    './src/**/*.{ts,tsx}': {
      statements: 99,
      branches: 99,
      functions: 99,
      lines: 99,
    },
  },
  coverageReporters: ['text', 'lcov', 'json', 'json-summary'],
  coveragePathIgnorePatterns: ['<rootDir>/.qa/'],
  testPathIgnorePatterns: [
    '<rootDir>/.qa/',
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
  ],
  watchPathIgnorePatterns: ['<rootDir>/.qa/'],
};

export default createJestConfig(customJestConfig);
