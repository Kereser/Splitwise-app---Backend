const mongoose = require('mongoose')

accountSchema = new mongoose.Schema({
  name: String,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shopItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' }],
})

accountSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
  },
})

module.exports = mongoose.model('Account', accountSchema)
