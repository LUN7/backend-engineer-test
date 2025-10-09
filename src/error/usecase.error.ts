export const COMMON_ERROR_CODES = {
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
};

export class UsecaseError extends Error {
  readonly errorCode: string;

  constructor(errorCode: string, message: string) {
    super(message);
    this.name = "UsecaseError";
    this.errorCode = errorCode;
  }
}

export class UnexpectedUsecaseError extends UsecaseError {
  constructor(message: string) {
    super("UNEXPECTED_ERROR", message);
    this.name = "UnexpectedError";
  }
}
