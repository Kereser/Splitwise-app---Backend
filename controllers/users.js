const bcrypt = require('bcrypt')
const UserRouter = require('express').Router()
const User = require('../models/user')
const mongoose = require('mongoose')

//validators
const validator = require('../utils/validations/user_validations')

UserRouter.post('/', async (req, res) => {
  const { username, password, name } = req.body

  const { message = null, status } = validator.lengthValidator(
    username,
    password,
    name,
  )

  if (status) {
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
  } else {
    res.status(400).send({ message })
  }
})

UserRouter.get('/:id', async (req, res) => {
  const validId = await User.findById(req.params.id)
  if (!validId) {
    return res.status(404).send({ message: 'Non valid ID' })
  }

  const user = await User.findById(req.params.id)
    .populate('expenses')
    .populate('friends')

  //! RECORDAR CUANDO ENVIE EL USUSARIO DE NEUVO, Q MI USUARIO USA EXPENSES Y FRIEND Y SI NO HAGO POPULATE SOLO SE ENVIA EL ID.
  res.status(200).json(user.toJSON())
})

UserRouter.put('/:id', async (req, res) => {
  const { user, action } = req.body

  const validId = await User.findById(req.params.id)
  if (!validId) {
    return res.status(404).send({ message: 'User not found.' })
  }

  let updatedUser = {}
  if (action.type === 'AcceptAll') {
    result = validator.acceptNotifications(user)
    updatedUser = result.updatedUser
  } else if (action.type === 'AcceptOne') {
    result = validator.acceptOneNotification(user, action.index)
    updatedUser = result.updatedUser
  } else if (action.type === 'Preferences') {
    result = validator.updatePreferences(user, action.expense, action.selected)
    updatedUser = result.updatedUser
  } else if (action.type === 'AddFriend') {
    const response = await validator.addFriend(user, action.newFriend)
    if (!response.status) {
      return res.status(404).send({ message: response.message })
    }
    updatedUser = response.updatedUser
  } else {
    return res.status(400).send({ message: 'Invalid action.' })
  }

  const userUpdated = await User.findByIdAndUpdate(req.params.id, updatedUser, {
    new: true,
  })
    .populate('expenses')
    .populate('friends')

  res.status(200).json(userUpdated.toJSON())
  //! RECORDAR CUANDO ENVIE EL USUSARIO DE NEUVO, Q MI USUARIO USA EXPENSES Y FRIEND Y SI NO HAGO POPULATE SOLO SE ENVIA EL ID.
})

UserRouter.get('/', async (req, res) => {
  const users = await User.find({}).populate('expenses').populate('friends')

  res.status(200).json(users.map((u) => u.toJSON()))
})

module.exports = UserRouter
