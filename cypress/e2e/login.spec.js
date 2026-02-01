describe('Login flow', () => {
  it('registers a user and logs in (happy path)', () => {
    const email = `e2e+${Date.now()}@example.com`
    cy.registerViaApi(email)

    cy.visit('/login')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type('Password123!')
    cy.get('button[type="submit"]').click()

    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('shows an error with invalid credentials', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type('invalid@example.com')
    cy.get('input[name="password"]').type('wrongpass')
    cy.get('button[type="submit"]').click()
    cy.contains('Login failed')
  })
})