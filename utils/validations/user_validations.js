const mongoose = require('mongoose')

const lengthValidator = (username, password, name) => {
  if (username.length < 4) {
    return { message: 'Username must be at least 4 characters', status: false }
  } else if (password.length < 4) {
    return { message: 'Password must be at least 4 characters', status: false }
  } else if (name.length < 4) {
    return { message: 'Name must be at least 4 characters', status: false }
  } else if (username.match(/\s/) || name.match(/\s/)) {
    return {
      message: 'Neither username nor name can contain spaces',
      status: false,
    }
  } else {
    return { status: true }
  }
}

const acceptNotifications = (user) => {
  user.notifications = []
  updatedUser = {
    friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
    expenses: user.expenses.map((e) => mongoose.Types.ObjectId(e)),
    notifications: user.notifications,
    preferences: user.preferences,
  }
  return updatedUser
}

const acceptOneNotification = (user, index) => {
  user.notifications = user.notifications.filter((_n, i) => i !== index)
  updatedUser = {
    friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
    expenses: user.expenses.map((e) => mongoose.Types.ObjectId(e)),
    notifications: user.notifications,
    preferences: user.preferences,
  }
  return updatedUser
}

module.exports = { lengthValidator, acceptNotifications, acceptOneNotification }
