export interface RetrieveAddressBalanceDTO {
  address: string;
}

export const retrieveAddressBalanceSchema = {
  type: "object",
  properties: {
    address: { type: "string" },
  },
  required: ["address"],
};
