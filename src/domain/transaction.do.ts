import { logger } from "../infra/logger";
import type { ITransactionValidator } from "../service/transactionValidator/transactionValidator.interface";
import { Entity } from "../shared/domain/domain";
import { InputVO } from "./input.do";
import { OutputVO } from "./output.do";

export class TransactionEntity extends Entity {
  public readonly id: string;
  public readonly inputs: InputVO[];
  public readonly outputs: OutputVO[];

  constructor(id: string, props: { inputs: InputVO[]; outputs: OutputVO[] }) {
    super();
    this.id = id;
    this.inputs = props.inputs;
    this.outputs = props.outputs;
  }

  public async validateTransaction(
    TransactionValidator: ITransactionValidator,
  ): Promise<boolean> {
    const result = await TransactionValidator.validateTransaction(this);
    if (!result.isValid) {
      logger.debug(
        result,
        "[TransactionEntity] validateTransaction: Transaction is invalid",
      );
    }
    return result.isValid;
  }

  public static create(
    id: string,
    props: {
      inputs: InputVO[];
      outputs: OutputVO[];
    },
  ) {
    return new TransactionEntity(id, {
      inputs: props.inputs,
      outputs: props.outputs,
    });
  }

  public static createMany(
    props: { id: string; inputs: InputVO[]; outputs: OutputVO[] }[],
  ) {
    return props.map((prop) =>
      TransactionEntity.create(prop.id, {
        inputs: prop.inputs,
        outputs: prop.outputs,
      }),
    );
  }
}
