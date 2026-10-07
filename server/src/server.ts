import dotenv from 'dotenv';
dotenv.config();
import { app } from './app.js';
import { purgeExpiredHolds } from './config/db.js';

const PORT = Number(process.env.PORT || 4000);
// Only start long-running server and sweep intervals when NOT running in a serverless environment (Vercel)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  // Safety net: sweep expired seat holds every minute (requests also purge lazily)
  setInterval(() => purgeExpiredHolds(), 60_000).unref?.();
  app.listen(PORT, () => {
    console.log(`REX Cinemas API listening on http://localhost:${PORT}`);
  });
}

export default app;
export { app };
