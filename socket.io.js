module.exports = (io) => {
  let waitingQueue = [];
  let users = 0;
  // console.log(io);
    io.on('connection', (socket) => {
      users++;
      if (waitingQueue.length > 0) {
      const partner = waitingQueue.shift();

      //socket.partner = partner.id;
      //partner.partner = socket.id;

      //socket.emit("matched", partner.id);
      //partner.emit("matched", socket.id);
    } else {
      waitingQueue.push(socket);
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
