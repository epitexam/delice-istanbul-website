import { defineConfig, devices } from '@playwright/test';

/**
 * Les tests de parité comparent la page Astro (servie par `astro preview`)
 * au design de référence chargé en file:// depuis tests/fixtures/.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'list' : [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  // La compilation appartient aux scripts npm (`npm test`, `npm run test:e2e`),
  // qui compilent une fois puis enchaînent : la placer aussi ici la doublerait.
  // globalSetup refuse de démarrer si dist/ n'a pas été produit.
  globalSetup: './tests/e2e/global-setup.ts',
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    // Jamais de réutilisation : un serveur déjà lancé servirait un dist/
    // obsolète, et la suite validerait alors du code qui n'est plus le nôtre.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
