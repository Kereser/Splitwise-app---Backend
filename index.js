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

const getUsersOffline = async (recieverUsers, senderUser, senderUserId) => {
  const usersDb = await User.find({ username: { $in: recieverUsers } })
  console.log('Entro a offline')
  console.log('userInDB: ', usersDb)

  console.log('not to offlineuser: ID SENDER USER:::', senderUserId)
  usersDb.map(async (u) => {
    u.notifications = u.notifications.concat({ senderUser, senderUserId })
    console.log('Cada user por separado: ', u)
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
      console.log('Reciever: ', reciever)
      console.log('onlineUsers: ', usersOneline)
      if (reciever) {
        // todo: Map para enviar las distintas notificaciones con los distintos usuarios.
        console.log('notifications: ', userDb.notifications)
        let notsToSend = userDb.notifications
        io.to(reciever[0].socketId).emit('getExpense', notsToSend)
        userDb.notifications = []
        await userDb.save()
      }
    }
  })

  socket.on('newExpense', ({ recieverUsers, senderUser, senderUserId }) => {
    console.log('Entro en new expense')
    const recievers = getUsers(recieverUsers)
    console.log('recievers: ', recievers)
    const objToSend = { senderUser, senderUserId }

    if (recievers.length > 0) {
      console.log('ENTRO A USER ONLINE')

      recievers.map((r) => {
        console.log('socket de cada uno de los reciever: ', r.socketId)
        io.to(r.socketId).emit('getExpense', [objToSend])
      })
    } else {
      // Si no hay usuario online, lo busco en la base de datos y agrego la notificacion alli.
      getUsersOffline(recieverUsers, senderUser, senderUserId)
    }
  })

  socket.on('disconnect', () => {
    removeUser(socket.id)
  })
})

httpServer.listen(3001)
