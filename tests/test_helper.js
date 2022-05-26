const Expense = require('../models/expense')
const User = require('../models/user')

const initialUsers = [
  {
    username: 'test',
    password: 'test',
    name: 'test',
  },
  {
    username: 'test2',
    password: 'test2',
    name: 'test2',
  },
  {
    username: 'test3',
    password: 'test3',
    name: 'test3',
  },
]

const initialExpenses = [
  {
    paidBy: [{ username: 'test', amount: 50 }],
    debtors: [{ username: 'test2', amount: 50 }],
    description: 'Testing from t to t2',
    balance: 100,
  },
  {
    paidBy: [{ username: 'test2', amount: 100 }],
    debtors: [{ username: 'test3', amount: 100 }],
    description: 'Testing from t2 to t3',
    balance: 200,
  },
  {
    paidBy: [{ username: 'test2', amount: 100 }],
    debtors: [
      { username: 'test3', amount: 100 },
      { username: 'test', amount: 100 },
    ],
    description: 'Testing from t2 to t3 and t',
    balance: 300,
  },
]

const nonUserExistingId = async () => {
  const user = new User({
    username: 'willremovethissoon',
    password: '1234',
    name: 'test',
  })
  await user.save()
  await user.remove()

  return user._id.toString()
}

const nonExistingExpenseId = async () => {
  const expense = new Expense({
    paidBy: [{ username: 'test', amount: 50 }],
    debtors: [{ username: 'test2', amount: 50 }],
    description: 'Testing from t to t2',
    balance: 100,
  })
  await expense.save()
  await expense.remove()

  return expense._id.toString()
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map((u) => u.toJSON())
}

const expensesInDb = async () => {
  const expenses = await Expense.find({})
  return expenses.map((e) => e.toJSON())
}

module.exports = {
  initialUsers,
  nonUserExistingId,
  usersInDb,
  expensesInDb,
  initialExpenses,
  nonExistingExpenseId,
}
