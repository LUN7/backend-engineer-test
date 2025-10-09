export interface ITransactionManager<TSession = unknown> {
  withTransaction(
    callback: (session: TSession) => Promise<void>,
  ): Promise<void>;
}
