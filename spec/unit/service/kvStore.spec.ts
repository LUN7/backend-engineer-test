import { describe, it, expect } from "bun:test";
import { InMemoryKeyValueStore } from "../../../src/service/kvStore/inMemoryKVStore";

describe("InMemoryKeyValueStore", () => {
  it("should set, get, and delete values", async () => {
    const store = new InMemoryKeyValueStore();
    const key = "test_key";
    const value = "test_value";

    expect(await store.get(key)).toBeNull();

    await store.set(key, value);
    expect(await store.get(key)).toBe(value);

    await store.delete(key);
    expect(await store.get(key)).toBeNull();
  });
});

