describe('Login page sign up prompt', () => {
  it('shows sign up link when viewing login', () => {
    cy.visit('/login');
    cy.contains('No account?').should('exist');
    cy.get('a').contains('Create an account').should('have.attr', 'href', '/register');
  });
});