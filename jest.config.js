/** @type {import('jest').Config} */
const config = {
  verbose: true,
  transform: {
  '^.+\\.tsx?$': 'ts-jest',
  },
  setupFiles: [
    "fake-indexeddb/auto"
  ],
  testMatch: ["<rootDir>/src/**/?(*.)test.ts"],
};

export default config;