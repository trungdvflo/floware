module.exports = {
  active: true,
  host: process.env.HOST ? process.env.HOST : '0.0.0.0',
  port: process.env.PORT ? Number(process.env.PORT) : 3000
};

