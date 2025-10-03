module.exports = {
  active: true,
  host: process.env.HOST ? process.env.HOST : '0.0.0.0',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  timeout: {
    server: process.env.SERVER_TIMEOUT ? Number(process.env.SERVER_TIMEOUT) : 600000, // 10 Minutes
    socket: process.env.SOCKET_TIMEOUT ? Number(process.env.SOCKET_TIMEOUT) : 660000 // 11 Minutes
  }
};
