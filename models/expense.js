const mongoose = require('mongoose')

expenseSchema = new mongoose.Schema({
  description: String,
  balance: Number,
  paidBy: [],
  debtors: [],
})

expenseSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
  },
})

module.exports = mongoose.model('Expense', expenseSchema)
