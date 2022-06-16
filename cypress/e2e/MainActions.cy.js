describe('Doing main actions on the page', () => {
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

    cy.visit('http://localhost:3000/')
    cy.get('input:first').type('testing')
    cy.get('input:last').type('testing')
    cy.get('button').should('contain', 'Log-in').click()
    cy.get('#close-btn').click()
  })

  describe('Crete new expenses', () => {
    it('Can create a newExpense', () => {
      cy.contains('New expense').click()
      cy.get('#debtors-input').type('testing2')
      cy.get('#description-input').type('a new expense')
      cy.get('#balance-input').clear().type('100')
      cy.get('#paidBy-input').type('testing')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('a new expense')
    })

    it('Second expense', () => {
      cy.contains('New expense').click()
      cy.get('#debtors-input').clear().type('testing2')
      cy.get('#description-input').clear().type('akilik')
      cy.get('#balance-input').clear().type('50')
      cy.get('#paidBy-input').clear().type('testing')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('akilik')
    })
  })

  describe('Non valid params to new expense', () => {
    beforeEach(() => {
      cy.contains('New expense').click()
    })

    afterEach(() => {
      cy.get('#close-btn').click()
    })

    it('User cannot be in debtors', () => {
      cy.get('#debtors-input').clear().type('testing')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You can not be in debtors list.')
    })

    it('A description must be set', () => {
      cy.get('#debtors-input').clear().type('testing2')
      cy.get('#description-input').type('ak')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You must set a description at least 3 characters long')
    })

    it('Balance must be set', () => {
      cy.get('#debtors-input').clear().type('testing2')
      cy.get('#description-input').clear().type('akilik')
      cy.get('#balance-input').clear().type('-1')
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You balance must be grather than 0')
    })

    it('Paid-by must be set and the creator must be among them.', () => {
      cy.get('#debtors-input').clear().type('testing2')
      cy.get('#description-input').clear().type('akilik')
      cy.get('#balance-input').clear().type('50')
      cy.get('#paidBy-input').clear()
      cy.get('#newExpense-btn').should('contain', 'Save').click()
      cy.contains('You must set payers list.')

      cy.get('#close-btn').click()
    })
  })

  describe('Acctions with dropdowns', () => {
    it('Checking the options of the dropdown currency', () => {
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

    it('Checking the options of the dropdown priority', () => {
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
      cy.get('[data-testid="ExpandMoreIcon"]').first().click()
    })

    it('Can change the state of a expense', () => {
      cy.get('select.category-ddwn').first().select('Casual')
      cy.contains('Set Category').click()

      cy.contains('Current category of this expense')
        .find('span')
        .should('contain', 'Casual')
        .should('have.class', 'category-span-green')
    })

    it('Can filter the expenses after the change of category', () => {
      cy.get('#priority-ddwn-filter').select('Casual')
      cy.get('[data-testid="ExpandMoreIcon"]').should('have.length', 1)
    })

    it('Show no expenses if no preferences with that category', () => {
      cy.get('#priority-ddwn-filter').select('Important')
      cy.contains('Add an expense to see it here!')
    })

    it('Show all expenses', () => {
      cy.get('#priority-ddwn-filter').select('All')
      cy.get('[data-testid="ExpandMoreIcon"]').should('have.length', 2)
    })
  })

  describe('Change the currency dropdown', () => {
    it('Change the currency to EUR', () => {
      cy.contains('You paid')
        .first()
        .next()
        .invoke('text')
        .then((text1) => {
          const match1 = text1.match(/(?<=\$).+/)
          const originalAmount = parseFloat(match1[0])

          cy.get('#currency-ddwn-filter').select('EUR')
          cy.wait(2000)

          cy.contains('You paid')
            .first()
            .next()
            .invoke('text')
            .then((text2) => {
              const match = text2.match(/(?<=\€).+/)
              const changedAmount = parseFloat(match[0])

              console.log(originalAmount, changedAmount)
              const res = originalAmount > changedAmount
              expect(res).to.be.true
            })
        })
    })
  })

  describe('Filter expenses', () => {
    it('Can filter and then retrieve to non filter', () => {
      cy.get('#input-filter').type('ak')
      cy.get('[data-testid="ExpandMoreIcon"]').should('have.length', 1)

      cy.get('#input-filter').clear()
      cy.get('[data-testid="ExpandMoreIcon"]').should('have.length', 2)
    })
  })
})
