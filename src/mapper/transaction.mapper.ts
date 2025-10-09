import type { TransactionDAO } from "../dao/transaction.dao";
import type { TransactionEntity } from "../domain/transaction.do";
import type { TransactionDTO } from "../dto/transaction.dto";

export class TransactionMapper {
  public static toDAO(
    transaction: TransactionEntity,
    blockHeight: number,
  ): TransactionDAO {
    return {
      id: transaction.id,
      blockHeight,
      inputs: transaction.inputs.map((input, idx) => ({
        refTxId: input.txId,
        refIndex: input.index,
        txId: transaction.id,
        index: idx,
      })),
      outputs: transaction.outputs.map((output, idx) => ({
        txId: transaction.id,
        index: idx,
        address: output.address,
        value: output.value,
      })),
    };
  }

  public static toDTO(transaction: TransactionDAO): TransactionDTO {
    return {
      id: transaction.id,
      inputs: transaction.inputs.map((input) => ({
        txId: input.refTxId,
        index: input.refIndex,
      })),
      outputs: transaction.outputs.map((output) => ({
        address: output.address,
        value: output.value,
      })),
    };
  }
}
