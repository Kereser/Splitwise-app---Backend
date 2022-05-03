const mongoose = require('mongoose')

shopItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  balance: Number,
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
})

shopItemSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
  },
})

module.exports = mongoose.model('ShopItem', shopItemSchema)
