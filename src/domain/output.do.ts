import { ValueObject } from "../shared/domain/domain";

export class OutputVO extends ValueObject {
  public readonly address: string;
  public readonly value: number;

  private constructor(props: { address: string; value: number }) {
    super();
    this.address = props.address;
    this.value = props.value;
  }

  public static create(props: { address: string; value: number }) {
    return new OutputVO({
      address: props.address,
      value: props.value,
    });
  }

  public static createMany(props: { address: string; value: number }[]) {
    return props.map((prop) => OutputVO.create(prop));
  }
}
