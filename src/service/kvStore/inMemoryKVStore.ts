import type { IKeyValueStore } from "./kvStore.interface";

export class InMemoryKeyValueStore implements IKeyValueStore {
  private readonly store: Map<string, string> = new Map();

  public async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
