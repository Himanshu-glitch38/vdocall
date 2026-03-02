const { Server } = require("socket.io");

let waitingQueue = [];

function initSocket(server) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Matchmaking
    if (waitingQueue.length > 0) {
      const partner = waitingQueue.shift();

      socket.partner = partner.id;
      partner.partner = socket.id;

      socket.emit("matched", partner.id);
      partner.emit("matched", socket.id);
    } else {
      waitingQueue.push(socket);
      socket.emit("waiting");
    }

    // Relay WebRTC signals
    socket.on("signal", ({ to, data }) => {
      io.to(to).emit("signal", { from: socket.id, data });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);

      // Remove from queue if waiting
      waitingQueue = waitingQueue.filter(s => s.id !== socket.id);

      // Notify partner
      if (socket.partner) {
        io.to(socket.partner).emit("partner-disconnected");
      }
    });
  });
}

module.exports = { initSocket };
