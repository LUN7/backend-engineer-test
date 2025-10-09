import { describe, it, expect, mock } from "bun:test";
import { RollbackLock } from "../../../src/service/rollbackLock/rollbackLock";
import type { IKeyValueStore } from "../../../src/service/kvStore/kvStore.interface";

describe("RollbackLock", () => {
  it("should be able to lock and unlock", async () => {
    const mockKvStore = ((): IKeyValueStore => {
      const store = new Map<string, string>();
      return {
        async get(key: string): Promise<string | null> {
          return store.get(key) ?? null;
        },
        async set(key: string, value: string): Promise<void> {
          store.set(key, value);
        },
        async delete(key: string): Promise<void> {
          store.delete(key);
        },
      };
    })();
    const rollbackLock = new RollbackLock(mockKvStore);

    expect(await rollbackLock.isLocked()).toBe(false);

    await rollbackLock.lock();
    expect(await rollbackLock.isLocked()).toBe(true);

    await rollbackLock.unlock();
    expect(await rollbackLock.isLocked()).toBe(false);
  });

  it("should use the key-value store correctly", async () => {
    const mockKvStore: IKeyValueStore = {
      get: mock(async () => ""),
      set: mock(async () => {}),
      delete: mock(async () => {}),
    };

    const rollbackLock = new RollbackLock(mockKvStore);

    await rollbackLock.lock();
    expect(mockKvStore.set).toHaveBeenCalledWith("rollback_lock", "true");

    await rollbackLock.unlock();
    expect(mockKvStore.delete).toHaveBeenCalledWith("rollback_lock");

    await rollbackLock.isLocked();
    expect(mockKvStore.get).toHaveBeenCalledWith("rollback_lock");
  });
});
