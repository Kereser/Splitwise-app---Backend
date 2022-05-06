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

const getUser = (username) => {
  return usersOneline.find((u) => u.username === username)
}

const getUserOffline = async (username, senderUser) => {
  const userDb = await User.findOne({ username })
  // todo: Revisar pq no esta agregndo la notificacion.
  console.log(senderUser)
  userDb.notifications = userDb.notifications.concat({ senderUser })
  await userDb.save()
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
    const userDb = await User.findOne({ username })
    if (userDb?.notifications.length > 0) {
      // Creo q no tengo realmente recieverUser
      const recieverUser = userDb.username
      const reciever = getUser(recieverUser)
      if (reciever) {
        // todo: Map para enviar las distintas notificaciones con los distintos usuarios.
        userDb.notifications.map((n) => {
          console.log('socket id: ', socket.id)
          io.to(reciever.socketId).emit('getExpense', n)
        })
      }
    }
  })

  socket.on(
    'newExpense',
    ({ receiverUser, senderUser, senderUserId, description, amount }) => {
      const reciever = getUser(receiverUser)
      const objToSend = { senderUser, description, senderUserId, amount }

      if (reciever) {
        console.log(
          'reciever: ',
          reciever,
          'senderUser: ',
          senderUser,
          'receiverUser: ',
          receiverUser,
          'Reciever socket: ',
          reciever.socketId,
        )

        io.to(reciever.socketId).emit('getExpense', objToSend)
      } else {
        // Si no hay usuario online, lo busco en la base de datos y agrego la notificacion alli.
        getUserOffline(receiverUser, senderUser)
      }
    },
  )

  socket.on('disconnect', () => {
    removeUser(socket.id)
  })
})

httpServer.listen(3001)
