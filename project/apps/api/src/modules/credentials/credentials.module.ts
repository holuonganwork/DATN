import { Module } from "@nestjs/common";
import { IssuanceModule } from "../issuance/issuance.module";
import { CredentialsController } from "./credentials.controller";
import { CredentialsService } from "./credentials.service";

@Module({
  imports: [IssuanceModule],
  controllers: [CredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
