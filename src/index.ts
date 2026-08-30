import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Carga las variables de entorno del archivo .env
dotenv.config();

const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

// Middleware para entender JSON en las peticiones
app.use(express.json());

// Ruta de prueba
app.get('/health', async (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Servidor corriendo correctamente' });
});

// Ruta para verificar la conexión a la base de datos
app.get('/db-health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Base de datos conectada' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar con la base de datos',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});