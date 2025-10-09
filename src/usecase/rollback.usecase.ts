import type { RollbackDTO } from "../dto/usecase/rollback.dto";
import type { IBlockRepo } from "../repo/blockRepo/blockRepo.interface";
import type { IRollbackLock } from "../service/rollbackLock/rollbackLock.interface";
import { UnexpectedUsecaseError, UsecaseError } from "../error/usecase.error";
import { logger } from "../infra/logger";

export const ROLLBACK_ERROR_CODES = {
  ROLLBACK_ALREADY_LOCKED: "ROLLBACK_ALREADY_LOCKED",
  INVALID_HEIGHT: "INVALID_HEIGHT",
};

export class RollbackUsecase {
  constructor(
    private readonly blockRepo: IBlockRepo,
    private readonly rollbackLock: IRollbackLock,
  ) {}

  async execute(dto: RollbackDTO): Promise<void> {
    logger.info(dto, "[RollbackUsecase] Executing rollback usecase");
    let isLockAcquired = false;
    try {
      const isRollbackInProgress = await this.rollbackLock.isLocked();
      if (isRollbackInProgress) {
        logger.debug(
          "[RollbackUsecase] Execution terminated as a existing rollback is in progress",
        );
        throw new UsecaseError(
          ROLLBACK_ERROR_CODES.ROLLBACK_ALREADY_LOCKED,
          "Chain is being rolled back",
        );
      }
      await this.rollbackLock.lock();
      isLockAcquired = true;

      const currentHeight = await this.blockRepo.getCurrentHeight();
      if (dto.height > currentHeight) {
        throw new UsecaseError(
          ROLLBACK_ERROR_CODES.INVALID_HEIGHT,
          "Invalid height, current height is " + currentHeight,
        );
      }
      await this.blockRepo.deleteAfterHeight(dto.height);
    } catch (error) {
      if (error instanceof UsecaseError) {
        throw error;
      }
      throw new UnexpectedUsecaseError(
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      if (isLockAcquired) {
        await this.rollbackLock.unlock();
      }
    }
  }
}
