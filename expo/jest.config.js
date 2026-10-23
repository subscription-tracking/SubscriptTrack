const preset = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts?(x)'],
  transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
    pattern.includes('standard-navigation') ? pattern.replace('standard-navigation', 'standard-navigation|@noble/hashes') : pattern,
  ),
};
