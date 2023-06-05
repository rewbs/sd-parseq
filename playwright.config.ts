import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Glob patterns or regular expressions to ignore test files. 
  testIgnore: '*test-assets',

  // Glob patterns or regular expressions that match test files. 
  testMatch: '*playwright/*.spec.ts',

  timeout: 5 * 60 * 1000,
});