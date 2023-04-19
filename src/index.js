
const path=require("path");
const http = require('http')
const express = require('express')
const socket = require("socket.io");
const app = express()
const server = http.createServer(app)
const io = socket(server);
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const {addUser,removeUser,getUser,getUsersInRoom}=require("./utils/users")

const publicDiractory=path.join(__dirname,"../public")
app.use(express.static(publicDiractory));


io.on("connection", (socket) => {

    socket.on("join", (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error)
            
        }
          

        socket.join(user.room)
        socket.emit("message", generateMessage(`welcome ${user.username}`,"admin"));
        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} is joind `, "admin"))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users:getUsersInRoom(user.room)
        })

        callback();
    })

    
    socket.on("sendMessage", (msg, callback) => {
        const user = getUser(socket.id);
            const filter = new Filter();
            if (filter.isProfane(msg)) {
                return callback("this words is not allowed")
            }
            io.to(user.room).emit("message", generateMessage(msg,user.username));
            callback()
        
    });
    socket.on("sendLocation", (position, callback) => {
        const user= getUser(socket.id)
        const url = `https://www.google.com/maps?q=${position.latitude},${position.longitude}`
        io.to(user.room).emit("locationMessage", generateLocationMessage(url, user.username))

        callback();
    });
    
    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
                    
            io.to(user.room).emit("message", generateMessage(`${user.username} has left `, "admin"));
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

});

server.listen(3000, () => {
    console.log(`Server is up on port ${3000}!`);
});


