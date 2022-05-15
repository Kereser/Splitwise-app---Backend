const app = require('./app') // la aplicación Express real
const { createServer } = require('http')
const config = require('./utils/config')
const logger = require('./utils/logger')
const { Server } = require('socket.io')

// users
const User = require('./models/user')

const httpServer = createServer(app)

let usersOneline = []

const addNewUser = (username, socketId) => {
  !usersOneline.some((u) => u.username === username) &&
    usersOneline.push({ username, socketId })
}

const removeUser = (sockedId) => {
  usersOneline = usersOneline.filter((u) => u.socketId !== sockedId)
}

const getUsers = (rUsers) => {
  return usersOneline.filter((u) => rUsers.includes(u.username))
}

const getUsersOffline = async (
  recieverUsers,
  senderUser,
  senderUserId,
  expense,
) => {
  const usersDb = await User.find({ username: { $in: recieverUsers } })
  console.log('Entro a offline')
  console.log('userInDB: ', usersDb)

  console.log('not to offlineuser: ID SENDER USER:::', senderUserId)
  usersDb.map(async (u) => {
    u.notifications = u.notifications.concat({
      senderUser,
      senderUserId,
      expense,
    })
    console.log('Cada user por separado: ', u)
    await u.save()
  })
  console.log('usersOffline: ', usersDb)
}

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    // or with an array of origins
    // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
  },
})

io.on('connection', (socket) => {
  io.emit('firstEvent', 'Hello from server')

  socket.on('newUser', async (username) => {
    addNewUser(username, socket.id)
    console.log('Logeo a un nuevo usuario', usersOneline)
    const userDb = await User.findOne({ username })
    if (userDb?.notifications.length > 0) {
      // Creo q no tengo realmente recieverUser
      const recieverUser = userDb.username
      const reciever = getUsers(recieverUser)
      console.log('User to send notifications bc was offline: ', reciever)
      if (reciever) {
        // todo: Map para enviar las distintas notificaciones con los distintos usuarios.
        console.log('Notifications on offline users: ', userDb.notifications)
        let notsToSend = userDb.notifications
        io.to(reciever[0].socketId).emit('getNotification', notsToSend)
      }
    }
  })

  socket.on(
    'newNotification',
    ({ recieverUsers, senderUser, senderUserId, expense }) => {
      const onlineRecievers = getUsers(recieverUsers)
      console.log('onlineRecievers: ', onlineRecievers)
      console.log('*** Users to send the newExpense: ***', recieverUsers)
      const objToSend = { senderUser, senderUserId, expense }

      if (onlineRecievers.length > 0) {
        console.log('ENTRO A USER ONLINE')

        if (onlineRecievers.length !== recieverUsers.length) {
          onlineUsername = onlineRecievers.map((r) => {
            return r.username
          })

          const usersOffline = recieverUsers.filter((totalU) => {
            return !onlineUsername.includes(totalU)
          })

          console.log('Entro a users offline: ', usersOffline)
          getUsersOffline(usersOffline, senderUser, senderUserId, expense)
        }

        onlineRecievers.map(async (r) => {
          console.log('Envio not a:  ', r)
          const userDb = await User.findOne({ username: r.username })
          console.log('User in DB: ', userDb)
          userDb.notifications = userDb.notifications.concat(objToSend)
          await userDb.save()
          io.to(r.socketId).emit('getNotification', [objToSend])
        })
      } else {
        // Si no hay usuario online, lo busco en la base de datos y agrego la notificacion alli.
        getUsersOffline(recieverUsers, senderUser, senderUserId, expense)
      }
    },
  )

  socket.on('disconnect', () => {
    removeUser(socket.id)
  })
})

httpServer.listen(3001)
