const nodemailer = require('nodemailer');
const fs = require('fs');

let transporter;

const Mail = {
    createTransporter: () => {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: process.env.SMTP_PORT,
            secure: true, // use TLS
            auth: {
                user: process.env.SMTP_EMAIL_ADDRESS,
                pass: process.env.SMTP_EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    },

    send: async ({ subject, to, html }) => {
        if (!transporter) {
            Mail.createTransporter();
        }

        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: `${process.env.SMTP_EMAIL_FROM}`,
            to,
            subject,
            html
        });

        return info;
    },
    ReadHTMLFile: async (path) => {
        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, data) => {
                if (err) {                    
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
};

module.exports = Mail;
