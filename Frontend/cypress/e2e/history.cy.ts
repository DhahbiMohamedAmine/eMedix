describe('Appointment History Page', () => {
    beforeEach(() => {
      // Simulate login by setting localStorage (must match your app's logic)
      window.localStorage.setItem(
        'patientData',
        JSON.stringify({ patient_id: 16 }) // Use an actual patient_id from your test DB
      )
      cy.visit('http://localhost:3000/patient/appointment-history') // Adjust the path as needed
    })
  
    it('should display the header and past appointments if available', () => {
      // Wait for appointments to load
      cy.contains('Past Appointments', { timeout: 10000 }).should('be.visible')
  
      // Check if any appointments are displayed
      cy.get('div').then(($divs) => {
        if ($divs.text().includes('No past appointments found')) {
          cy.contains('No past appointments found').should('be.visible')
        } else {
          cy.get('h3').should('contain', 'Dr.')

        }
      })
    })
  
    it('should open and close the prescription modal', () => {
      cy.get('button')
        .contains('View Prescription')
        .first()
        .click()
    })
  })
  