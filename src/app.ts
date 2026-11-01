import express from 'express';
import authRoutes from './routes/auth.routes';
import itemRoutes from './routes/item.routes';
import authMiddleware from './middleware/auth';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/items', authMiddleware, itemRoutes); 

app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.use(errorHandler); 

export default app;