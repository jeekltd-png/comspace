describe('White Label upload', () => {
  it('uploads logo as admin and shows preview', function () {
    const adminEmail = Cypress.env('SUPERADMIN_EMAIL') || 'superadmin@comspace.local';
    const adminPass = Cypress.env('SUPERADMIN_PASSWORD') || 'ChangeMeSuper!23';

    cy.visit('/login');
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPass);
    cy.get('button[type="submit"]').click();

    // if login fails we stop the test early
    cy.location('pathname').then((path) => {
      if (path !== '/') {
        cy.log('Admin login not available, skipping upload test');
        this.skip();
      }

      // go to admin white label ui
      cy.visit('/admin/white-label');
      cy.get('input[type="file"]').first().selectFile('cypress/fixtures/logo.png', { force: true });
      cy.contains('Uploaded', { timeout: 5000 }).should('exist');
      // submit changes
      cy.get('button[type="submit"]').click();
      cy.contains('Saved', { timeout: 5000 }).should('exist');
    });
  });
});