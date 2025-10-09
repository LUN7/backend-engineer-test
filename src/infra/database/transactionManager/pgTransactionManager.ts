import type { Pool, PoolClient } from "pg";
import type { ITransactionManager } from "./transactionManager.interface";

export class PgTransactionManager implements ITransactionManager<PoolClient> {
  constructor(private readonly pool: Pool) {}

  public async withTransaction(
    callback: (session: PoolClient) => Promise<void>,
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
