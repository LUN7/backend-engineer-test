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

  it("should follow the happy path of creating blocks and updating balances", async () => {
    // Get initial balance of genesis address
    const genesisRes = await fetch(`${API_URL}/balance/genesis`);
    const genesisBalance = (await genesisRes.json()) as AddressBalanceDTO;
    expect(genesisBalance.balance).toBe(100000);

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
          inputs: [{ txId: "1", index: 0 }], // From genesis block
          outputs: [
            { address: "addr1", value: 90000 },
            { address: "genesis", value: 10000 }, // REmaining to genesis
          ],
        },
      ],
    };

    const createBlock2Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block2),
    });
    expect(createBlock2Res.status).toBe(200);

    // Check balances after Block 2
    const addr1Res = await fetch(`${API_URL}/balance/addr1`);
    const addr1Balance = (await addr1Res.json()) as AddressBalanceDTO;
    expect(addr1Balance.balance).toBe(90000);

    const genesisAfterBlock2Res = await fetch(`${API_URL}/balance/genesis`);
    const genesisBalanceAfterBlock2 =
      (await genesisAfterBlock2Res.json()) as AddressBalanceDTO;
    expect(genesisBalanceAfterBlock2.balance).toBe(10000);

    // Create Block 3: Send funds from addr1 to addr2 and addr3
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
          inputs: [{ txId: block2TxId, index: 0 }], // From addr1
          outputs: [
            { address: "addr2", value: 50000 },
            { address: "addr3", value: 40000 },
          ],
        },
      ],
    };

    const createBlock3Res = await fetch(`${API_URL}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block3),
    });
    expect(createBlock3Res.status).toBe(200);

    // Check final balances
    const addr1AfterBlock3Res = await fetch(`${API_URL}/balance/addr1`);
    const addr1BalanceAfterBlock3 =
      (await addr1AfterBlock3Res.json()) as AddressBalanceDTO;
    expect(addr1BalanceAfterBlock3.balance).toBe(0);

    const addr2Res = await fetch(`${API_URL}/balance/addr2`);
    const addr2Balance = (await addr2Res.json()) as AddressBalanceDTO;
    expect(addr2Balance.balance).toBe(50000);

    const addr3Res = await fetch(`${API_URL}/balance/addr3`);
    const addr3Balance = (await addr3Res.json()) as AddressBalanceDTO;
    expect(addr3Balance.balance).toBe(40000);
  });
});
