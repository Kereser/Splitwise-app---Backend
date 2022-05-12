const bcrypt = require('bcrypt')
const UserRouter = require('express').Router()
const User = require('../models/user')

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

  res.status(200).json(user.toJSON())
})

module.exports = UserRouter
