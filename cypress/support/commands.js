Cypress.Commands.add('registerViaApi', (email, password = 'Password123!') => {
  const api = Cypress.env('API_URL') || 'http://localhost:5000'
  return cy.request('POST', `${api}/api/auth/register`, { email, password, firstName: 'E2E', lastName: 'User' })
})

Cypress.Commands.add('clearDebugEmails', () => {
  const api = Cypress.env('API_URL') || 'http://localhost:5000'
  return cy.request({ method: 'DELETE', url: `${api}/__debug/emails`, failOnStatusCode: false })
})

Cypress.Commands.add('getDebugEmails', () => {
  const api = Cypress.env('API_URL') || 'http://localhost:5000'
  return cy.request({ method: 'GET', url: `${api}/__debug/emails`, failOnStatusCode: false }).then((r) => r.body.emails || [])
})