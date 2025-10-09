import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from "bun:test";
import * as Postgress from "../../src/infra/database/postgress";
import type { BlockDTO } from "../../src/dto/block.dto";
import crypto from "node:crypto";
import { App } from "../../src/app";

const API_URL = "http://localhost:3000";

describe("E2E API Tests", () => {
  let app: App;

  beforeAll(async () => {
    app = new App();
    await app.init();
    await app.start();
  });

  beforeEach(async () => {
    const pool = await Postgress.PoolSingleton.getPool();
    await Postgress.dropAllTables(pool);
    await Postgress.initTables(pool);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return an error for invalid block height", async () => {
    const block3TxId = "tx3";
    const block3Id = crypto
      .createHash("sha256")
      .update(`3|${block3TxId}`)
      .digest("hex");

    const block3: BlockDTO = {
      id: block3Id,
      height: 3, // !Invalid height, current is 1
      transactions: [
        {
          id: block3TxId,
          inputs: [{ txId: "1", index: 0 }],
          outputs: [
            { address: "addr1", value: 90000 },
            { address: "genesis", value: 10000 },
          ],
        },
      ],
    };

    const createBlock3Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block3),
    });

    expect(createBlock3Res.status).toBe(400);
    const errorRes = await createBlock3Res.json();
    expect(errorRes.code).toBe("INVALID_HEIGHT");
  });

  it("should return an error for invalid transactions (input != output)", async () => {
    const block2TxId = "tx2";
    const block2Id = crypto
      .createHash("sha256")
      .update(`2|${block2TxId}`)
      .digest("hex");

    const block2: BlockDTO = {
      id: block2Id,
      height: 2,
      transactions: [
        {
          id: block2TxId,
          inputs: [{ txId: "1", index: 0 }], // 100000 from genesis
          outputs: [{ address: "addr1", value: 90000 }], // 90000 to addr1
          // !missing 10000 to genesis
        },
      ],
    };

    const createBlock2Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block2),
    });

    expect(createBlock2Res.status).toBe(400);
    const errorRes = await createBlock2Res.json();
    expect(errorRes.code).toBe("INVALID_TRANSACTIONS");
  });

  it("should return an error for double spending", async () => {
    // Create Block 2: Send funds from genesis to addr1
    const block2TxId = "tx2";
    const block2Id = crypto
      .createHash("sha256")
      .update(`2|${block2TxId}`)
      .digest("hex");

    const block2: BlockDTO = {
      id: block2Id,
      height: 2,
      transactions: [
        {
          id: block2TxId,
          inputs: [{ txId: "1", index: 0 }],
          outputs: [
            { address: "addr1", value: 90000 },
            { address: "genesis", value: 10000 },
          ],
        },
      ],
    };

    await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block2),
    });

    // Create Block 3: Try to spend the same output from genesis again
    const block3TxId = "tx3";
    const block3Id = crypto
      .createHash("sha256")
      .update(`3|${block3TxId}`)
      .digest("hex");

    const block3: BlockDTO = {
      id: block3Id,
      height: 3,
      transactions: [
        {
          id: block3TxId,
          inputs: [{ txId: "1", index: 0 }], // Same input as Block 2, which is spent already
          outputs: [{ address: "addr2", value: 100000 }],
        },
      ],
    };

    const createBlock3Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block3),
    });

    expect(createBlock3Res.status).toBe(400);
    const errorRes = await createBlock3Res.json();
    expect(errorRes.code).toBe("INVALID_TRANSACTIONS");
  });

  it("should return an error for invalid block signature", async () => {
    const block2TxId = "tx2";

    const block2: BlockDTO = {
      id: "invalid-signature", // !Invalid signature
      height: 2,
      transactions: [
        {
          id: block2TxId,
          inputs: [{ txId: "1", index: 0 }],
          outputs: [
            { address: "addr1", value: 90000 },
            { address: "genesis", value: 10000 },
          ],
        },
      ],
    };

    const createBlock2Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block2),
    });

    expect(createBlock2Res.status).toBe(400);
    const errorRes = await createBlock2Res.json();
    expect(errorRes.code).toBe("INVALID_BLOCK_SIGNATURE");
  });

  it("should return an error for transaction with no inputs", async () => {
    const block2TxId = "tx2";
    const block2Id = crypto
      .createHash("sha256")
      .update(`2|${block2TxId}`)
      .digest("hex");

    const block2: BlockDTO = {
      id: block2Id,
      height: 2,
      transactions: [
        {
          id: block2TxId,
          inputs: [], // !No inputs
          outputs: [{ address: "addr1", value: 90000 }],
        },
      ],
    };

    const createBlock2Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block2),
    });

    expect(createBlock2Res.status).toBe(400);
    const errorRes = await createBlock2Res.json();
    expect(errorRes.code).toBe("MIN_ONE_INPUT_TRANSACTION");
  });

  it("should return an error for input referencing non-existent output", async () => {
    const block2TxId = "tx2";
    const block2Id = crypto
      .createHash("sha256")
      .update(`2|${block2TxId}`)
      .digest("hex");

    const block2: BlockDTO = {
      id: block2Id,
      height: 2,
      transactions: [
        {
          id: block2TxId,
          inputs: [{ txId: "non-existent-tx", index: 0 }], // !Non-existent output ref
          outputs: [{ address: "addr1", value: 90000 }],
        },
      ],
    };

    const createBlock2Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block2),
    });

    expect(createBlock2Res.status).toBe(400);
    const errorRes = await createBlock2Res.json();
    expect(errorRes.code).toBe("INVALID_TRANSACTIONS");
  });
});
