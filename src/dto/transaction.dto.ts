import type { InputDTO } from "./input.dto";
import type { OutputDTO } from "./output.dto";

export interface TransactionDTO {
  id: string;
  inputs: Array<InputDTO>;
  outputs: Array<OutputDTO>;
}
