import { describe, it, expect, mock } from "bun:test";
import { BlockAggregateRoot } from "../../../src/domain/block.do";
import type { TransactionEntity } from "../../../src/domain/transaction.do";
import type { IBlockRepo } from "../../../src/repo/blockRepo/blockRepo.interface";

describe("BlockAggregateRoot", () => {
  const mockTransaction = { id: "tx1" } as TransactionEntity;
  const mockBlockRepo = {
    getCurrentHeight: async () => 1,
    save: mock(async () => {}),
    getBlocksByHeight: mock(async () => []),
    rollbackToHeight: mock(async () => {}),
    deleteAfterHeight: mock(async () => {}),
  } as IBlockRepo;

  it("should create a block", () => {
    const block = BlockAggregateRoot.create("block1", {
      height: 1,
      transactions: [mockTransaction],
    });

    expect(block.id).toBe("block1");
    expect(block.height).toBe(1);
    expect(block.transactions).toEqual([mockTransaction]);
  });

  describe("checkHeight", () => {
    it("should return true if height is valid", async () => {
      const block = BlockAggregateRoot.create("block2", {
        height: 2,
        transactions: [mockTransaction],
      });

      const { isValid, currentHeight } = await block.checkHeight(mockBlockRepo);
      expect(isValid).toBe(true);
      expect(currentHeight).toBe(1);
    });

    it("should return false if height is not valid", async () => {
      const block = BlockAggregateRoot.create("block3", {
        height: 3,
        transactions: [mockTransaction],
      });

      const { isValid, currentHeight } = await block.checkHeight(mockBlockRepo);
      expect(isValid).toBe(false);
      expect(currentHeight).toBe(1);
    });
  });

  describe("validateBlockSignature", () => {
    it("should return true for a valid signature", () => {
      const block = BlockAggregateRoot.create(
        "18f6e83ccef6e212b24e318a5c43ccf3921b5b11be4db9f616a6b8e8f570ec19",
        {
          height: 1,
          transactions: [{ id: "tx1" } as TransactionEntity],
        },
      );

      const { isValid, computedHash } = block.validateBlockSignature();
      expect(isValid).toBe(true);
      expect(computedHash).toBe(
        "18f6e83ccef6e212b24e318a5c43ccf3921b5b11be4db9f616a6b8e8f570ec19",
      );
    });

    it("should return false for an invalid signature", () => {
      const block = BlockAggregateRoot.create("invalid-hash", {
        height: 1,
        transactions: [{ id: "tx1" } as TransactionEntity],
      });

      const { isValid, computedHash } = block.validateBlockSignature();
      expect(isValid).toBe(false);
      expect(computedHash).not.toBe("invalid-hash");
    });
  });
});
