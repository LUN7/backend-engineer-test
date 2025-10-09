import { ValueObject } from "../shared/domain/domain";

export class InputVO extends ValueObject {
  public readonly txId: string;
  public readonly index: number;

  private constructor(props: { txId: string; index: number }) {
    super();
    this.txId = props.txId;
    this.index = props.index;
  }

  // Factory method
  public static create(props: { txId: string; index: number }) {
    return new InputVO({
      txId: props.txId,
      index: props.index,
    });
  }

  public static createMany(props: { txId: string; index: number }[]) {
    return props.map((prop) => InputVO.create(prop));
  }
}
