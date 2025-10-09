import * as Postgress from "./infra/database/postgress";
import { logger } from "./infra/logger";
import { App } from "./app";

async function bootstrap() {
  logger.info("[bootstrap] Bootstrapping...");
  const pool = await Postgress.PoolSingleton.getPool();

  logger.info("[bootstrap] dropping all tables...");
  await Postgress.dropAllTables(pool);

  logger.info("[bootstrap] initialize table...");
  await Postgress.initTables(pool);
}

try {
  if (process.env.NODE_ENV !== "test") {
    await bootstrap();
  }
  const app = new App();
  await app.init();
  await app.start();
} catch (err) {
  logger.error(err);
  process.exit(1);
}
