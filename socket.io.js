module.exports = (io) => {
  let waitingQueue = [];
  let users = 0;
  // console.log(io);
    io.on('connection', (socket) => {
      users++;
      
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
      
      socket.on('disconnect', () => {
        users--;
        waitingQueue = waitingQueue.filter(s => s.id !== socket.id);
        
      });

      socket.on("getUserCount", (feedback) => {
        feedback(users);
      })

console.log(io.sockets.sockets)
        console.log('someone connected!', socket.id);
      });
};
