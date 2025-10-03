module.exports = {
    active: true,
    port: process.env.SMTP_PORT || 25,
    host: process.env.SMTP_SERVER,
    username: process.env.SMTP_EMAIL_ADDRESS,
    password: process.env.SMTP_EMAIL_PASSWORD,
    secure: false,
    tls: false
    
};
