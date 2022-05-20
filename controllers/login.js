const bcrypt = require('bcrypt')
const LoginRouter = require('express').Router()
const User = require('../models/user')

LoginRouter.post('/', async (req, res) => {
  const { username, password } = req.body

  const userInDb = await User.findOne({ username })
    .populate('expenses')
    .populate('friends')
  const passwordCorrect = userInDb
    ? await bcrypt.compare(password, userInDb.passwordHash)
    : false

  if (!(userInDb && passwordCorrect)) {
    return res.status(401).json({ error: 'invalid username or password' })
  }

  // Agregar aqui la logica para jsonwebtoken
  res.status(200).send(userInDb.toJSON())
})

module.exports = LoginRouter
