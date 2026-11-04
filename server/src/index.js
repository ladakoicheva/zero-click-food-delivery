import express from 'express';
import { menu } from '../data-mock/menu.js';
import { seedDatabase } from './database/database.js';
import { orderRouter } from './modules/orders/routes.js';
import { suggestionsRouter } from './modules/suggestions/routes.js';

seedDatabase(menu)


export function createApp() {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api/orders', orderRouter);
  app.use('/api/suggestions', suggestionsRouter)
  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', mode: 'demo' });
  });

  
  
 

  return app;
}


  const app = createApp()
  const port = Number(process.env.PORT) || 3000
  app.listen(port, () => {
    console.log(`Demo food delivery API listening on http://localhost:${port}`)
  })
