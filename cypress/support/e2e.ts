// This file is processed and loaded automatically before your test files.
// You can put global configuration and behavior that modifies Cypress here.
// Import commands.ts using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS require statements:
// require('./commands')

Cypress.on('uncaught:exception', (err) => {
  // returning false here prevents Cypress from failing the test
  return false
})