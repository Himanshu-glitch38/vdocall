const { Server } = require("socket.io");

module.exports = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (room) => {
      socket.join(room);
      socket.to(room).emit("user-joined");
    });

    socket.on("offer", (data) => {
      socket.to(data.room).emit("offer", data.offer);
    });

    socket.on("answer", (data) => {
      socket.to(data.room).emit("answer", data.answer);
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.room).emit("ice-candidate", data.candidate);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};