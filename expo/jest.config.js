const preset = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  // SDK 58: expo-modules-core `expo` altına iç içe kurulur; jest-expo onu kök çözümlemeyle arar.
  modulePaths: ['<rootDir>/node_modules/expo/node_modules'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/*.test.ts?(x)'],
  // RN 0.88: `exports` takma adları; hazır ayardaki react-native/* eşlemesi bunları dosya yolu sanıp bulamıyor.
  moduleNameMapper: {
    '^react-native/(react-private-interface|setup-env|unstable-internals-do-not-use)$': '<rootDir>/node_modules/react-native/src/$1.js',
  },
  transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
    pattern.includes('standard-navigation') ? pattern.replace('standard-navigation', 'standard-navigation|@noble/hashes') : pattern,
  ),
};
