export interface RollbackDTO {
  height: number;
}

export const rollbackSchema = {
  type: "object",
  properties: {
    height: { type: "number" },
  },
  required: ["height"],
};
