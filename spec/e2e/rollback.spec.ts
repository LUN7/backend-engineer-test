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
import type { AddressBalanceDTO } from "../../src/dto/addressBalance.dto";
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

  it("should rollback the latest block and restore balances", async () => {
    // Create Block 2
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

    // Check balances after Block 2
    const addr1Res = await fetch(`${API_URL}/balance/addr1`);
    const addr1Balance = (await addr1Res.json()) as AddressBalanceDTO;
    expect(addr1Balance.balance).toBe(90000);

    // Rollback to height 1
    const rollbackRes = await fetch(`${API_URL}/rollback?height=1`, {
      method: "POST",
    });
    expect(rollbackRes.status).toBe(200);

    // Check balances after rollback
    const addr1AfterRollbackRes = await fetch(`${API_URL}/balance/addr1`);
    const addr1BalanceAfterRollback =
      (await addr1AfterRollbackRes.json()) as AddressBalanceDTO;
    expect(addr1BalanceAfterRollback.balance).toBe(0);

    const genesisAfterRollbackRes = await fetch(`${API_URL}/balance/genesis`);
    const genesisBalanceAfterRollback =
      (await genesisAfterRollbackRes.json()) as AddressBalanceDTO;
    expect(genesisBalanceAfterRollback.balance).toBe(100000);
  });

  it("should return an error for rollback to future height", async () => {
    const rollbackRes = await fetch(`${API_URL}/rollback?height=100`, {
      method: "POST",
    });
    expect(rollbackRes.status).toBe(400);
    const errorRes = await rollbackRes.json();
    expect(errorRes.code).toBe("INVALID_HEIGHT");
  });
});
