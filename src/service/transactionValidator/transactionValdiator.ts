import type { TransactionEntity } from "../../domain/transaction.do";
import type { IUnspentOutputRepo } from "../../repo/unspentOutputRepo/unspentOutputRepo.interface";
import type { ITransactionValidator } from "./transactionValidator.interface";

export class TransactionValidator implements ITransactionValidator {
  constructor(private readonly outputRepo: IUnspentOutputRepo) {}

  public async validateTransaction(
    transaction: TransactionEntity,
  ): Promise<{ isValid: boolean; reason?: string }> {
    // I learnt a concept from internet, (Unspent Transaction Output)
    const unspentOutputsQueryPairs: [string, number][] = transaction.inputs.map(
      (input) => [input.txId, input.index],
    );
    const unspentOutputs = await this.outputRepo.getManyFromTxAndIndexPairs(
      unspentOutputsQueryPairs,
    );

    if (unspentOutputs.length !== transaction.inputs.length) {
      return {
        isValid: false,
        reason: "Some inputs are not found in unspent outputs",
      };
    }

    let unspentBalance = 0;
    unspentOutputs.forEach((output) => {
      unspentBalance += output.value;
    });

    let toSpendBalance = 0;
    transaction.outputs.forEach((output) => {
      toSpendBalance += output.value;
    });

    const isBalanceEqual = unspentBalance === toSpendBalance;
    return {
      isValid: isBalanceEqual,
      ...(isBalanceEqual
        ? {}
        : {
            reason: `Balance is not equal, unspent balance: ${unspentBalance}, to spend balance: ${toSpendBalance}`,
          }),
    };
  }
}
