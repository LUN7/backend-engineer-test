import type { Pool, PoolClient } from "pg";
import type { BlockDAO } from "../../dao/block.dao";
import type { IBlockRepo } from "./blockRepo.interface";
import { logger } from "../../infra/logger";

export class PgBlockRepo implements IBlockRepo<PoolClient> {
  constructor(private readonly pool: Pool) {}

  public async save(block: BlockDAO, session: PoolClient): Promise<void> {
    const result = await session.query(
      "INSERT INTO blocks (id, height) VALUES ($1, $2)",
      [block.id, block.height],
    );
    logger.debug(`[PgBlockRepo] Block saved: ${result}`);
  }

  public async getCurrentHeight(): Promise<number> {
    logger.debug("[PgBlockRepo] getCurrentHeight");
    const result = await this.pool.query(
      "SELECT height FROM blocks ORDER BY height DESC LIMIT 1",
    );
    logger.debug(result.rows, "[PgBlockRepo] getCurrentHeight");
    return result.rows[0].height;
  }

  public async deleteAfterHeight(height: number): Promise<void> {
    logger.debug(`[PgBlockRepo] Delete after height: ${height}`);

    // Since the relationship has cascade delete, when block is deleted, the transactions will be deleted automatically
    await this.pool.query("DELETE FROM blocks WHERE height > $1", [height]);
  }
}
