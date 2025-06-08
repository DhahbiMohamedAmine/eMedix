describe('Medicaments Page - Fetch Test', () => {
  it('should fetch and display medicaments', () => {
    // Visit the medicaments page
    cy.visit('http://localhost:3000/patient/medicaments');
    
    // Mock login state by setting localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('patientData', JSON.stringify({ patient_id: 16 }));
    });
    
    // Reload to apply the localStorage changes
    cy.reload();

    // Wait for loading state to disappear
    cy.get('.skeleton').should('not.exist', { timeout: 10000 });
    

    
    // Verify medicament content is displayed
    
  });
});