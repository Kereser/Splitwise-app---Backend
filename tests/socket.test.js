const { createServer } = require('http')
const { Server } = require('socket.io')
const Client = require('socket.io-client')
const app = require('../app')

//models
const User = require('../models/user')
const Expense = require('../models/expense')
const helper = require('./test_helper')

describe('my awesome project', () => {
  let io, serverSocket, clientSocket

  beforeAll((done) => {
    const httpServer = createServer()
    io = new Server(httpServer)
    httpServer.listen(() => {
      const port = httpServer.address().port || 3000
      clientSocket = new Client(`http://localhost:${port}`)
      io.on('connection', (socket) => {
        serverSocket = socket
      })
      clientSocket.on('connect', done)
    })
  })

  beforeAll(async () => {
    await User.deleteMany({})
    await User.insertMany(helper.initialUsers)
  })

  //! probar si enviando la notificacion y luego llamando al ususario me muestra la notificacion en el usuario.
  test('should work', async () => {
    const users = await helper.usersInDb()
    const senderUser = { username: users[0].username, id: users[0].id }
    const recieverUser = ['test2']

    clientSocket.emit('newNotification', { senderUser, recieverUser })
    serverSocket.on('newNotification', (arg) => {
      expect(arg.recieverUser).toContain('test2')
    })
  })

  test('should work (with ack)', () => {
    serverSocket.on('hi', (cb) => {
      cb('hola')
    })

    clientSocket.emit('hi', (arg) => {
      expect(arg).toBe('hola')
    })
  })

  afterAll(async () => {
    await User.deleteMany({})
    io.close()
    clientSocket.close()
  })
})
