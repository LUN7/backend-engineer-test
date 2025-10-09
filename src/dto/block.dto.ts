import type { TransactionDTO } from "./transaction.dto";

export interface BlockDTO {
  id: string;
  height: number;
  transactions: Array<TransactionDTO>;
}
