import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import recipesRouter from './routes/recipes.js';
import stockRouter from './routes/stock.js';
import historyRouter from './routes/history.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use('/api/recipes', recipesRouter);
app.use('/api/stock', stockRouter);
app.use('/api/history', historyRouter);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`VapeMixer server running on port ${PORT}`);
});
