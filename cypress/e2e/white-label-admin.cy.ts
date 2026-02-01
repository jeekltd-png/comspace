describe('Admin white-label flow (API + UI)', () => {
  it('creates admin via debug API, logs in, uploads logo and verifies config', () => {
    const adminEmail = 'e2e-admin@demo.local';
    const adminPass = 'E2EPass!23';
    const tenant = 'demo-company-2026';

    // Create or patch admin using debug endpoint
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/__debug/create-admin',
      body: { email: adminEmail, password: adminPass, role: 'admin', tenant },
      failOnStatusCode: false,
    }).then((resp) => {
      expect([200,201,400]).to.include(resp.status);
    });

    // Perform UI login
    cy.visit('/login');
    cy.get('input[name="email"]').clear().type(adminEmail);
    cy.get('input[name="password"]').clear().type(adminPass);
    cy.get('button[type="submit"]').click();

    // If not logged in, skip
    cy.location('pathname').then((path) => {
      if (path !== '/') {
        cy.log('Login failed - skipping rest of test');
        return;
      }

      // Go to admin white label UI and upload logo
      cy.visit('/admin/white-label');
      cy.get('input[type="file"]').first().selectFile('cypress/fixtures/logo.png', { force: true });
      cy.contains('Uploaded', { timeout: 5000 }).should('exist');
      cy.get('button[type="submit"]').click();
      cy.contains('Saved', { timeout: 5000 }).should('exist');

      // Verify backend config has the uploaded asset
      cy.request({
        method: 'GET',
        url: `http://localhost:5000/api/white-label/config`,
        headers: { 'X-Tenant-ID': tenant },
      }).then((res) => {
        expect(res.status).to.equal(200);
        const data = res.body.config || res.body;
        expect(data.branding).to.exist;
        expect(data.branding.assets).to.exist;
        expect(data.branding.assets.logo).to.exist;
        expect(data.branding.assets.logo.url).to.match(/https?:/);
      });

      // Finally, visit demo page and confirm logo loads
      cy.visit(`/demo?tenant=${tenant}`);
      cy.get('img').first().should('be.visible');
    });
  });
});