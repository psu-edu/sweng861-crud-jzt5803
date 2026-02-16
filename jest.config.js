const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.js',
    '<rootDir>/__tests__/frontend/**/*.test.js',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/api.test.js',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/frontend/setup.js'],
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/db.js',
    '!lib/models/**',
    'app/components/**/*.js',
    'middleware.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
};

module.exports = createJestConfig(config);
