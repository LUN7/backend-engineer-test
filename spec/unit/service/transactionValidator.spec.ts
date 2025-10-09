import { describe, it, expect, mock } from "bun:test";
import { TransactionValidator } from "../../../src/service/transactionValidator/transactionValdiator";
import type { IUnspentOutputRepo } from "../../../src/repo/unspentOutputRepo/unspentOutputRepo.interface";
import { TransactionEntity } from "../../../src/domain/transaction.do";
import { InputVO } from "../../../src/domain/input.do";
import { OutputVO } from "../../../src/domain/output.do";

describe("TransactionValidator", () => {
  it("should return true for a valid transaction", async () => {
    const mockUnspentOutputRepo: IUnspentOutputRepo = {
      getManyFromTxAndIndexPairs: mock(async () => [
        { txId: "tx0", index: 0, address: "addr1", value: 10 },
      ]),
      getManyFromAddress: mock(async () => []),
    };

    const transactionValidator = new TransactionValidator(
      mockUnspentOutputRepo,
    );

    const transaction = TransactionEntity.create("tx1", {
      inputs: [InputVO.create({ txId: "tx0", index: 0 })],
      outputs: [OutputVO.create({ address: "addr2", value: 10 })],
    });

    const result = await transactionValidator.validateTransaction(transaction);
    expect(result.isValid).toBe(true);
  });

  it("should return false if an input is not found in unspent outputs", async () => {
    const mockUnspentOutputRepo: IUnspentOutputRepo = {
      getManyFromTxAndIndexPairs: mock(async () => []),
      getManyFromAddress: mock(async () => []),
    };

    const transactionValidator = new TransactionValidator(
      mockUnspentOutputRepo,
    );

    const transaction = TransactionEntity.create("tx1", {
      inputs: [InputVO.create({ txId: "tx0", index: 0 })],
      outputs: [OutputVO.create({ address: "addr2", value: 10 })],
    });

    const result = await transactionValidator.validateTransaction(transaction);
    expect(result.isValid).toBe(false);
  });

  it("should return false if the sum of inputs and outputs do not match", async () => {
    const mockUnspentOutputRepo: IUnspentOutputRepo = {
      getManyFromTxAndIndexPairs: mock(async () => [
        { txId: "tx0", index: 0, address: "addr1", value: 9 }, // Mismatched value
      ]),
      getManyFromAddress: mock(async () => []),
    };

    const transactionValidator = new TransactionValidator(
      mockUnspentOutputRepo,
    );

    const transaction = TransactionEntity.create("tx1", {
      inputs: [InputVO.create({ txId: "tx0", index: 0 })],
      outputs: [OutputVO.create({ address: "addr2", value: 10 })],
    });

    const result = await transactionValidator.validateTransaction(transaction);
    expect(result.isValid).toBe(false);
  });

  it("should handle multiple inputs and outputs correctly", async () => {
    const mockUnspentOutputRepo: IUnspentOutputRepo = {
      getManyFromTxAndIndexPairs: mock(async () => [
        { txId: "tx0", index: 0, address: "addr1", value: 10 },
        { txId: "tx0", index: 1, address: "addr2", value: 5 },
      ]),
      getManyFromAddress: mock(async () => []),
    };

    const transactionValidator = new TransactionValidator(
      mockUnspentOutputRepo,
    );

    const transaction = TransactionEntity.create("tx1", {
      inputs: [
        InputVO.create({ txId: "tx0", index: 0 }),
        InputVO.create({ txId: "tx0", index: 1 }),
      ],
      outputs: [
        OutputVO.create({ address: "addr3", value: 8 }),
        OutputVO.create({ address: "addr4", value: 7 }),
      ],
    });

    const result = await transactionValidator.validateTransaction(transaction);
    expect(result.isValid).toBe(true);
  });

  it("should handle floating point precision issue", async () => {
    const mockUnspentOutputRepo: IUnspentOutputRepo = {
      getManyFromTxAndIndexPairs: mock(async () => [
        { txId: "tx0", index: 0, address: "addr1", value: 0.3 },
      ]),
      getManyFromAddress: mock(async () => []),
    };

    const transactionValidator = new TransactionValidator(
      mockUnspentOutputRepo,
    );

    const transaction = TransactionEntity.create("tx1", {
      inputs: [InputVO.create({ txId: "tx0", index: 0 })],
      outputs: [
        OutputVO.create({
          address: "addr2",
          value: 0.1,
        }),
        OutputVO.create({
          address: "addr3",
          value: 0.2,
        }),
      ],
    });

    const result = await transactionValidator.validateTransaction(transaction);
    expect(result.isValid).toBe(true);
  });
});
