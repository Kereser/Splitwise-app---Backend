const app = require('./app') // la aplicación Express real
const { createServer } = require('http')
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

const getUsersOffline = async (recieverUsers, objToSend) => {
  const usersDb = await User.find({ username: { $in: recieverUsers } })

  usersDb.map(async (u) => {
    u.notifications = u.notifications.concat(objToSend)
    await u.save()
  })
}

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    // or with an array of origins
    // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
  },
})

const sendNotificationOnlineUsers = (onlineRecievers, objToSend) => {
  onlineRecievers.map(async (r) => {
    const userDb = await User.findOne({ username: r.username })
    userDb.notifications = userDb.notifications.concat(objToSend)
    await userDb.save()
    io.to(r.socketId).emit('getNotification', [objToSend])
  })
}

const sendNotificationsOfflineUsers = (userDb) => {
  const recieverUser = userDb.username
  const reciever = getUsers(recieverUser)
  if (reciever) {
    // todo: Map para enviar las distintas notificaciones con los distintos usuarios.
    let notsToSend = userDb.notifications
    io.to(reciever[0].socketId).emit('getNotification', notsToSend)
  }
}

io.on('connection', (socket) => {
  io.emit('firstEvent', 'Hello from server')

  socket.on('newUser', async (username) => {
    addNewUser(username, socket.id)
    console.log('Logeo a un nuevo usuario', usersOneline)
    const userDb = await User.findOne({ username })
    if (userDb?.notifications.length > 0) {
      sendNotificationsOfflineUsers(userDb)
    }
  })

  socket.on(
    'newNotification',
    ({
      recieverUsers,
      senderUser,
      expense = null,
      transfer = null,
      acceptTransfer = null,
    }) => {
      const onlineRecievers = getUsers(recieverUsers)
      const objToSend = { senderUser, expense, transfer, acceptTransfer }

      if (onlineRecievers.length > 0) {
        if (onlineRecievers.length !== recieverUsers.length) {
          onlineUsername = onlineRecievers.map((r) => {
            return r.username
          })

          const usersOffline = recieverUsers.filter((totalU) => {
            return !onlineUsername.includes(totalU)
          })

          getUsersOffline(usersOffline, objToSend)
        }

        sendNotificationOnlineUsers(onlineRecievers, objToSend)
      } else {
        // Si no hay usuario online, lo busco en la base de datos y agrego la notificacion alli.
        getUsersOffline(recieverUsers, objToSend)
      }
    },
  )

  socket.on('disconnect', () => {
    removeUser(socket.id)
  })
})
const PORT = process.env.PORT || 3001
httpServer.listen(PORT)
