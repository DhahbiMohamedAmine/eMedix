import React from 'react'
import LoginPage from './login'

describe('<LoginPage />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<LoginPage />)
  })
})