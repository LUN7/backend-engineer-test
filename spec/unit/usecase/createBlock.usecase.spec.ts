import {
  describe,
  it,
  expect,
  mock,
  spyOn,
  afterEach,
  beforeEach,
} from "bun:test";
import { CreateBlockUsecase } from "../../../src/usecase/createBlock.usecase";
import type { ITransactionValidator } from "../../../src/service/transactionValidator/transactionValidator.interface";
import type { ITransactionRepo } from "../../../src/repo/transactionRepo/transactionRepo.interface";
import type { IBlockRepo } from "../../../src/repo/blockRepo/blockRepo.interface";
import type { ITransactionManager } from "../../../src/infra/database/transactionManager/transactionManager.interface";
import type { IRollbackLock } from "../../../src/service/rollbackLock/rollbackLock.interface";
import { UsecaseError } from "../../../src/error/usecase.error";
import { BlockAggregateRoot } from "../../../src/domain/block.do";

describe("CreateBlockUsecase", () => {
  const mockTransactionValidator: ITransactionValidator = {
    validateTransaction: mock(async () => {
      return { isValid: true };
    }),
  };
  const mockTransactionRepo: ITransactionRepo = {
    saveMany: mock(async () => {}),
  };
  const mockBlockRepo: IBlockRepo = {
    getCurrentHeight: mock(async () => 0),
    save: mock(async () => {}),
    deleteAfterHeight: mock(async () => {}),
  };
  const mockDbTransactionManager: ITransactionManager = {
    withTransaction: mock(async (callback) => await callback({})),
  };
  const mockRollbackLock: IRollbackLock = {
    lock: mock(async () => {}),
    unlock: mock(async () => {}),
    isLocked: mock(async () => false),
  };

  const validDto = {
    id: "a7d9b2e0", // A valid hash for the data below
    height: 1,
    transactions: [
      {
        id: "tx1",
        inputs: [{ txId: "tx0", index: 0 }],
        outputs: [{ address: "addr1", value: 10 }],
      },
    ],
  };
  let validateBlockSignatureSpy: ReturnType<typeof spyOn>;
  let checkHeightSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    validateBlockSignatureSpy = spyOn(
      BlockAggregateRoot.prototype,
      "validateBlockSignature",
    );
    checkHeightSpy = spyOn(BlockAggregateRoot.prototype, "checkHeight");
  });

  afterEach(() => {
    validateBlockSignatureSpy.mockRestore();
    checkHeightSpy.mockRestore();
  });

  it("should create a block successfully", async () => {
    validateBlockSignatureSpy.mockReturnValue({
      isValid: true,
      computedHash: "",
    });
    checkHeightSpy.mockResolvedValue({ isValid: true, currentHeight: 0 });

    const usecase = new CreateBlockUsecase(
      mockTransactionValidator,
      mockTransactionRepo,
      mockBlockRepo,
      mockDbTransactionManager,
      mockRollbackLock,
    );

    const result = await usecase.execute(validDto);

    expect(result.id).toBe(validDto.id);
    expect(result.height).toBe(validDto.height);
    expect(mockBlockRepo.save).toHaveBeenCalled();
    expect(mockTransactionRepo.saveMany).toHaveBeenCalled();
  });

  it("should throw an error if rollback is in progress", async () => {
    const lockedRollbackMock = {
      ...mockRollbackLock,
      isLocked: mock(async () => true),
    };
    const usecase = new CreateBlockUsecase(
      mockTransactionValidator,
      mockTransactionRepo,
      mockBlockRepo,
      mockDbTransactionManager,
      lockedRollbackMock,
    );

    await expect(usecase.execute(validDto)).rejects.toThrow(
      new UsecaseError("ROLLBACK_IN_PROGRESS", "Chain is being rolled back"),
    );
  });

  it("should throw an error if there are no inputs", async () => {
    const usecase = new CreateBlockUsecase(
      mockTransactionValidator,
      mockTransactionRepo,
      mockBlockRepo,
      mockDbTransactionManager,
      mockRollbackLock,
    );
    const dtoWithNoInputs = {
      ...validDto,
      transactions: [{ id: "tx1", inputs: [], outputs: [] }],
    };

    await expect(usecase.execute(dtoWithNoInputs)).rejects.toThrow(
      new UsecaseError(
        "MIN_ONE_INPUT_TRANSACTION",
        "Min one input transaction is required",
      ),
    );
  });

  it("should throw an error for an invalid block signature", async () => {
    validateBlockSignatureSpy.mockReturnValueOnce({
      isValid: false,
      computedHash: "wrong_hash",
    });
    checkHeightSpy.mockResolvedValue({ isValid: true, currentHeight: 0 });
    const usecase = new CreateBlockUsecase(
      mockTransactionValidator,
      mockTransactionRepo,
      mockBlockRepo,
      mockDbTransactionManager,
      mockRollbackLock,
    );

    await expect(usecase.execute(validDto)).rejects.toThrow(
      new UsecaseError(
        "INVALID_BLOCK_SIGNATURE",
        "Invalid block, computed hash: wrong_hash",
      ),
    );
  });

  it("should throw an error for an invalid height", async () => {
    validateBlockSignatureSpy.mockReturnValue({
      isValid: true,
      computedHash: "",
    });
    checkHeightSpy.mockResolvedValueOnce({ isValid: false, currentHeight: 1 });
    const usecase = new CreateBlockUsecase(
      mockTransactionValidator,
      mockTransactionRepo,
      mockBlockRepo,
      mockDbTransactionManager,
      mockRollbackLock,
    );

    await expect(usecase.execute(validDto)).rejects.toThrow(
      new UsecaseError("INVALID_HEIGHT", "Invalid height, current height: 1"),
    );
  });

  it("should throw an error if same input is used across transactions", async () => {
    validateBlockSignatureSpy.mockReturnValue({
      isValid: true,
      computedHash: "",
    });
    checkHeightSpy.mockResolvedValue({ isValid: true, currentHeight: 0 });

    const invalidDTO = {
      ...validDto,
      transactions: [
        {
          id: "tx2",
          inputs: [{ index: 0, txId: "tx2" }],
          outputs: [{ address: "addr1", value: 10 }],
        },
        {
          id: "tx3",
          inputs: [{ index: 0, txId: "tx2" }],
          outputs: [{ address: "addr2", value: 10 }],
        },
      ],
    };

    const usecase = new CreateBlockUsecase(
      mockTransactionValidator,
      mockTransactionRepo,
      mockBlockRepo,
      mockDbTransactionManager,
      mockRollbackLock,
    );

    await expect(usecase.execute(invalidDTO)).rejects.toThrow(
      new UsecaseError("TRANSACTION_INPUT_NOT_VALID", "Invalid transactions"),
    );
  });

  it("should throw an error if any transaction is invalid", async () => {
    validateBlockSignatureSpy.mockReturnValue({
      isValid: true,
      computedHash: "",
    });
    checkHeightSpy.mockResolvedValue({ isValid: true, currentHeight: 0 });
    const invalidTransactionValidator = {
      ...mockTransactionValidator,
      validateTransaction: mock(async () => {
        return { isValid: false };
      }),
    };
    const usecase = new CreateBlockUsecase(
      invalidTransactionValidator,
      mockTransactionRepo,
      mockBlockRepo,
      mockDbTransactionManager,
      mockRollbackLock,
    );

    await expect(usecase.execute(validDto)).rejects.toThrow(
      new UsecaseError("TRANSACTION_INPUT_NOT_VALID", "Invalid transactions"),
    );
  });
});
