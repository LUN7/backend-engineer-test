import type { OutputDetailsDTO } from "./output.dto";

export interface AddressBalanceDTO {
  address: string;
  balance: number;
  outputs: Array<OutputDetailsDTO>;
}
