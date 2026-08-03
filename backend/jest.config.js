/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/src/tests/setup.ts'],

  // ─── Global module redirect ────────────────────────────────────────────────
  // Intercepts ALL imports of config/redis across every test file before the
  // real ioredis module is loaded, preventing any network socket creation.
  moduleNameMapper: {
    '^.*/config/redis$': '<rootDir>/src/tests/__mocks__/redis.ts',
  },

  // 30-second per-test timeout prevents silent CI hangs
  testTimeout: 30000,

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/app.ts',
    '!src/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
