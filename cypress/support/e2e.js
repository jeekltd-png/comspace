import './commands'

// add global hooks if necessary
Cypress.on('uncaught:exception', (err, runnable) => {
  // prevent Cypress failing on irrelevant uncaught exceptions
  return false
})