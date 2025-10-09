import type { OutputDAO } from "../../dao/output.dao";

export interface IUnspentOutputRepo {
  getManyFromTxAndIndexPairs(pairs: [string, number][]): Promise<OutputDAO[]>;
  getManyFromAddress(address: string): Promise<OutputDAO[]>;
}
