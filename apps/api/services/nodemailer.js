import nodemailer from 'nodemailer';

/**
 * Servicio de nodemailer para enviar correos electrónicos
 * @type {import('nodemailer').Transporter}
 */
const nodemailerService = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Forzar IPv4 (Render no soporta IPv6 saliente)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default nodemailerService;
