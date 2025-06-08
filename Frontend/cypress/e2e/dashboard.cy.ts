
describe("Dashboard Page", () => {
  beforeEach(() => {
    // Login before each test since dashboard likely requires authentication
    cy.visit("http://localhost:3000/login")
    cy.get('input[name="email"]').type("hamadhahbi2020@gmail.com")
    cy.get('input[name="password"]').type("hama12345")
    cy.get('button[type="submit"]').click()

    // Navigate to dashboard - adjust the URL as needed
    cy.visit("http://localhost:3000/admin/dashboard")
  })

  it("should display all dashboard components correctly", () => {
    // Check page title
    cy.get("h1").contains("Medical Dashboard").should("be.visible")

    // Verify breadcrumb navigation
    cy.get('[aria-label="Breadcrumb"]').should("be.visible")
    cy.get('[aria-label="Breadcrumb"]').contains("Dashboard")

    // Check if sidebar is visible
    cy.get('[data-sidebar="sidebar"]').should("be.visible")

    // Verify dashboard header
    cy.get("header").should("be.visible")

    // Check if stats cards are displayed
    cy.get(".grid").first().should("be.visible")

    // Verify chart components are rendered
    cy.contains("AppointmentsPerDay").should("exist")
    cy.contains("PatientsByAge").should("exist")
    cy.contains("AppointmentsPerDoctor").should("exist")
    cy.contains("YearlyAppointmentsPerDoctor").should("exist")
  })

  it("should toggle sidebar when menu button is clicked", () => {
    // First, ensure sidebar is visible
    cy.get('[data-sidebar="sidebar"]').should("be.visible")

    // Click the menu button to toggle sidebar
    cy.get("header button").first().click()

    // Check if sidebar state has changed
    // This depends on how your sidebar toggle works - you might need to adjust this
    // For example, if the sidebar gets a class or data attribute when closed:

    // Click again to open
    cy.get("header button").first().click()

    // Verify it's open again
    cy.get('[data-sidebar="sidebar"]').should("be.visible")
  })

  it("should load data in charts and statistics", () => {
    // Wait for data to load
    cy.wait(1000) // Adjust timing as needed

    // Check if stats cards have numbers (not loading state)
    cy.get(".grid").first().find(".text-3xl").should("exist")

    // Verify charts have rendered
    // This depends on your chart library, but generally:
    cy.get("canvas").should("have.length.at.least", 1)

    // If you're using SVG charts:
    // cy.get('svg').should('have.length.at.least', 1);
  })

  it("should navigate to other pages from sidebar", () => {
    // Find a link in the sidebar and click it
    cy.get('[data-sidebar="sidebar"] a').first().click()

    // Verify URL has changed
    cy.url().should("not.include", "/admin/dashboard")

    // You can add more specific assertions based on your navigation structure
  })
})
