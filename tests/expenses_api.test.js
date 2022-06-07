const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Expense = require('../models/expense')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await Expense.deleteMany({})
  await User.deleteMany({})
  await User.insertMany(helper.initialUsers)
  await Expense.insertMany(helper.initialExpenses)
})

describe('Adition of expenses', () => {
  test('New expense added correctly', async () => {
    const newExpenseData = {
      paidBy: 'test3',
      debtor: 'test',
      description: 'Testing from t3 to t',
      balance: 20,
      percentage: 50,
      user: { username: 'test3' },
    }

    await api
      .post('/api/expenses')
      .send(newExpenseData)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const expensesInDb = await helper.expensesInDb()
    expect(expensesInDb).toHaveLength(helper.initialExpenses.length + 1)

    const lastAdded = expensesInDb.pop()
    expect(lastAdded.description).toContain('Testing from t3 to t')
    expect(lastAdded.balance).toBe(20)
    expect(lastAdded.paidBy[0].username).toBe('test3')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
    const test3User = users.find((u) => u.username === 'test3')
    const testUser = users.find((u) => u.username === 'test')
    const arrIdFriends = testUser.friends.map((f) => f.toString())
    expect(arrIdFriends).toContain(test3User.id)
  })

  test('Non valid expense id', async () => {
    const nonValidId = await helper.nonExistingExpenseId()

    await api.put(`/api/expenses/${nonValidId}`).expect(404)
    const expenses = await helper.expensesInDb()
    expect(expenses).toHaveLength(helper.initialExpenses.length)
  })

  //Aqui tengo q hacer un test cuando pase la logica al backend para rechazar una expense q no cumpla con las condiciones requeridas.
})

describe('get Expenses', () => {
  test('get all expenses', async () => {
    const expenses = await api.get('/api/expenses').expect(200)
    expect(expenses.body).toHaveLength(helper.initialExpenses.length)
  })

  test('get updatedUser', async () => {
    const expenses = await helper.expensesInDb()
    const test2Expense = expenses[0]
    const users = await helper.usersInDb()
    const test2User = users[1]

    await api
      .put(`/api/expenses/${test2Expense.id}`)
      .send({ expense: test2Expense, user: test2User, type: 'TotalPay' })

    const updatedExpense = await helper.expensesInDb()
    const debtorDebt = updatedExpense[0].debtors.find(
      (d) => d.username === test2User.username,
    )
    expect(debtorDebt.amount).toBe(0)
    expect(updatedExpense).toHaveLength(helper.initialExpenses.length)
  })
})

describe('Partial/total payments', () => {
  test('Partial payment', async () => {
    const expenses = await helper.expensesInDb()
    const expenseToTransfer = expenses[0]
    const users = await helper.usersInDb()
    const userPay = users[1]

    await api
      .put(`/api/expenses/${expenseToTransfer.id}`)
      .send({ expense: expenseToTransfer, user: userPay, type: 'TotalPay' })

    const updatedExpenses = await helper.expensesInDb()
    const expenseToTest = updatedExpenses.find(
      (e) => e.id === expenseToTransfer.id,
    )

    const debtorDebt = expenseToTest.debtors.find(
      (d) => d.username === userPay.username,
    ).amount
    const payerAmount = expenseToTest.paidBy.find(
      (p) => p.username === 'test',
    ).amount
    expect(debtorDebt).toBe(0)
    expect(payerAmount).toBe(50)
    expect(updatedExpenses).toHaveLength(helper.initialExpenses.length)
  })
})

describe('Trasnfer debt', () => {
  test('Transfer debt to a payer', async () => {
    const expenses = await helper.expensesInDb()
    const expenseToTransfer = expenses[0]
    const users = await helper.usersInDb()
    const payerUser = users[0]
    const senderUser = users[1]

    await api
      .put(`/api/expenses/${expenseToTransfer.id}`)
      .send({
        notification: {
          expense: expenseToTransfer,
          senderUser: { username: senderUser.username, id: senderUser.id },
        },
        user: payerUser,
        type: 'Transfer',
      })
      .expect(200)

    const updatedExpenses = await helper.expensesInDb()
    const expenseToTest = updatedExpenses.find(
      (e) => e.id === expenseToTransfer.id,
    )

    const debtorDebt = expenseToTest.debtors.find(
      (d) => d.username === 'test2',
    ).amount
    const payerDebt = expenseToTest.paidBy.find(
      (d) => d.username === payerUser.username,
    ).amount
    console.log(payerDebt, 'payers', debtorDebt, 'debtors')
    expect(payerDebt).toBe(50)
    expect(debtorDebt).toBe(0)
    expect(updatedExpenses).toHaveLength(helper.initialExpenses.length)
  })

  test('transfer debt to a debtor', async () => {
    const expenses = await helper.expensesInDb()
    const expenseToTransfer = expenses[2]
    const users = await helper.usersInDb()
    const senderUser = users[0]
    const recieverUser = users[2]

    await api
      .put(`/api/expenses/${expenseToTransfer.id}`)
      .send({
        notification: {
          expense: expenseToTransfer,
          senderUser: { username: senderUser.username, id: senderUser.id },
        },
        user: recieverUser,
        type: 'Transfer',
      })
      .expect(200)

    const updatedExpenses = await helper.expensesInDb()
    const expenseToTest = updatedExpenses.find(
      (e) => e.id === expenseToTransfer.id,
    )

    const senderDebtor = expenseToTest.debtors.find(
      (d) => d.username === senderUser.username,
    ).amount
    const debtorDebt = expenseToTest.debtors.find(
      (d) => d.username === recieverUser.username,
    ).amount
    const payer = expenseToTest.paidBy.find(
      (d) => d.username === 'test2',
    ).amount

    expect(senderDebtor).toBe(0)
    expect(debtorDebt).toBe(200)
    expect(payer).toBe(100)
    expect(updatedExpenses).toHaveLength(helper.initialExpenses.length)
  })

  test('Transfer to non payer - non debtor', async () => {
    const expenses = await helper.expensesInDb()
    const expenseToTransfer = expenses[0]
    const users = await helper.usersInDb()
    const senderUser = users[1]
    const recieverUser = users[2]

    await api
      .put(`/api/expenses/${expenseToTransfer.id}`)
      .send({
        notification: { expense: expenseToTransfer, senderUser },
        user: recieverUser,
        type: 'Transfer',
      })
      .expect(200)

    const updatedExpenses = await helper.expensesInDb()
    const expenseToTest = updatedExpenses.find(
      (e) => e.id === expenseToTransfer.id,
    )

    const senderDebtor = expenseToTest.debtors.find(
      (d) => d.username === senderUser.username,
    )
    const debtorDebt = expenseToTest.debtors.find(
      (d) => d.username === recieverUser.username,
    ).amount
    expect(debtorDebt).toBe(50)
    expect(senderDebtor).toBe(undefined)
    expect(updatedExpenses).toHaveLength(helper.initialExpenses.length)
  })
})

afterAll(async () => {
  await User.deleteMany({})
  await Expense.deleteMany({})
  mongoose.connection.close()
})
