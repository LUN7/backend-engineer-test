import { describe, it, expect } from "bun:test";
import { InputVO } from "../../../src/domain/input.do";
import { OutputVO } from "../../../src/domain/output.do";

describe("InputVO", () => {
  it("should create an input", () => {
    const input = InputVO.create({ txId: "tx0", index: 0 });
    expect(input.txId).toBe("tx0");
    expect(input.index).toBe(0);
  });

  it("should create many inputs", () => {
    const inputs = InputVO.createMany([
      { txId: "tx0", index: 0 },
      { txId: "tx1", index: 1 },
    ]);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].txId).toBe("tx0");
    expect(inputs[1].txId).toBe("tx1");
  });
});

describe("OutputVO", () => {
  it("should create an output", () => {
    const output = OutputVO.create({ address: "addr1", value: 100 });
    expect(output.address).toBe("addr1");
    expect(output.value).toBe(100);
  });

  it("should create many outputs", () => {
    const outputs = OutputVO.createMany([
      { address: "addr1", value: 100 },
      { address: "addr2", value: 200 },
    ]);
    expect(outputs).toHaveLength(2);
    expect(outputs[0].address).toBe("addr1");
    expect(outputs[1].address).toBe("addr2");
  });
});
