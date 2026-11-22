import { Module } from "@nestjs/common";
import { CLOCK_PORT, SystemClock } from "../../common/clock";
import { ID_GENERATOR_PORT, UlidGenerator } from "../../common/id-generator";
import { ISSUANCE_PORT } from "./issuance.port";
import { OffChainIssuanceAdapter } from "./offchain-issuance.adapter";

@Module({
  providers: [
    { provide: CLOCK_PORT, useClass: SystemClock },
    { provide: ID_GENERATOR_PORT, useClass: UlidGenerator },
    OffChainIssuanceAdapter,
    { provide: ISSUANCE_PORT, useExisting: OffChainIssuanceAdapter },
  ],
  exports: [ISSUANCE_PORT, CLOCK_PORT, ID_GENERATOR_PORT],
})
export class IssuanceModule {}
