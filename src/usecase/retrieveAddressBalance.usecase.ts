import type { AddressBalanceDTO } from "../dto/addressBalance.dto";
import type { RetrieveAddressBalanceDTO } from "../dto/usecase/retrieveAddressBalance.dto";
import { UnexpectedUsecaseError, UsecaseError } from "../error/usecase.error";
import { logger } from "../infra/logger";
import type { IUnspentOutputRepo } from "../repo/unspentOutputRepo/unspentOutputRepo.interface";

export const RETRIEVE_ADDRESS_BALANCE_ERROR_CODES = {
  ADDRESS_NOT_FOUND: "ADDRESS_NOT_FOUND",
};

export class RetrieveAddressBalanceUsecase {
  constructor(private readonly unspentOutputRepo: IUnspentOutputRepo) {}

  async execute(dto: RetrieveAddressBalanceDTO): Promise<AddressBalanceDTO> {
    try {
      logger.info(
        dto,
        "[RetrieveAddressBalanceUsecase] Executing retrieve address balance usecase",
      );

      const unspentOutputs = await this.unspentOutputRepo.getManyFromAddress(
        dto.address,
      );

      return {
        address: dto.address,
        balance: unspentOutputs.reduce((acc, output) => acc + output.value, 0),
        outputs: unspentOutputs.map((output) => ({
          address: output.address,
          value: output.value,
          txId: output.txId,
          index: output.index,
        })),
      };
    } catch (error) {
      logger.error(
        error,
        "[CreateBlockUsecase] Error executing create block usecase",
      );
      if (error instanceof UsecaseError) {
        throw error;
      }
      throw new UnexpectedUsecaseError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
}
