import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import recipesRouter from './routes/recipes.js';
import stockRouter from './routes/stock.js';
import historyRouter from './routes/history.js';
import mixRouter from './routes/mix.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/recipes', recipesRouter);
  app.use('/api/stock', stockRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/mix', mixRouter);

  if (process.env.NODE_ENV === 'production') {
    const distPath = join(__dirname, '..', 'client', 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  }

  app.use((error, req, res, next) => {
    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Neplatné JSON tělo požadavku' });
    }

    if (res.headersSent) return next(error);
    return res.status(error.status || 500).json({ error: error.message || 'Neočekávaná chyba serveru' });
  });

  return app;
}
