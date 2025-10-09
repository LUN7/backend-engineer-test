import crypto from "node:crypto";
import { AggregateRoot } from "../shared/domain/domain";
import type { TransactionEntity } from "./transaction.do";
import type { IBlockRepo } from "../repo/blockRepo/blockRepo.interface";

export class BlockAggregateRoot extends AggregateRoot {
  public readonly id: string;
  public readonly height: number;
  public transactions: Array<TransactionEntity>;

  private constructor(
    id: string,
    props: { height: number; transactions?: TransactionEntity[] },
  ) {
    super();
    this.id = id;
    this.height = props.height;
    this.transactions = props.transactions ?? [];
  }

  private computeHash() {
    const data = [
      this.height.toString(),
      ...this.transactions.map((transaction) => transaction.id),
    ].join("|");

    return crypto.createHash("sha256").update(data, "utf8").digest("hex");
  }

  public async checkHeight(blockRepo: IBlockRepo): Promise<{
    isValid: boolean;
    currentHeight: number;
  }> {
    const currentHeight = await blockRepo.getCurrentHeight();
    return {
      isValid: this.height === currentHeight + 1,
      currentHeight,
    };
  }

  public validateBlockSignature(): {
    isValid: boolean;
    computedHash: string;
  } {
    const computedHash = this.computeHash();
    return {
      isValid: computedHash === this.id,
      computedHash,
    };
  }

  public static create(
    id: string,
    props: { height: number; transactions?: TransactionEntity[] },
  ) {
    return new BlockAggregateRoot(id, {
      height: props.height,
      transactions: props.transactions,
    });
  }
}
