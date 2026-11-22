import { ulid } from "ulid";

export type EntityIdPrefix =
  "org" | "usr" | "crs" | "lrn" | "bat" | "ent" | "cred" | "aud" | "idem" | "corr";

export interface IdGenerator {
  next(prefix: EntityIdPrefix): string;
}

export const ID_GENERATOR_PORT = Symbol("ID_GENERATOR_PORT");

export class UlidGenerator implements IdGenerator {
  next(prefix: EntityIdPrefix): string {
    return `${prefix}_${ulid().toLowerCase()}`;
  }
}
