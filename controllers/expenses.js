const ExpenseRouter = require('express').Router()
const Expense = require('../models/expense')
const User = require('../models/user')

//validator
const validator = require('../utils/validations/expense_validations')

ExpenseRouter.post('/', async (req, res) => {
  const { debtor, description, balance, paidBy, percentage, user } = req.body

  const validation = validator.inputValidations(
    paidBy,
    debtor,
    user,
    balance,
    description,
  )

  if (!validation.status) {
    console.log('Fallo en validar campos', validation.message)
    res.status(404).send({ message: validation.message })
  } else {
    const response = await validator.finalExpense(
      paidBy,
      debtor,
      balance,
      description,
      percentage,
    )
    if (!response.status) {
      console.log('Fallo en validar expenseFinal', response.message)
      res.status(404).send({ message: response.message })
    } else {
      const expense = new Expense({
        description: response.description,
        balance: response.balance,
        paidBy: response.paidBy,
        debtors: response.debtors,
        date: new Date(),
      })

      const expenseDb = await expense.save()

      let users = expenseDb.debtors.map((u) => u.username)
      users = users.concat([...expenseDb.paidBy.map((u) => u.username)])

      const usersInExpense = await User.find({
        username: { $in: users },
      })

      await validator.addFriendsAndExpenses(usersInExpense, expenseDb)

      res.status(201).send(expenseDb.toJSON())
    }
  }
})

ExpenseRouter.get('/', async (req, res) => {
  const expenses = await Expense.find({})

  //! Puedo cambiarlo para pedir solo expenses especificos o para todos.
  res.status(200).send(expenses.map((expense) => expense.toJSON()))
})

ExpenseRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const {
    user,
    type,
    expense = null,
    notification = null,
    payment = null,
  } = req.body

  const validId = await Expense.findById(req.params.id)
  if (!validId) {
    return res.status(404).send({ message: 'Expense not found.' })
  }

  let updatExp = {}
  if (type === 'Transfer') {
    updatExp = await validator.handleTransfer(user, notification)
  } else if (type === 'TotalPay') {
    updatExp = await validator.handleTotalPay(user, expense)
  } else {
    updatExp = await validator.handlePartialPay(user, expense, payment)
  }

  const expenseUpdated = await Expense.findByIdAndUpdate(id, updatExp, {
    new: true,
  })

  res.status(200).send(expenseUpdated.toJSON())
})

module.exports = ExpenseRouter
