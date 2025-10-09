import type { InputDAO } from "./input.dao";
import type { OutputDAO } from "./output.dao";

export type TransactionDAO = {
  id: string;
  blockHeight: number;
  inputs: Array<InputDAO>;
  outputs: Array<OutputDAO>;
};
