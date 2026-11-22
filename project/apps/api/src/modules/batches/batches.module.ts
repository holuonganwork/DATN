import { Module } from "@nestjs/common";
import { IssuanceModule } from "../issuance/issuance.module";
import { BatchesController } from "./batches.controller";
import { BatchesService } from "./batches.service";

@Module({
  imports: [IssuanceModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
