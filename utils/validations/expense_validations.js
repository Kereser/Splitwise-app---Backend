const User = require('../../models/user')

const handleTotalPay = async (user, expense) => {
  expense.debtors = expense.debtors.map((u) => {
    if (u.username === user.username) {
      u.amount = 0
      return u
    }
    return u
  })
  return ({ description, balance, paidBy, debtors } = expense)
}

const handleTransfer = async (user, n) => {
  //! 1Escenario --> Paso la deuda a una persona q pago y puede haber mas gente endeudada conmigo.
  //! 2Escenario --> Paso la deuda a una persona q tambien debe y q obvio no pago.
  //! 3Escenario --> Paso la deuda a una persona q no esta en la deuda ni en pagadores. (Creo q no afecta q hayan mas personas.) --- Agregar a la nueva persona y quitarla a la q la tenia originlamente.

  if (n.expense.paidBy.some((p) => p.username === user.username)) {
    const expenseToUpdate = n.expense

    const updatedDebtors = expenseToUpdate.debtors.map((d) =>
      d.username === n.senderUser.username
        ? { username: n.senderUser.username, amount: 0 }
        : d,
    )
    expenseToUpdate.debtors = updatedDebtors

    const recieverUser = await User.findById(user.id)
    recieverUser.notifications = recieverUser.notifications.filter(
      (not) => not.expense.id !== expenseToUpdate.id,
    )
    recieverUser.save()

    return ({ description, balance, paidBy, debtors } = expenseToUpdate)
  } else if (n.expense.debtors.some((p) => p.username === user.username)) {
    const amountToTrasnfer = n.expense.debtors.find(
      (d) => d.username === n.senderUser.username,
    ).amount
    const originalAmount = n.expense.debtors.find(
      (d) => d.username === user.username,
    ).amount
    const newAmount = originalAmount + amountToTrasnfer

    const expenseToUpdate = n.expense
    const updatedDebtors = expenseToUpdate.debtors.map((d) =>
      d.username === n.senderUser.username
        ? { username: n.senderUser.username, amount: 0 }
        : d.username === user.username
        ? { username: user.username, amount: newAmount }
        : d,
    )

    expenseToUpdate.debtors = updatedDebtors

    const recieverUser = await User.findById(user.id)
    recieverUser.notifications = recieverUser.notifications.filter(
      (not) => not.expense.id !== expenseToUpdate.id,
    )
    recieverUser.save()

    return ({ description, balance, paidBy, debtors } = expenseToUpdate)
  } else {
    const expenseToUpdate = n.expense
    const updatedDebtors = expenseToUpdate.debtors.map((d) =>
      d.username === n.senderUser.username
        ? { ...d, username: user.username }
        : d,
    )

    expenseToUpdate.debtors = updatedDebtors

    //Actualizar ususarios
    const transferUser = await User.findById(n.senderUser.id)
      .populate('expenses')
      .populate('friends')

    transferUser.expenses = transferUser.expenses.filter((e) => {
      return e.id !== expenseToUpdate.id
    })
    transferUser.save()

    //! El user q me envian tengo q buscarlo en la base de datos para poder actualizarlo.
    const recieverUser = await User.findById(user.id)
    recieverUser.notifications = recieverUser.notifications.filter(
      (not) => not.expense.id !== expenseToUpdate.id,
    )
    recieverUser.expenses = recieverUser.expenses.concat(expenseToUpdate.id)
    await recieverUser.save()

    return ({ description, balance, paidBy, debtors } = expenseToUpdate)
  }
}

const handlePartialPay = (user, expense, payment) => {
  expense.debtors = expense.debtors.map((u) => {
    if (u.username === user.username) {
      u.amount -= +payment
      return u
    }
    return u
  })

  return ({ description, balance, paidBy, debtors } = expense)
}

const addFriendsAndExpenses = async (usersInExpense, expenseDb) => {
  //! Sacar a un modulo aparte esta logica.
  usersInExpense.forEach(async (user, _index, arr) => {
    const expenses = user.expenses
    expenses.push(expenseDb)
    const friends = user.friends
    for (let i = 0; i < arr.length; i++) {
      if (user.username !== arr[i].username) {
        if (!friends.includes(arr[i]._id)) {
          friends.push(arr[i])
        }
      }
    }
    await user.updateOne({ expenses: expenses, friends: friends })
  })
}

const inputValidations = (paidBy, debtor, user, balance, description) => {
  const formattedPaidBy = paidBy?.split(',').map((user) => user.trim())
  const formattedDebtors = debtor?.split(',').map((user) => user.trim())
  if (!debtor) {
    return { message: 'You must set debtors list.', status: false }
  } else if (formattedDebtors.includes(user.username)) {
    return { message: 'You can not be in debtors list.', status: false }
  } else if (!paidBy) {
    return { message: 'You must set payers list.', status: false }
  } else if (!formattedPaidBy.includes(user.username)) {
    return { message: 'You must be in payers list.', status: false }
  } else if (balance <= 0) {
    return { message: 'You can not set a balance of 0', status: false }
  } else if (!description) {
    return { message: 'You must set a description', status: false }
  } else {
    return { message: null, status: true }
  }
}

const finalExpense = async (
  paidBy,
  debtor,
  balance,
  description,
  percentage,
) => {
  // ! comprobar q los compradores y deudores esten en la base de datos.
  const users = await User.find({})
  const usernames = users.map((u) => u.username)
  const formattedPaidBy = paidBy?.split(',').map((user) => user.trim())
  const formattedDebtors = debtor?.split(',').map((user) => user.trim())

  for (let i = 0; i < formattedPaidBy.length; i++) {
    if (!usernames.includes(formattedPaidBy[i])) {
      console.log('Fallo en payer: ', formattedPaidBy[i])
      return {
        message: `${formattedPaidBy[i]} is not in the db`,
        status: false,
      }
    }
  }

  for (let i = 0; i < formattedDebtors.length; i++) {
    if (!usernames.includes(formattedDebtors[i])) {
      console.log('Fallo en debtor: ', formattedDebtors[i])
      return {
        message: `${formattedDebtors[i]} is not in the db`,
        status: false,
      }
    }
  }

  const totalDebtors = balance * (percentage / 100)
  const totalPayer = balance - totalDebtors

  const finalPayers = formattedPaidBy.map((p) => {
    return { username: p, amount: totalPayer / formattedPaidBy.length }
  })
  const finalDebtors = formattedDebtors.map((d) => {
    return { username: d, amount: totalDebtors / formattedDebtors.length }
  })

  return {
    description,
    balance,
    paidBy: finalPayers,
    debtors: finalDebtors,
    status: true,
  }
}

module.exports = {
  handleTransfer,
  handleTotalPay,
  handlePartialPay,
  addFriendsAndExpenses,
  inputValidations,
  finalExpense,
}
