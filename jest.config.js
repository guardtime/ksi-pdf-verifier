module.exports = {
  automock: false,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/ksi/**'],
  coveragePathIgnorePatterns: ['src/ksi/__tests__/test-util'],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
  coverageThreshold: {
    './src/ksi/*.js': {
      lines: 90,
      branches: 90,
    },
  },
  testPathIgnorePatterns : [
    './src/ksi/__tests__/test-util/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(@guardtime/common|@guardtime/ksi-js-api))'
  ],
  moduleNameMapper: {
    '\\.(svg)$': '<rootDir>/__mocks__/fileMock.js',
  }
};
