const testingRouter = require('express').Router()
const Expense = require('../models/expense')
const User = require('../models/user')

testingRouter.post('/reset', async (request, response) => {
  await Expense.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = testingRouter
