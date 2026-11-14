import { Module } from "@nestjs/common";
import { IssuanceModule } from "../issuance/issuance.module";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  imports: [IssuanceModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
