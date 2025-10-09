import type { BlockDAO } from "../dao/block.dao";
import type { BlockAggregateRoot } from "../domain/block.do";

export class BlockMapper {
  public static toDAO(block: BlockAggregateRoot): BlockDAO {
    return {
      id: block.id,
      height: block.height,
    };
  }
}
