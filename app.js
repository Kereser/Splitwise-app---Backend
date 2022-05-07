const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const logger = require('./utils/logger')

// Routes.
const UserRouter = require('./controllers/users')
const LoginRouter = require('./controllers/login')
const ExpenseRouter = require('./controllers/expenses')

// middlewares.
const middleware = require('./utils/middleware')

logger.info('connecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)
app.use('/users', UserRouter)
app.use('/login', LoginRouter)
app.use('/expense', ExpenseRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
