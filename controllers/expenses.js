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

  //Agregar expenses.
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

  console.log('Users with the expenses added: ', usersInExpense)
  res.status(201).send(expenseDb.toJSON())
})

ExpenseRouter.get('/', async (req, res) => {
  const expenses = await Expense.find({})

  //! Puedo cambiarlo para pedir solo expenses especificos o para todos.
  res.status(200).send(expenses.map((expense) => expense.toJSON()))
})

ExpenseRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const body = req.body

  const newExpense = {
    description: body.description,
    balance: body.balance,
    paidBy: body.paidBy,
    debtors: body.debtors,
  }

  const expense = await Expense.findByIdAndUpdate(id, newExpense, { new: true })

  console.log(expense)
  res.status(200).send(expense.toJSON())
})

module.exports = ExpenseRouter
