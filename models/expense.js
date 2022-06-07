const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  description: String,
  balance: Number,
  paidBy: [],
  debtors: [],
  date: Date,
})

expenseSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Expense', expenseSchema)
