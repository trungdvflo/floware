import fs from 'fs';
import nodemailer from "nodemailer";
import { Graylog } from './graylog';
export class MailUtils {
  private transporter;
  constructor() {
    this.transporter = this.CreateTransporter();
  }

  CreateTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: +process.env.SMTP_PORT || 587,
      secure: true, // use TLS
      auth: {
        user: process.env.SMTP_EMAIL_ADDRESS,
        pass: process.env.SMTP_EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async Send({ subject, to, html }) {
    try {
      if (!this.transporter) {
        this.transporter = this.CreateTransporter();
      }

      const info = await this.transporter.sendMail({
        from: `${process.env.SMTP_EMAIL_FROM}`,
        to,
        subject,
        html
      });
      return info;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: 'Email',
        jobName: 'send',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
  async ReadHTMLFile(path) {
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
}
