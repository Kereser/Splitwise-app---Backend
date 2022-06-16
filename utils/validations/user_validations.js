const mongoose = require('mongoose')
const User = require('../../models/user')

const lengthValidator = (username, password, name) => {
  if (username.length < 4) {
    return { message: 'Username must be at least 4 characters', status: false }
  } else if (name.length < 4) {
    return { message: 'Name must be at least 4 characters', status: false }
  } else if (password.length < 4) {
    return { message: 'Password must be at least 4 characters', status: false }
  } else if (username.match(/\s/) || name.match(/\s/) || password.match(/\s/)) {
    return {
      message: 'Non of the fields can contain whitespaces',
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
  return { updatedUser }
}

const acceptOneNotification = (user, index) => {
  user.notifications = user.notifications.filter((_n, i) => i !== index)
  updatedUser = {
    friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
    expenses: user.expenses.map((e) => mongoose.Types.ObjectId(e)),
    notifications: user.notifications,
    preferences: user.preferences,
  }
  return { updatedUser }
}

const updatePreferences = (user, expense, selected) => {
  const preferences = user.preferences
  let updatedPreferences

  if (preferences.length === 0) {
    updatedPreferences = {
      expense,
      category: selected,
    }
    user.preferences = [updatedPreferences]
    updatedUser = {
      friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
      expenses: user.expenses.map((e) => mongoose.Types.ObjectId(e)),
      notifications: user.notifications,
      preferences: user.preferences,
    }
    return { updatedUser }
  } else if (
    preferences.filter((p) => p.expense.id === expense.id).length === 0
  ) {
    updatedPreferences = {
      expense,
      category: selected,
    }
    user.preferences = [...user.preferences, updatedPreferences]
    updatedUser = {
      friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
      expenses: user.expenses.map((e) => mongoose.Types.ObjectId(e)),
      notifications: user.notifications,
      preferences: user.preferences,
    }
    return { updatedUser }
  } else {
    const updatedPreferences = preferences.map((p) => {
      if (p.expense.id === expense.id) {
        return {
          expense,
          category: selected,
        }
      } else {
        return p
      }
    })
    user.preferences = updatedPreferences
    updatedUser = {
      friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
      expenses: user.expenses.map((e) => mongoose.Types.ObjectId(e)),
      notifications: user.notifications,
      preferences: user.preferences,
    }
    return { updatedUser }
  }
}

const addFriend = async (user, newFriend) => {
  const totalUsers = await User.find({})
  const totalUsernames = totalUsers.map((u) => u.username)

  if (!totalUsernames.includes(newFriend)) {
    return { message: "Username doesn't exist in database", status: false }
  } else {
    const friendToAdd = totalUsers.find((u) => u.username === newFriend)
    const alreadyAddedFriend = user.friends.filter(
      (f) => f.username === friendToAdd.username,
    )
    if (alreadyAddedFriend.length === 1) {
      return {
        message: 'You already add this user to friends list',
        status: false,
      }
    } else {
      user.friends = user.friends.map((f) => f.id)
      user.friends = user.friends.concat(friendToAdd.id)
      updatedUser = {
        friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
        expenses: user.expenses.map((e) => mongoose.Types.ObjectId(e)),
        notifications: user.notifications,
        preferences: user.preferences,
      }
      return { status: true, updatedUser }
    }
  }
}

const filterExpense = (user, selected, expensesAtStart) => {
  const filteredExpenses = user.preferences
    .map((p) => {
      return { ...p, expense: p.expense.id }
    })
    .filter((p) => {
      return p.category === selected
    })

  if (selected === 'All') {
    updatedUser = {
      friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
      expenses: expensesAtStart.map((e) => mongoose.Types.ObjectId(e.id)),
      notifications: user.notifications,
      preferences: user.preferences,
    }
    return { updatedUser }
  } else if (filteredExpenses.length === 0) {
    console.log('entro cuando no tengo expenses con esa preferencia')
    updatedUser = {
      friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
      expenses: [],
      notifications: user.notifications,
      preferences: user.preferences,
    }
    return { updatedUser }
  } else {
    console.log('Entro cuando si tengo expense con esa preference')
    console.log('filteredExpenses', filteredExpenses)
    updatedUser = {
      friends: user.friends.map((f) => mongoose.Types.ObjectId(f)),
      expenses: filteredExpenses.map((e) => mongoose.Types.ObjectId(e.expense)),
      notifications: user.notifications,
      preferences: user.preferences,
    }
    return { updatedUser }
  }
}

module.exports = {
  lengthValidator,
  acceptNotifications,
  acceptOneNotification,
  updatePreferences,
  addFriend,
  filterExpense,
}
