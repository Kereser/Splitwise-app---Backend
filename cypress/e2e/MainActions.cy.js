describe('Visit main pages of the app', () => {
  before(() => {
    cy.request('POST', 'http://localhost:3001/api/testing/reset')

    const user1 = {
      username: 'testing',
      name: 'testinging',
      password: 'testing',
    }

    const user2 = {
      username: 'testing2',
      name: 'testinging2',
      password: 'testing',
    }

    cy.request('POST', 'http://localhost:3001/api/users/', user1)
    cy.request('POST', 'http://localhost:3001/api/users/', user2)
  })

  beforeEach(() => {
    cy.visit('http://localhost:3000/')
    cy.get('input:first').type('testing')
    cy.get('input:last').type('testing')
    cy.get('button').should('contain', 'Log-in').click()
    cy.get('#close-btn').click()
  })

  it('Can create a newExpense', () => {
    cy.contains('New expense').click()
    cy.get('#debtors-input').type('testing2')
    cy.get('#description-input').type('a new expense')
    cy.get('#balance-input').clear().type('100')
    cy.get('#paidBy-input').type('testing')
    cy.get('#newExpense-btn').should('contain', 'Save').click()
    cy.contains('a new expense')
  })

  describe('Non valid params to new expense', () => {
    beforeEach(() => {
      cy.contains('New expense').click()
    })
    it('User cannot be in debtors', () => {
      cy.get('#debtors-input').type('testing')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You can not be in debtors list.')
    })

    it('A description must be set', () => {
      cy.get('#debtors-input').type('testing2')
      cy.get('#description-input').type('ak')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You must set a description at least 3 characters long')
    })

    it('Balance must be set', () => {
      cy.get('#debtors-input').type('testing2')
      cy.get('#description-input').type('akilik')
      cy.get('#balance-input').clear().type('-1')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You balance must be grather than 0')
    })

    it('Paid-by must be set and the must be among them.', () => {
      cy.get('#debtors-input').type('testing2')
      cy.get('#description-input').clear().type('akilik')
      cy.get('#balance-input').clear().type('50')
      cy.get('#paidBy-input').clear()
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You must set payers list.')

      cy.get('#close-btn').click()

      cy.contains('New expense').click()
      cy.get('#debtors-input').clear().type('testing2')
      cy.get('#description-input').type('akilik')
      cy.get('#balance-input').clear().type('50')
      cy.get('#paidBy-input').clear().type('testing')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
    })
  })
  describe('Acctions with dropdowns', () => {
    it('Currency options are OK', () => {
      cy.get('#currency-ddwn-filter option')
        .first()
        .should('have.text', 'Select')
        .next()
        .should('have.text', 'USD')
        .next()
        .should('have.text', 'COP')
        .next()
        .should('have.text', 'EUR')
        .next()
        .should('have.text', 'ARS')
    })

    it('Priority options are OK', () => {
      cy.get('#priority-ddwn-filter option')
        .first()
        .should('have.text', 'Select')
        .next()
        .should('have.text', 'Important')
        .next()
        .should('have.text', 'Intermediate')
        .next()
        .should('have.text', 'Casual')
    })
  })

  describe('Can change and filter by the priority of expense', () => {
    it('Can drowdown the expense', () => {
      cy.get('[data-testid="ExpandMoreIcon"]').first().click({ multiple: true })
    })
  })
})
