const config = require('./utils/config')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const logger = require('./utils/logger')

// Routes.
const UserRouter = require('./controllers/users')

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

app.use(express.json())
app.use(middleware.requestLogger)
app.use('/api/users', UserRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app