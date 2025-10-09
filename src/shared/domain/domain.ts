export abstract class Domain {
  public abstract readonly DOMAIN_TYPE: string;
}

export class Entity extends Domain {
  public readonly DOMAIN_TYPE = "ENTITY";
}

export class ValueObject extends Domain {
  public readonly DOMAIN_TYPE = "VALUE_OBJECT";
}

export class AggregateRoot extends Domain {
  public readonly DOMAIN_TYPE = "AGGREGATE_ROOT";
}
