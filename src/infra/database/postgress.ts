import { Pool } from "pg";
import { logger } from "../logger";

export async function dropAllTables(pool: Pool) {
  // I only do this to clean up tables for this challenge
  // This is something that should never exist in production-ready codebase
  await pool.query(`
    DROP TABLE IF EXISTS inputs;
    DROP TABLE IF EXISTS outputs;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS blocks;
    `);
}

export async function createGenesisBlock(pool: Pool) {
  const client = await pool.connect();
  try {
    client.query("BEGIN");
    await client.query(`
    INSERT INTO blocks (id, height) VALUES ('1', 1);
    INSERT INTO transactions (id, block_height) VALUES ('1', 1);
    INSERT INTO outputs (tx_id, index, address, value) VALUES ('1', 0, 'genesis', 100000);
  `);
    await client.query("COMMIT");
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err instanceof Error ? err : new Error("Unknown error");
  }
  client.release();
}

export async function initTables(pool: Pool) {
  await pool.query(`
      CREATE TABLE IF NOT EXISTS blocks(
        id TEXT NOT NULL PRIMARY KEY,
        height INTEGER NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS transactions(
        id TEXT NOT NULL PRIMARY KEY,
        block_height INTEGER NOT NULL,
        FOREIGN KEY (block_height) REFERENCES blocks(height) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS outputs (
        tx_id TEXT NOT NULL,
        index INTEGER NOT NULL,
        address TEXT NOT NULL,
        value NUMERIC(38, 18) NOT NULL,
        PRIMARY KEY (tx_id, index),
        FOREIGN KEY (tx_id) REFERENCES transactions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS inputs (
        ref_tx_id TEXT NOT NULL,
        ref_index INTEGER NOT NULL,
        tx_id TEXT NOT NULL,
        index INTEGER NOT NULL,
        PRIMARY KEY (tx_id, index),
        FOREIGN KEY (tx_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (ref_tx_id, ref_index) REFERENCES outputs(tx_id, index) ON DELETE CASCADE
      );
    `);

  const result = await pool.query(`SELECT * FROM blocks LIMIT 1`);
  if (result.rows.length === 0) {
    logger.info("[createTables] Creating genesis block...");
    await createGenesisBlock(pool);
  }
}

export async function connectDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  return pool;
}

export class PoolSingleton {
  private static poolInstance?: Pool;

  public static async getPool(): Promise<Pool> {
    if (!PoolSingleton.poolInstance) {
      PoolSingleton.poolInstance = await connectDatabase();
    }

    return PoolSingleton.poolInstance;
  }
}
