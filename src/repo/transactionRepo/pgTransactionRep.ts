import type { Pool, PoolClient } from "pg";
import type { ITransactionRepo } from "./transactionRepo.interface";
import type { TransactionDAO } from "../../dao/transaction.dao";

export class PgTransactionRepo implements ITransactionRepo<PoolClient> {
  constructor(private readonly pool: Pool) {}

  public async saveMany(
    transactions: TransactionDAO[],
    session: PoolClient,
  ): Promise<void> {
    const createTxPlaceHolders = transactions.map(
      (_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2}::INTEGER)`,
    );
    const createTxValues = transactions.flatMap((transaction) => [
      transaction.id,
      transaction.blockHeight,
    ]);

    await session.query(
      `INSERT INTO transactions (id, block_height) VALUES ${createTxPlaceHolders.join(", ")}`,
      createTxValues,
    );

    const createOutputPlaceHolders = transactions.flatMap((transaction) =>
      transaction.outputs.map(
        (_, idx) =>
          `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4}::NUMERIC(38,18))`,
      ),
    );
    const createOutputValues = transactions.flatMap((transaction) =>
      transaction.outputs.flatMap((output) => [
        output.txId,
        output.index,
        output.address,
        output.value,
      ]),
    );
    await session.query(
      `INSERT INTO outputs (tx_id, index, address, value) VALUES ${createOutputPlaceHolders.join(", ")}`,
      createOutputValues,
    );

    const createInputPlaceHolders = transactions.flatMap((transaction) =>
      transaction.inputs.map(
        (_, idx) =>
          `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4}::INTEGER)`,
      ),
    );
    const createInputValues = transactions.flatMap((transaction) =>
      transaction.inputs.flatMap((input) => [
        input.refTxId,
        input.refIndex,
        input.txId,
        input.index,
      ]),
    );
    await session.query(
      `INSERT INTO inputs (ref_tx_id, ref_index, tx_id, index) VALUES ${createInputPlaceHolders.join(", ")}`,
      createInputValues,
    );
  }
}
