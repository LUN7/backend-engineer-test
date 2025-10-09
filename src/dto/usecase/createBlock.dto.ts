import type { TransactionDTO } from "../transaction.dto";

export interface CreateBlockDTO {
  id: string;
  height: number;
  transactions: Array<TransactionDTO>;
}

export const createBlockSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    height: { type: "number" },
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          inputs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                txId: { type: "string" },
                index: { type: "integer" },
              },
              required: ["txId", "index"],
            },
          },
          outputs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                address: { type: "string" },
                value: { type: "number" },
              },
              required: ["address", "value"],
            },
          },
        },
      },
    },
  },
  required: ["id", "height", "transactions"],
};
