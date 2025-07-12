// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

module.exports = {
  // Basic Jest configuration for Grafana plugin
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.(ts|js|tsx|jsx)',
    '**/*.(test|spec).(ts|js|tsx|jsx)'
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/.config/jest/mocks/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^d3-interpolate$': '<rootDir>/.config/jest/mocks/d3Mock.js',
    '^d3-color$': '<rootDir>/.config/jest/mocks/d3Mock.js',
    '^d3-format$': '<rootDir>/.config/jest/mocks/d3Mock.js',
    '^d3-time$': '<rootDir>/.config/jest/mocks/d3Mock.js',
    '^d3-time-format$': '<rootDir>/.config/jest/mocks/d3Mock.js',
    '^ol/(.*)$': '<rootDir>/.config/jest/mocks/olMock.js',
    '^ol$': '<rootDir>/.config/jest/mocks/olMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(d3-interpolate|d3-color|d3-format|d3-time|d3-time-format|ol|@grafana)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageDirectory: 'static/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/static/',
    '<rootDir>/test/',
  ],
};
