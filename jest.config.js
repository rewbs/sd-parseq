/** @type {import('jest').Config} */
const config = {
  verbose: true,
  transform: {
  '^.+\\.tsx?$': 'ts-jest',
  },
  setupFiles: [
    "fake-indexeddb/auto"
  ]
};

export default config;