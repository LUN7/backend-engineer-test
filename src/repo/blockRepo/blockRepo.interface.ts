import type { BlockDAO } from "../../dao/block.dao";

export interface IBlockRepo<TSession = unknown> {
  save(block: BlockDAO, session: TSession): Promise<void>;
  getCurrentHeight(): Promise<number>;
  deleteAfterHeight(height: number): Promise<void>;
}
