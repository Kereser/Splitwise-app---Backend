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

module.exports = { handleTransfer, handleTotalPay }
