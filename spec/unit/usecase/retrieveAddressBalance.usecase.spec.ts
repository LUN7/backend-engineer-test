import { describe, it, expect, mock } from "bun:test";
import { RetrieveAddressBalanceUsecase } from "../../../src/usecase/retrieveAddressBalance.usecase";
import type { IUnspentOutputRepo } from "../../../src/repo/unspentOutputRepo/unspentOutputRepo.interface";
import type { OutputDAO } from "../../../src/dao/output.dao";

describe("RetrieveAddressBalanceUsecase", () => {
  it("should return the correct balance and outputs for an address", async () => {
    const mockOutputs: OutputDAO[] = [
      { address: "addr1", value: 10, txId: "tx1", index: 0 },
      { address: "addr1", value: 5, txId: "tx2", index: 0 },
    ];
    const mockUnspentOutputRepo: IUnspentOutputRepo = {
      getManyFromAddress: mock(async (address) =>
        mockOutputs.filter((o) => o.address === address),
      ),
      getManyFromTxAndIndexPairs: mock(async () => []),
    };

    const usecase = new RetrieveAddressBalanceUsecase(mockUnspentOutputRepo);
    const result = await usecase.execute({ address: "addr1" });

    expect(result.address).toBe("addr1");
    expect(result.balance).toBe(15);
    expect(result.outputs).toEqual(mockOutputs);
  });

  it("should return a balance of 0 and an empty outputs array for an address with no unspent outputs", async () => {
    const mockUnspentOutputRepo: IUnspentOutputRepo = {
      getManyFromAddress: mock(async () => []),
      getManyFromTxAndIndexPairs: mock(async () => []),
    };

    const usecase = new RetrieveAddressBalanceUsecase(mockUnspentOutputRepo);
    const result = await usecase.execute({ address: "addr1" });

    expect(result.address).toBe("addr1");
    expect(result.balance).toBe(0);
    expect(result.outputs).toEqual([]);
  });
});
