import express, { Request, Response } from 'express';
import {env} from './config/env';
import router from "./routes/index"


const app = express();

const PORT = env.PORT;

// Middleware para entender JSON en las peticiones
app.use(express.json());

// Ruta de prueba
app.get('/health', async (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Servidor corriendo correctamente' });
});

// Importar y usar las rutas
app.use('/api', router);


app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});