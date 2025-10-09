import { Pool } from "pg";
import type { OutputDAO } from "../../dao/output.dao";
import type { IUnspentOutputRepo } from "./unspentOutputRepo.interface";
import { logger } from "../../infra/logger";

export class PgUnspentOutputRepo implements IUnspentOutputRepo {
  constructor(private readonly pool: Pool) {}

  public async getManyFromTxAndIndexPairs(
    pairs: [string, number][],
  ): Promise<OutputDAO[]> {
    // Left join inputs where input.refTxId = pair.txId and input.refIndex = pair.index, and filter out the null values
    logger.debug(pairs, "[PgUnspentOutputRepo] getManyFromTxAndIndexPairs");

    const values = pairs.flatMap((pair) => pair); // e.g., [1, 0, 3, 4]
    const placeholders = [];
    let paramIndex = 1;
    for (let i = 0; i < values.length; i += 2) {
      placeholders.push(`($${paramIndex}::TEXT , $${paramIndex + 1}::INTEGER)`);
      paramIndex += 2;
    }
    const query = `
    SELECT outputs.tx_id as tx_id, outputs.index as index, outputs.address as address, outputs.value as value FROM outputs
    LEFT JOIN inputs ON inputs.ref_tx_id = outputs.tx_id AND inputs.ref_index = outputs.index
    WHERE (outputs.tx_id, outputs.index) IN (VALUES ${placeholders.join(", ")}) AND inputs.tx_id IS NULL`;

    const result = await this.pool.query(query, values);
    logger.debug(
      result.rows,
      "[PgUnspentOutputRepo] getManyFromTxAndIndexPairs",
    );
    return result.rows.map((row) => ({
      txId: row.tx_id,
      index: row.index,
      address: row.address,
      value: Number(row.value),
    })) as OutputDAO[];
  }

  public async getManyFromAddress(address: string): Promise<OutputDAO[]> {
    const query = `
    SELECT outputs.tx_id as tx_id, outputs.index as index, outputs.address as address, outputs.value as value FROM outputs
    LEFT JOIN inputs ON inputs.ref_tx_id = outputs.tx_id AND inputs.ref_index = outputs.index
    WHERE address = $1 AND inputs.tx_id IS NULL`;
    const result = await this.pool.query(query, [address]);
    return result.rows.map((row) => ({
      txId: row.tx_id,
      index: row.index,
      address: row.address,
      value: Number(row.value),
    })) as OutputDAO[];
  }
}
