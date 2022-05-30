const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const User = require('../models/user')
const Expense = require('../models/expense')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  //una forma de hacerlo
  // const userObjects = helper.initialUsers.map((user) => new User(user))
  // const promiseArray = userObjects.map((user) => user.save())
  // await Promise.all(promiseArray)
  await User.insertMany(helper.initialUsers)
})

describe('retorned users', () => {
  test('users are returned as json', async () => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('users in db', async () => {
    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })

  test('username of user', async () => {
    const users = await helper.usersInDb()
    const usernames = users.map((u) => u.username)
    expect(usernames).toContain(helper.initialUsers[0].username)
  })
})

describe('Adding users valid/nonValid', () => {
  test('A valid user can be added', async () => {
    const newUser = {
      username: 'test4',
      password: 'test4',
      name: 'test4',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const finalUsers = await helper.usersInDb()
    const usernames = finalUsers.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
    expect(finalUsers).toHaveLength(helper.initialUsers.length + 1)
  })

  test('A invalid user can not be added', async () => {
    const newUser = {
      username: 'tes',
      password: 'test4',
      name: 'test4',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const users = await helper.usersInDb()
    const usernames = users.map((u) => u.username)
    expect(usernames).not.toContain(newUser.username)
    expect(users).toHaveLength(helper.initialUsers.length)
  })
  test('Nonvalid user id in update', async () => {
    const nonValidId = await helper.nonUserExistingId()
    await api
      .put(`/api/users/${nonValidId}`)
      .send({
        user: helper.initialUsers[0],
        action: { type: 'AcceptAll', index: null },
      })
      .expect(404)

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })

  test('Nonvalid user id in getOneUser', async () => {
    const nonValidId = await helper.nonUserExistingId()
    await api.get(`/api/users/${nonValidId}`).expect(404)

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })
})

describe('Updating a user', () => {
  test('Updating preferences', async () => {})

  test('Non valid action to update', async () => {
    const users = await helper.usersInDb()
    const userToUpdate = users[0]

    const response = await api
      .put(`/api/users/${userToUpdate.id}`)
      .send({ userToUpdate, action: { type: 'NonValid', index: null } })

    console.log(response.body)
    expect(response.status).toBe(400)
  })

  test('Non valid id to update', async () => {
    const users = await helper.usersInDb()
    const userToUpdate = users[0]
    const nonValiduserId = await helper.nonUserExistingId()

    const response = await api
      .put(`/api/users/${nonValiduserId}`)
      .send({ userToUpdate, action: { type: 'NonValid', index: null } })

    expect(response.status).toBe(404)
  })

  test('Updating with valid data with no prev-preferences', async () => {
    const users = await helper.usersInDb()
    const expenses = await helper.expensesInDb()
    const expenseToAdd = expenses[0]
    const userToUpdate = users[0]
    const selected = 'Important'

    console.log(userToUpdate)

    const response = await api.put(`/api/users/${userToUpdate.id}`).send({
      user: userToUpdate,
      action: { type: 'Preferences', expense: expenseToAdd, selected },
    })

    console.log(response.body)
    console.log(response.status)
    const userPreferencesIds = response.body.preferences.map(
      (p) => p.expense.id,
    )
    expect(userPreferencesIds).toContain(expenseToAdd.id)
    const preferenceExpese = response.body.preferences.find(
      (p) => p.expense.id === expenseToAdd.id,
    )
    expect(preferenceExpese.category).toBe('Important')
  })
})

afterAll(() => {
  mongoose.connection.close()
})
