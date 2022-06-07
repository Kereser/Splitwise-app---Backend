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
  })

  it('visit login page', () => {
    cy.contains('New user?')
  })

  it('visit signup page', () => {
    cy.contains('Sign up').click()
    cy.contains('Create account')
  })
})

describe('Visit Friend page and HomeUser', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
    cy.get('input:first').type('testing')
    cy.get('input:last').type('testing')
    cy.get('button').should('contain', 'Log-in').click()
    cy.get('#close-btn').click()
  })

  it('Can see the dashboard and updates the location', () => {
    cy.contains('Dashboard').click()
    cy.url('Location').should('includes', '/Dashboard')
  })

  it('Can see the friend page', () => {
    cy.contains('add').click()
    cy.get('#newFriend-input').type('testing2')
    cy.get('#newfriend-btn').should('contain', 'Accept').click()
    cy.contains('User testing added to friends list')
    cy.get('#close-btn').click()
    cy.contains('testing2').click()
    cy.url('Location').should('includes', '/Friends/testing2')
  })

  it("User can not add a new friend if it's not in the db", () => {
    cy.contains('add').click()
    cy.get('#newFriend-input').type('fsgsdg')
    cy.get('#newfriend-btn').should('contain', 'Accept').click()
    cy.contains("Username doesn't exist in database")
  })

  it('User already added message', () => {
    cy.contains('add').click()
    cy.get('#newFriend-input').type('testing2')
    cy.get('#newfriend-btn').should('contain', 'Accept').click()
    cy.contains('You already add this user to friends list')
  })
})
