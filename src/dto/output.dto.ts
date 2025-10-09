export interface OutputDTO {
  address: string;
  value: number;
}

export interface OutputDetailsDTO extends OutputDTO {
  txId: string;
  index: number;
}
