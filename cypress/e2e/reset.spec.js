describe('Password reset flow', () => {
  it('requests reset, gets token from debug email, resets password and logs in', () => {
    const email = `e2e+reset+${Date.now()}@example.com`
    cy.registerViaApi(email)

    // Ensure debug emails are enabled on the server and cleared
    cy.clearDebugEmails()

    // Request reset via UI
    cy.visit('/forgot-password')
    cy.get('input[type="email"]').type(email)
    cy.get('button[type="submit"]').click()

    // Get last debug email and extract token
    cy.wait(200)
    cy.getDebugEmails().then((emails) => {
      expect(emails.length).to.be.greaterThan(0)
      const last = emails[emails.length - 1]
      // extract token from text (expects URL containing /reset-password/<token>)
      const m = (last.text || last.html || '').match(/reset-password\/(\w+)/)
      expect(m).to.exist
      const token = m[1]

      // Visit reset page and set new password
      cy.visit(`/reset-password/${token}`)
      cy.get('input[type="password"]').first().type('NewPass123!')
      cy.get('input[type="password"]').last().type('NewPass123!')
      cy.get('button[type="submit"]').click()

      // Login with new password
      cy.visit('/login')
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type('NewPass123!')
      cy.get('button[type="submit"]').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })
})