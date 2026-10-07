import { defineConfig, devices } from '@playwright/test';

// Les tests portent sur le fichier construit (dist/index.html) : npm run test:e2e le construit.
// PORT_E2E=4199 npm run test:e2e : si le port par défaut est déjà pris.
const PORT = Number(process.env.PORT_E2E) || 4185;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    {
      name: 'ordinateur',
      testIgnore: /mobile\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'telephone',
      testMatch: /mobile\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
  webServer: {
    command: `npx serve -l ${PORT} --no-clipboard dist`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
