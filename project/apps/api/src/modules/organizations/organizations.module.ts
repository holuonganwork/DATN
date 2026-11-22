import { Module } from "@nestjs/common";
import { IssuersController, PublicIssuersController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";

@Module({
  controllers: [IssuersController, PublicIssuersController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
