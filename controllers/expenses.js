const ExpenseRouter = require('express').Router()
const Expense = require('../models/expense')
const User = require('../models/user')

ExpenseRouter.post('/', async (req, res) => {
  const { description, balance, paidBy, debtors } = req.body

  const expense = new Expense({
    description,
    balance,
    paidBy,
    debtors,
    date: new Date(),
  })

  const expenseDb = await expense.save()

  let users = debtors.map((u) => u.username)
  users = users.concat([...paidBy.map((u) => u.username)])

  const usersInExpense = await User.find({
    username: { $in: users },
  })

  console.log('totalUsers: ', users)
  res.status(201).send(expenseDb.toJSON())
})

ExpenseRouter.get('/', async (req, res) => {
  const expenses = await Expense.find({})

  //! Puedo cambiarlo para pedir solo expenses especificos o para todos.
  res.status(200).send(expenses.map((expense) => expense.toJSON()))
})

ExpenseRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const { description, balance, paidBy, debtors } = req.body

  const expense = await Expense.findByIdAndUpdate(id, {
    description,
    balance,
    paidBy,
    debtors,
  })

  res.status(200).send(expense.toJSON())
})

module.exports = ExpenseRouter
