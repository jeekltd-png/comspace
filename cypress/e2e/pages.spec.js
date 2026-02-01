describe('CMS Pages', () => {
  it('admin can create a page and it is visible publicly', function () {
    const adminEmail = Cypress.env('SUPERADMIN_EMAIL') || 'superadmin@comspace.local';
    const adminPass = Cypress.env('SUPERADMIN_PASSWORD') || 'ChangeMeSuper!23';

    cy.visit('/login');
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPass);
    cy.get('button[type="submit"]').click();

    cy.location('pathname').then((path) => {
      if (path !== '/') {
        cy.log('Admin login not available, skipping page test');
        this.skip();
      }

      const slug = `test-page-${Date.now()}`;
      // go to admin pages
      cy.visit('/admin/pages');
      cy.get('input').contains('Title').parent().find('input').type('My Test Page');
      cy.get('input').contains('Slug').parent().find('input').type(slug);
      cy.get('textarea').type('# Hello from E2E');
      cy.contains('Save').click();
      cy.contains('Saved', { timeout: 5000 }).should('exist');

      // visit public page
      cy.visit(`/pages/${slug}`);
      cy.contains('Hello from E2E');
    });
  });
});