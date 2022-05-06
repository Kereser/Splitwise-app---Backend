const mongoose = require('mongoose')

groupSchema = new mongoose.Schema({
  name: String,
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
})

groupSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
  },
})

module.exports = mongoose.model('Group', groupSchema)
