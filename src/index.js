const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const path = require('path')
const Filter = require('bad-words')
const {generateMessage, generateLocation} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT||3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket) => {
  console.log('new connection')
  
//   socket.emit('message', generateMessage('Welcome') )   
//   socket.broadcast.emit('message', generateMessage('A new user has joined'))  //emits to every other connection except for that particular connection

  socket.on('join',({username ,room}, callback)=>{
      const {error,user} = addUser({ id: socket.id,username, room })

      if(error){
          return callback(error)
      }

      socket.join(user.room) //emits to clients only in same room

      socket.emit('message', generateMessage('Admin','Welcome') )
      socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
      io.to(user.room).emit('roomData',{
          room:user.room,
          users:getUsersInRoom(user.room)
      })
      callback()
  })
  
  socket.on('sendMessage', (message, callback)=>{
      const filter = new Filter()
      const user = getUser(socket.id)
      if(filter.isProfane(message)){
          return callback('Profanity is not allowed')
      }

      io.to(user.room).emit('message', generateMessage(user.username, message))     //emits to every connection
      callback('Delivered')
  })

  socket.on('disconnect', ()=>{
      const user = removeUser(socket.id)
      console.log(user)
      if(user){
        io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
      }
      
  })

  socket.on('sendLocation',(coords, callback)=>{
      const user = getUser(socket.id)
      io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
      callback()
  })
})


server.listen(port,()=>{
    console.log('Server is up on port ' + port)
})