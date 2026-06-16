import nodemailer from 'nodemailer';
import dns from 'dns';

/**
 * Servicio de nodemailer para enviar correos electrónicos
 * @type {import('nodemailer').Transporter}
 */
const nodemailerService = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default nodemailerService;
