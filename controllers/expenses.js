const ExpenseRouter = require('express').Router()
const Expense = require('../models/expense')

ExpenseRouter.post('/', async (req, res) => {
  const { description, balance, paidBy, debtors } = req.body

  const expense = new Expense({
    description,
    balance,
    paidBy,
    debtors,
  })

  const expenseDb = await expense.save()
  res.status(201).send(expenseDb.ToJSON())
})

export default ExpenseRouter
