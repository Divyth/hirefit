import { createApp } from './app.js';
import { connectDatabase } from './database/client.js';
import { env } from './config/env.js';

const app = createApp();

async function bootstrap() {
  await connectDatabase();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
