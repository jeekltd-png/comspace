describe('Public pages', () => {
  it('shows the home page and navigates to login', () => {
    cy.visit('/');
    cy.contains('ComSpace');
    // try to click login link if present
    cy.get('a').contains(/login/i).click({ force: true });
    cy.url().should('include', '/login');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
  });
});