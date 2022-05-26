const ExpenseRouter = require('express').Router()
const Expense = require('../models/expense')
const User = require('../models/user')

//validator
const validator = require('../utils/validations/expense_validations')

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

  //! Sacar a un modulo aparte esta logica.
  usersInExpense.forEach(async (user, _index, arr) => {
    const expenses = user.expenses
    expenses.push(expenseDb)
    const friends = user.friends
    for (let i = 0; i < arr.length; i++) {
      if (user.username !== arr[i].username) {
        if (!friends.includes(arr[i]._id)) {
          friends.push(arr[i])
        }
      }
    }
    await user.updateOne({ expenses: expenses, friends: friends })
  })

  res.status(201).send(expenseDb.toJSON())
})

ExpenseRouter.get('/', async (req, res) => {
  const expenses = await Expense.find({})

  //! Puedo cambiarlo para pedir solo expenses especificos o para todos.
  res.status(200).send(expenses.map((expense) => expense.toJSON()))
})

ExpenseRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const { user, expense = null, type, notification = null } = req.body

  const validId = await Expense.findById(req.params.id)
  if (!validId) {
    return res.status(404).send({ message: 'Expense not found.' })
  }

  let updatExp = {}
  if (type === 'Transfer') {
    updatExp = await validator.handleTransfer(user, notification)
  } else if (type === 'TotalPay') {
    updatExp = await validator.handleTotalPay(user, expense)
  }

  const expenseUpdated = await Expense.findByIdAndUpdate(id, updatExp, {
    new: true,
  })

  res.status(200).send(expenseUpdated.toJSON())
})

module.exports = ExpenseRouter
