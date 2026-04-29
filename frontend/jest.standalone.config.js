const path = require('path');
const src = path.resolve(__dirname, 'src');

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  roots: [src],
  testMatch: ['**/__tests__/**/*.{js,jsx}'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!(lucide-react)/)'],
};
