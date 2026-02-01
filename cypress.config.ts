import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.{spec.js,cy.js,cy.ts,ts}',
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000'
  },
  video: false,
})