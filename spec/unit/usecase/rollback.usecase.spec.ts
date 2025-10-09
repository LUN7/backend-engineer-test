import { describe, it, expect, mock } from "bun:test";
import { RollbackUsecase } from "../../../src/usecase/rollback.usecase";
import type { IBlockRepo } from "../../../src/repo/blockRepo/blockRepo.interface";
import type { IRollbackLock } from "../../../src/service/rollbackLock/rollbackLock.interface";
import { UsecaseError } from "../../../src/error/usecase.error";
import { beforeEach } from "bun:test";

describe("RollbackUsecase", () => {
  let mockBlockRepo: IBlockRepo;
  let mockRollbackLock: IRollbackLock;

  beforeEach(() => {
    mockBlockRepo = {
      deleteAfterHeight: mock(async () => {}),
      getCurrentHeight: mock(async () => 10),
      save: mock(async () => {}),
    };
    mockRollbackLock = {
      lock: mock(async () => {}),
      unlock: mock(async () => {}),
      isLocked: mock(async () => false),
    };
  });

  it("should perform a rollback successfully", async () => {
    const usecase = new RollbackUsecase(mockBlockRepo, mockRollbackLock);
    await usecase.execute({ height: 5 });

    expect(mockRollbackLock.lock).toHaveBeenCalled();
    expect(mockBlockRepo.deleteAfterHeight).toHaveBeenCalledWith(5);
    expect(mockRollbackLock.unlock).toHaveBeenCalled();
  });

  it("should throw an error if a rollback is already in progress", async () => {
    const lockedRollbackMock = {
      ...mockRollbackLock,
      isLocked: mock(async () => true),
    };
    const usecase = new RollbackUsecase(mockBlockRepo, lockedRollbackMock);

    await expect(usecase.execute({ height: 5 })).rejects.toThrow(
      new UsecaseError("ROLLBACK_ALREADY_LOCKED", "Chain is being rolled back"),
    );
    expect(mockBlockRepo.deleteAfterHeight).not.toHaveBeenCalled();
  });

  it("should unlock even if the rollback fails", async () => {
    const failingBlockRepo = {
      ...mockBlockRepo,
      deleteAfterHeight: mock(async () => {
        throw new Error("DB error");
      }),
    };
    const usecase = new RollbackUsecase(failingBlockRepo, mockRollbackLock);

    await expect(usecase.execute({ height: 5 })).rejects.toThrow("DB error");

    expect(mockRollbackLock.lock).toHaveBeenCalled();
    expect(mockRollbackLock.unlock).toHaveBeenCalled();
  });
});
