export interface Clock {
  now(): Date;
}

export const CLOCK_PORT = Symbol("CLOCK_PORT");

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
