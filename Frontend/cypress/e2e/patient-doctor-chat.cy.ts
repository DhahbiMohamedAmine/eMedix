describe('Patient-Doctor Chat', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/patient/chat')
    cy.window().then((win) => {
      win.localStorage.setItem('patientId', '16')
    })
    cy.reload()
    cy.contains('Messages').should('be.visible')
  })

  it('should allow a patient to send a message to a doctor', () => {
    // Check if there are any doctors available, if not create test appointment
    cy.get('body').then(($body) => {
      if ($body.find('h3:contains("Dr.")').length === 0) {
        cy.contains('Create Test Appointment').click()
        cy.wait(2000)
      }
    })

    // Select the first available doctor
    cy.get('h3').contains('Dr.').first().click()

    // Wait for chat interface to load
    cy.get('textarea').should('be.visible')

    // Type and send a test message
    const testMessage = 'Hello Doctor, I have a question about my recent appointment.'
    cy.get('textarea').type(testMessage)
    cy.get('button[type="button"]').last().click() // Send button

    // Verify the message appears in chat
    cy.contains(testMessage).should('be.visible')
  })
})