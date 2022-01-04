const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const pubDirPath = path.join(__dirname, '../public')
app.use(express.static(pubDirPath))

//initial connection
io.on('connection', (socket)=>{
    
    //listen for join
    socket.on('join', ({username, room}, callback) =>{
        const {error , user } = addUser({ id:socket.id, username, room})
        if(error){
            return callback(error)
        }

        socket.join(user.room)

        //initial welcome send
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
    
        //user joins
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    //user sends messages to everyone in channel
    socket.on('sendMessage', (message, callback)=>{
        const user=getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    //User sends location
    socket.on('sendLocation', (coords, callback) => {
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `http://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    //User disconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has disconnected.`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }        
    })
})

module.exports = {
    app, 
    server,
}