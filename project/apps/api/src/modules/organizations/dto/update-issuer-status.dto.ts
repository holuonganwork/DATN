import { ApiProperty } from "@nestjs/swagger";
import { OrganizationStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateIssuerStatusDto {
  @ApiProperty({ enum: OrganizationStatus })
  @IsEnum(OrganizationStatus)
  status!: OrganizationStatus;
}
