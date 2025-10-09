import * as Postgress from "./infra/database/postgress";
import { PgTransactionManager } from "./infra/database/transactionManager/pgTransactionManager";
import { TransactionValidator } from "./service/transactionValidator/transactionValdiator";
import { PgUnspentOutputRepo } from "./repo/unspentOutputRepo/pgUnspentOutputRepo";
import { PgBlockRepo } from "./repo/blockRepo/pgBlockRepo";
import { PgTransactionRepo } from "./repo/transactionRepo/pgTransactionRep";
import {
  createBlockSchema,
  type CreateBlockDTO,
} from "./dto/usecase/createBlock.dto";
import { logger } from "./infra/logger";
import { fastifyInstance } from "./infra/fastifyInstance";
import {
  CREATE_BLOCK_ERROR_CODES,
  CreateBlockUsecase,
} from "./usecase/createBlock.usecase";
import { UsecaseError } from "./error/usecase.error";
import { RetrieveAddressBalanceUsecase } from "./usecase/retrieveAddressBalance.usecase";
import {
  retrieveAddressBalanceSchema,
  type RetrieveAddressBalanceDTO,
} from "./dto/usecase/retrieveAddressBalance.dto";
import { RollbackLock } from "./service/rollbackLock/rollbackLock";
import { InMemoryKeyValueStore } from "./service/kvStore/inMemoryKVStore";
import { rollbackSchema, type RollbackDTO } from "./dto/usecase/rollback.dto";
import {
  ROLLBACK_ERROR_CODES,
  RollbackUsecase,
} from "./usecase/rollback.usecase";
import type { FastifyInstance } from "fastify";

export class App {
  public fastifyInstance: FastifyInstance;

  constructor() {
    this.fastifyInstance = fastifyInstance;
  }

  async init() {
    const pool = await Postgress.PoolSingleton.getPool();
    const pgTransactionManager = new PgTransactionManager(pool);
    const pgUnspentOutputRepo = new PgUnspentOutputRepo(pool);
    const transactionValidator = new TransactionValidator(pgUnspentOutputRepo);
    const pgBlockRepo = new PgBlockRepo(pool);
    const pgTransactionRepo = new PgTransactionRepo(pool);

    const inMemoryKeyValueStore = new InMemoryKeyValueStore();
    const rollbackLock = new RollbackLock(inMemoryKeyValueStore);

    const createBlockUsecase = new CreateBlockUsecase(
      transactionValidator,
      pgTransactionRepo,
      pgBlockRepo,
      pgTransactionManager,
      rollbackLock,
    );

    const retrieveAddressBalanceUsecase = new RetrieveAddressBalanceUsecase(
      pgUnspentOutputRepo,
    );

    const rollbackUsecase = new RollbackUsecase(pgBlockRepo, rollbackLock);

    this.fastifyInstance.get("/balance/:address", {
      handler: async (request, reply) => {
        const result = await retrieveAddressBalanceUsecase.execute(
          request.params as RetrieveAddressBalanceDTO,
        );
        reply.send(result);
      },
      schema: {
        params: retrieveAddressBalanceSchema,
      },
    });

    this.fastifyInstance.post("/rollback", {
      handler: async (request, reply) => {
        try {
          const result = await rollbackUsecase.execute(
            request.query as RollbackDTO,
          );
          reply.send(result);
        } catch (err) {
          if (err instanceof UsecaseError) {
            switch (err.errorCode) {
              case ROLLBACK_ERROR_CODES.ROLLBACK_ALREADY_LOCKED:
                reply.status(400).send({
                  code: err.errorCode,
                  error: "Chain is being rolled back",
                });
                return;
              case ROLLBACK_ERROR_CODES.INVALID_HEIGHT:
                reply.status(400).send({
                  code: err.errorCode,
                  error: "Target height is greater than current height",
                });
                return;
              default:
                break;
            }
          }
          logger.error(err, "[RollbackHandler] Unhandled Error in rollback");
          reply.status(500).send();
        }
      },
      schema: {
        querystring: rollbackSchema,
      },
    });

    this.fastifyInstance.post("/blocks", {
      handler: async (request, reply) => {
        try {
          const result = await createBlockUsecase.execute(
            request.body as CreateBlockDTO,
          );
          logger.debug(`[CreateBlockHandler] Block created: ${result}`);
          reply.send(result);
        } catch (err) {
          if (err instanceof UsecaseError) {
            switch (err.errorCode) {
              case CREATE_BLOCK_ERROR_CODES.INVALID_BLOCK_SIGNATURE:
                reply.status(400).send({
                  code: err.errorCode,
                  error: "Invalid block signature",
                });
                return;
              case CREATE_BLOCK_ERROR_CODES.INVALID_HEIGHT:
                reply.status(400).send({
                  code: err.errorCode,
                  error: "Invalid block height",
                });
                return;
              case CREATE_BLOCK_ERROR_CODES.INVALID_TRANSACTIONS:
                reply.status(400).send({
                  code: err.errorCode,
                  error:
                    "Invalid transactions, sum of inputs and outputs are not equal",
                });
                return;
              case CREATE_BLOCK_ERROR_CODES.MIN_ONE_INPUT_TRANSACTION:
                reply.status(400).send({
                  code: err.errorCode,
                  error: "Minimum one input transaction is required",
                });
                return;
              default:
                break;
            }
          }
          logger.error(
            err,
            "[CreateBlockHandler] Unhandled Error in create block",
          );
          reply.status(500).send();
        }
      },
      schema: {
        body: createBlockSchema,
      },
    });

    this.fastifyInstance.get("/health", async (_, reply) => {
      reply.status(200).send("OK");
    });
  }

  async start() {
    await this.fastifyInstance.listen({
      port: 3000,
      host: "0.0.0.0",
    });
  }

  async close() {
    await this.fastifyInstance.close();
  }
}
