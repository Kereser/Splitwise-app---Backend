const AccountRouter = require('express').Router()
const Account = require('../models/gruop')

AccountRouter.post('/', async (req, res) => {
  const { name, users, shopItems } = req.body
})

module.exports = AccountRouter
