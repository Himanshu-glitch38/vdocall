module.exports = (io) => {
  let waitingQueue = [];

  io.on("connection", (socket) => {
    currentActiveUsers++;

    if (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      const partnerSocket = io.sockets.sockets.get(partnerId);

      if (partnerSocket) {
        socket.partner = partnerId;
        partnerSocket.partner = socket.id;

        socket.emit("matched", partnerId);
        partnerSocket.emit("matched", socket.id);
        console.log(`matched: ${partnerId ?? null} 🤝 ${socket.id ?? null}`);
      } else {
        // If partner disconnected before match
        if (!socket.id) return;
        waitingQueue.push(socket.id);
        socket.emit("waiting");
      }
    } else {
      if (!socket.id) return;
      waitingQueue.push(socket.id);
      socket.emit("waiting");
      console.log(waitingQueue);
    }

    //
    socket.on("disconnect", () => {
      currentActiveUsers--;
      console.log("User disconnected", socket.id);

      waitingQueue = waitingQueue.filter((id) => id !== socket.id);

      // Notify partner
      if (socket.partner) {
        io.to(socket.partner).emit("partner-disconnected");

        /** */ if (waitingQueue.length > 0) {
          const partnerId = waitingQueue.shift();
          const partnerSocket = io.sockets.sockets.get(partnerId);
          const oldPartnerId = socket.partner;
          const oldPartnerSocket = io.sockets.sockets.get(oldPartnerId);

          if (partnerSocket && oldPartnerSocket) {
            oldPartnerSocket.partner = partnerId;
            partnerSocket.partner = oldPartnerId;
            oldPartnerSocket.emit("matched", partnerId);

            partnerSocket.emit("matched", oldPartnerId);
            console.log(`matched: ${partnerId} 🤝 ${oldPartnerId} (old)`);
          }
        } else {
          if (io.sockets.sockets.get(socket.partner)) {
            waitingQueue.push(socket.partner);
            io.to(socket.partner).emit("waiting");
          } else {
            return;
          }
        }
      } else {
        return;
      }
    });

    // //sample
    // socket.on("getUserCount", (feedback) => {
    //   feedback(users);
    // });

    console.log("someone connected!", socket.id);

    // Handle Skip
    socket.on("next", () => {
      if (socket.partner) {
        io.to(socket.partner).emit("partner-disconnected");
      }
      socket.partner = null;

      waitingQueue.push(socket.id);
      socket.emit("waiting");
    });

    // Relay WebRTC signaling
    socket.on("signal", ({ data }) => {
      if (!socket.partner) return console.log("partenr nor foingD");
      io.to(socket.partner).emit("signal", { data });
    });

    // //beta message

    // socket.on('message', (msg, feedback) => {
    //   if(!socket.partner) return feedback("No partner found!")
    //     if(!msg) return feedback("Please enter a valid message!")
    //     io.to(socket.partner).emit('message', msg);
    //   return feedback(true);
    // });
  });
};
