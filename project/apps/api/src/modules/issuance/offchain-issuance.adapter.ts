import { Inject, Injectable } from "@nestjs/common";
import { CLOCK_PORT, Clock } from "../../common/clock";
import { ID_GENERATOR_PORT, IdGenerator } from "../../common/id-generator";
import {
  IssuancePort,
  IssuanceReceipt,
  PublishBatchInput,
  RevokeCredentialInput,
} from "./issuance.port";

@Injectable()
export class OffChainIssuanceAdapter implements IssuancePort {
  constructor(
    @Inject(CLOCK_PORT) private readonly clock: Clock,
    @Inject(ID_GENERATOR_PORT) private readonly idGenerator: IdGenerator,
  ) {}

  async publishBatch(_input: PublishBatchInput): Promise<IssuanceReceipt> {
    return {
      status: "CONFIRMED",
      reference: `offchain_pub_${this.idGenerator.next("bat")}`,
      confirmedAt: this.clock.now(),
      mode: "OFF_CHAIN",
    };
  }

  async revokeCredential(_input: RevokeCredentialInput): Promise<IssuanceReceipt> {
    return {
      status: "CONFIRMED",
      reference: `offchain_rev_${this.idGenerator.next("cred")}`,
      confirmedAt: this.clock.now(),
      mode: "OFF_CHAIN",
    };
  }
}
