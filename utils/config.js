require('dotenv').config()

PORT = process.env.PORT || 3001

MONGODB_URI = process.env.MONGODB_URI

module.exports = {
  PORT,
  MONGODB_URI,
}
