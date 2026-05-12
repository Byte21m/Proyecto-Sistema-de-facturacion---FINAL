import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { SqliteError } from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import authRouter from './features/auth/auth.routes.js';
import userRouter from './features/user/user.routes.js';
import productRouter from './features/product/product.routes.js';
import saleRouter from './features/sale/sale.routes.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/api/ping', (req, res) => {
  res.json({ mensaje: '¡El sistema de facturación está activo!' });
});

// Rutas del sistema de facturación
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/product', productRouter);
app.use('/api/sale', saleRouter);

app.use((err, req, res, _next) => {
  let errorString = 'Desconocido';
  let errorCode = 500;

  if (err instanceof ZodError) {
    const errorsFormatted = err.issues.map((issue) => {
      return `${issue.path[0].toUpperCase()}: ${issue.message}.\n`;
    });
    errorString = errorsFormatted.join('');
    errorCode = 400;
  }

  if (err instanceof SqliteError) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const property = err.message.split('.')[1];

      errorCode = 400;
      errorString = `${property?.toUpperCase() || ''} ya se encuentra en uso.`;
    }

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      errorCode = 409;
      errorString = 'No se puede eliminar porque tiene registros asociados (ventas, etc).';
    }
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ error: 'Token expirado' });
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(403).json({ error: 'Token invalido' });
  }

  if (errorCode === 500) {
    if (err && err.message) {
      console.log('Error 500:', err.message);
    } else {
      console.log('Error 500: Error desconocido (posible en Nodemailer)');
    }
  } else {
    console.log('Error capturado:', errorString);
  }

  return res.status(errorCode).json({ error: errorString });
});

app.listen(port, () => {
  console.log(`🚀 Servidor de facturación corriendo en http://localhost:${port}`);
});

export default app;
