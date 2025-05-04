describe('Authentication - Next.js Login Page', () => {
    it('should login successfully and redirect', () => {
      cy.visit('http://localhost:3000/login'); // Adjust to your actual URL
  
      // Fill in the form
      cy.get('input[name="email"]').type('dhahbimohamedamine01@gmail.com');
      cy.get('input[name="password"]').type('hama1234');
  
      // Submit
      cy.get('button[type="submit"]').click();
  
      // Assert redirect (adapt path based on your app)
      cy.url().should('not.include', '/login');
      cy.url().should('include', '/patient/doctorlist'); // or whatever the post-login route is
    });
  });
  