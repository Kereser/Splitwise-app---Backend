const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  passwordHash: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  Saldo: Number,
  accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash
  },
})

module.exports = mongoose.model('User', userSchema)
