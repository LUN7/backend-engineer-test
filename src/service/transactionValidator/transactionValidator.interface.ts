import type { TransactionEntity } from "../../domain/transaction.do";

export interface ITransactionValidator {
  validateTransaction(transaction: TransactionEntity): Promise<{
    isValid: boolean;
    reason?: string;
  }>;
}
