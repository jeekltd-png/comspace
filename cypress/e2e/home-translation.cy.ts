describe('Home translations', () => {
  it('renders readable copy and no raw translation keys', () => {
    // Visit default English page explicitly to avoid redirects
    cy.visit('/en');

    // Ensure human-readable headline appears
    cy.contains('Welcome to ComSpace').should('exist');

    // Ensure raw translation keys are not visible anywhere on the page
    cy.contains('home.hero.title').should('not.exist');
    cy.contains('home.featured.title').should('not.exist');
  });
});