import nodemailer from 'nodemailer';
import dns from 'dns';

let transporter = null;

/**
 * Obtiene o inicializa el transportador de correo con resolución IPv4 dinámica
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  let host = 'smtp.gmail.com';
  let tlsOptions = {};

  try {
    // Resolver smtp.gmail.com únicamente a direcciones IPv4 (A records)
    const addresses = await dns.promises.resolve4('smtp.gmail.com');
    if (addresses && addresses.length > 0) {
      host = addresses[0];
      tlsOptions = { servername: 'smtp.gmail.com' };
      console.log(`📡 SMTP Host pre-resuelto a IPv4: ${host}`);
    }
  } catch (err) {
    console.error('⚠️ Error resolviendo smtp.gmail.com a IPv4, se usará el hostname:', err);
  }

  transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    tls: {
      ...tlsOptions,
      rejectUnauthorized: false,
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Servicio Drop-in compatible para envío de correos
 */
const nodemailerService = {
  sendMail: async (options) => {
    const isEmailDisabled = process.env.DISABLE_EMAIL === 'true';
    if (isEmailDisabled) {
      console.log('--------------------------------------------------');
      console.log('✉️ [Nodemailer Simulado - Envío de Correo Desactivado]');
      console.log(`Para: ${options.to}`);
      console.log(`Asunto: ${options.subject}`);
      if (options.text) {
        console.log(`Mensaje: ${options.text}`);
      }
      if (options.html) {
        // Encontrar enlaces href en el html para mostrarlos en consola
        const hrefRegex = /href="([^"]+)"/g;
        let match;
        const links = [];
        while ((match = hrefRegex.exec(options.html)) !== null) {
          links.push(match[1]);
        }
        if (links.length > 0) {
          console.log('Enlaces detectados en el correo:');
          links.forEach(link => console.log(`  🔗 ${link}`));
        }
      }
      console.log('--------------------------------------------------');
      return { messageId: `mock-id-${Date.now()}` };
    }

    const t = await getTransporter();
    return t.sendMail(options);
  }
};

export default nodemailerService;
