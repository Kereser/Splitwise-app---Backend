require('dotenv').config()

PORT = process.env.PORT

MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI

module.exports = {
  PORT,
  MONGODB_URI,
}
