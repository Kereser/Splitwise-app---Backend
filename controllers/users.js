const bcrypt = require('bcrypt')
const UserRouter = require('express').Router()
const User = require('../models/user')
const mongoose = require('mongoose')

UserRouter.post('/', async (req, res) => {
  const { username, password, name } = req.body

  console.log(username, password, name)
  const userExist = await User.findOne({ username })
  if (userExist) {
    return res.status(400).send({ message: 'Username already register.' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    passwordHash,
    name,
  })

  const savedUser = await user.save()
  res.status(201).json(savedUser.toJSON())
})

UserRouter.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('expenses')
    .populate('friends')

  //! RECORDAR CUANDO ENVIE EL USUSARIO DE NEUVO, Q MI USUARIO USA EXPENSES Y FRIEND Y SI NO HAGO POPULATE SOLO SE ENVIA EL ID.
  res.status(200).json(user.toJSON())
})

UserRouter.put('/:id', async (req, res) => {
  const body = req.body

  const newUser = {
    friends: body.friends.map((f) => mongoose.Types.ObjectId(f)),
    expenses: body.expenses.map((e) => mongoose.Types.ObjectId(e)),
    notifications: body.notifications,
  }

  const user = await User.findByIdAndUpdate(req.params.id, newUser, {
    new: true,
  })
    .populate('expenses')
    .populate('friends')

  //! RECORDAR CUANDO ENVIE EL USUSARIO DE NEUVO, Q MI USUARIO USA EXPENSES Y FRIEND Y SI NO HAGO POPULATE SOLO SE ENVIA EL ID.
  console.log('User updated: ', user)
  res.status(200).json(user.toJSON())
})

module.exports = UserRouter
