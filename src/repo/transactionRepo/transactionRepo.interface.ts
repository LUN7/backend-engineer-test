import type { TransactionDAO } from "../../dao/transaction.dao";

export interface ITransactionRepo<TSession = unknown> {
  saveMany(transactions: TransactionDAO[], session: TSession): Promise<void>;
}
