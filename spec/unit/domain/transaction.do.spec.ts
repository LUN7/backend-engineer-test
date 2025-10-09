import { describe, it, expect, mock } from "bun:test";
import { TransactionEntity } from "../../../src/domain/transaction.do";
import { InputVO } from "../../../src/domain/input.do";
import { OutputVO } from "../../../src/domain/output.do";
import type { ITransactionValidator } from "../../../src/service/transactionValidator/transactionValidator.interface";

describe("TransactionEntity", () => {
  const mockInput = InputVO.create({ txId: "tx0", index: 0 });
  const mockOutput = OutputVO.create({ address: "addr1", value: 10 });

  const mockTransactionValidator: ITransactionValidator = {
    validateTransaction: mock(async () => {
      // happy path for testing
      return { isValid: true };
    }),
  };

  const mockInvalidTransactionValidator: ITransactionValidator = {
    validateTransaction: mock(async () => {
      return { isValid: false };
    }),
  };

  it("should create a transaction", () => {
    const transaction = TransactionEntity.create("tx1", {
      inputs: [mockInput],
      outputs: [mockOutput],
    });

    expect(transaction.id).toBe("tx1");
    expect(transaction.inputs).toEqual([mockInput]);
    expect(transaction.outputs).toEqual([mockOutput]);
  });

  it("should create multiple transactions", () => {
    const transactions = TransactionEntity.createMany([
      {
        id: "tx1",
        inputs: [mockInput],
        outputs: [mockOutput],
      },
      {
        id: "tx2",
        inputs: [mockInput],
        outputs: [mockOutput],
      },
    ]);

    expect(transactions).toHaveLength(2);
    expect(transactions[0].id).toBe("tx1");
    expect(transactions[1].id).toBe("tx2");
  });

  describe("validateTransaction", () => {
    it("should return true for a valid transaction", async () => {
      const transaction = TransactionEntity.create("tx1", {
        inputs: [mockInput],
        outputs: [mockOutput],
      });

      const isValid = await transaction.validateTransaction(
        mockTransactionValidator,
      );
      expect(isValid).toBe(true);
      expect(mockTransactionValidator.validateTransaction).toHaveBeenCalledWith(
        transaction,
      );
    });

    it("should return false for an invalid transaction", async () => {
      const transaction = TransactionEntity.create("tx1", {
        inputs: [mockInput],
        outputs: [mockOutput],
      });

      const isValid = await transaction.validateTransaction(
        mockInvalidTransactionValidator,
      );
      expect(isValid).toBe(false);
      expect(
        mockInvalidTransactionValidator.validateTransaction,
      ).toHaveBeenCalledWith(transaction);
    });
  });
});
