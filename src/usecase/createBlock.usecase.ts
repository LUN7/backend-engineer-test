import { BlockAggregateRoot } from "../domain/block.do";
import { InputVO } from "../domain/input.do";
import { OutputVO } from "../domain/output.do";
import { TransactionEntity } from "../domain/transaction.do";
import type { BlockDTO } from "../dto/block.dto";
import type { CreateBlockDTO } from "../dto/usecase/createBlock.dto";
import { UnexpectedUsecaseError, UsecaseError } from "../error/usecase.error";
import type { ITransactionManager } from "../infra/database/transactionManager/transactionManager.interface";
import { logger } from "../infra/logger";
import { BlockMapper } from "../mapper/block.mapper";
import { TransactionMapper } from "../mapper/transaction.mapper";
import type { IBlockRepo } from "../repo/blockRepo/blockRepo.interface";
import type { ITransactionRepo } from "../repo/transactionRepo/transactionRepo.interface";
import type { IRollbackLock } from "../service/rollbackLock/rollbackLock.interface";
import type { ITransactionValidator } from "../service/transactionValidator/transactionValidator.interface";

export const CREATE_BLOCK_ERROR_CODES = {
  ROLLBACK_IN_PROGRESS: "ROLLBACK_IN_PROGRESS",
  INVALID_HEIGHT: "INVALID_HEIGHT",
  INVALID_BLOCK_SIGNATURE: "INVALID_BLOCK_SIGNATURE",
  INVALID_TRANSACTIONS: "INVALID_TRANSACTIONS",
  MIN_ONE_INPUT_TRANSACTION: "MIN_ONE_INPUT_TRANSACTION",
};

export class CreateBlockUsecase {
  constructor(
    private readonly transactionValidator: ITransactionValidator,
    private readonly transactionRepo: ITransactionRepo,
    private readonly blockRepo: IBlockRepo,
    private readonly dbTransactionManager: ITransactionManager,
    private readonly rollbackLock: IRollbackLock,
  ) {}

  async execute(dto: CreateBlockDTO): Promise<BlockDTO> {
    try {
      logger.info(dto, "[CreateBlockUsecase] Executing create block usecase");

      const isRollbackInProgress = await this.rollbackLock.isLocked();
      if (isRollbackInProgress) {
        throw new UsecaseError(
          CREATE_BLOCK_ERROR_CODES.ROLLBACK_IN_PROGRESS,
          "Chain is being rolled back",
        );
      }

      if (dto.transactions.flatMap((tx) => tx.inputs).length === 0) {
        throw new UsecaseError(
          CREATE_BLOCK_ERROR_CODES.MIN_ONE_INPUT_TRANSACTION,
          "Min one input transaction is required",
        );
      }

      const transactions = TransactionEntity.createMany(
        dto.transactions.map((transaction) => ({
          id: transaction.id,
          inputs: InputVO.createMany(transaction.inputs),
          outputs: OutputVO.createMany(transaction.outputs),
        })),
      );

      const block = BlockAggregateRoot.create(dto.id, {
        height: dto.height,
        transactions,
      });

      // Perform the heavy block validation first, to reduce the possibility of transactions failure
      const validateBlockResult = block.validateBlockSignature();
      if (!validateBlockResult.isValid) {
        throw new UsecaseError(
          CREATE_BLOCK_ERROR_CODES.INVALID_BLOCK_SIGNATURE,
          `Invalid block, computed hash: ${validateBlockResult.computedHash}`,
        );
      }

      const checkHeightResult = await block.checkHeight(this.blockRepo);
      if (!checkHeightResult.isValid) {
        throw new UsecaseError(
          CREATE_BLOCK_ERROR_CODES.INVALID_HEIGHT,
          `Invalid height, current height: ${checkHeightResult.currentHeight}`,
        );
      }

      // TODO: validate if no input is the same across the transactions

      const areAllTransactionsValid = await Promise.all(
        transactions.map((transaction) =>
          transaction.validateTransaction(this.transactionValidator),
        ),
      );

      if (!areAllTransactionsValid.every((isValid) => isValid)) {
        throw new UsecaseError(
          CREATE_BLOCK_ERROR_CODES.INVALID_TRANSACTIONS,
          "Invalid transactions",
        );
      }

      const transactionDAO = transactions.map((transaction) =>
        TransactionMapper.toDAO(transaction, dto.height),
      );
      const blockDAO = BlockMapper.toDAO(block);

      await this.dbTransactionManager.withTransaction(async (session) => {
        await this.blockRepo.save(blockDAO, session);
        await this.transactionRepo.saveMany(transactionDAO, session);
      });

      return {
        id: block.id,
        height: block.height,
        transactions: transactionDAO.map((transaction) =>
          TransactionMapper.toDTO(transaction),
        ),
      };
    } catch (error) {
      if (error instanceof UsecaseError) {
        throw error;
      }
      throw new UnexpectedUsecaseError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
}
