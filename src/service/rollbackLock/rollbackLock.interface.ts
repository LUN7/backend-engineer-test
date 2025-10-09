export interface IRollbackLock {
  lock(): Promise<void>;
  unlock(): Promise<void>;
  isLocked(): Promise<boolean>;
}
