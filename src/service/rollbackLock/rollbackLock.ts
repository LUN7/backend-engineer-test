import type { IKeyValueStore } from "../kvStore/kvStore.interface";
import type { IRollbackLock } from "./rollbackLock.interface";

export class RollbackLock implements IRollbackLock {
  constructor(private readonly kvStore: IKeyValueStore) {}

  private readonly lockKey = "rollback_lock";

  public async lock(): Promise<void> {
    await this.kvStore.set(this.lockKey, "true");
  }

  public async unlock(): Promise<void> {
    await this.kvStore.delete(this.lockKey);
  }

  public async isLocked(): Promise<boolean> {
    const value = await this.kvStore.get(this.lockKey);
    return value === "true";
  }
}
