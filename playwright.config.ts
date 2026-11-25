import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  // Retry only on CI. Locally, a failure should be looked at, not hidden.
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: isCI
    ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      // API tests don't need a browser.
      use: { baseURL: `${BASE_URL}/api/` },
    },
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      testDir: './tests/ui',
      grep: /@mobile/,
      use: { ...devices['Pixel 7'] },
    },
    // To add more browsers, install them (npx playwright install firefox webkit)
    // and add projects, for example:
    // { name: 'firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'] } },
  ],

  // Starts the Conduit app before the tests, unless it is already running.
  webServer: {
    command: 'npm run app:start',
    // The app answers 500 until its database tables exist, so wait for a real 200.
    url: `${BASE_URL}/api/tags`,
    reuseExistingServer: !isCI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
