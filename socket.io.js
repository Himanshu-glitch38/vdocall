module.exports = (io) => {

  let users = 0;
  // console.log(io);
    io.on('connection', (socket) => {
      users++;
      socket.on('disconnect', () => {
        users--;
      });

      socket.on("getUserCount", (feedback) => {
        feedback(users);
      })

console.log(io.sockets.sockets)
        console.log('someone connected!', socket.id);
      });
};
