const { Server } = require("socket.io");

let waitingQueue = [];

function initSocket(server) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Matchmaking
    if (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      const partnerSocket = io.sockets.sockets.get(partnerId);

      if (partnerSocket) {
        socket.partner = partnerId;
        partnerSocket.partner = socket.id;

        socket.emit("matched", partnerId);
        partnerSocket.emit("matched", socket.id);
      } else {
        // If partner disconnected before match
        waitingQueue.push(socket.id);
        socket.emit("waiting");
      }
    } else {
      waitingQueue.push(socket.id);
      socket.emit("waiting");
    }

    // Relay WebRTC signaling
    socket.on("signal", ({ to, data }) => {
      io.to(to).emit("signal", { from: socket.id, data });
    });

    // Handle Next / Skip
    socket.on("next", () => {
      if (socket.partner) {
        io.to(socket.partner).emit("partner-disconnected");
      }
      socket.partner = null;

      waitingQueue.push(socket.id);
      socket.emit("waiting");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);

      // Remove from queue if waiting
      waitingQueue = waitingQueue.filter(id => id !== socket.id);

      // Notify partner
      if (socket.partner) {
        io.to(socket.partner).emit("partner-disconnected");
      }
    });
  });
}

module.exports = { initSocket };
