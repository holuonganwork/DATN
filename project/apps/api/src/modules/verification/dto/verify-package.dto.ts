import { ApiProperty } from "@nestjs/swagger";
import { IsObject } from "class-validator";

export class VerifyPackageDto {
  @ApiProperty({
    description: "Gói chứng chỉ JSON gồm payload, anchor và proof",
  })
  @IsObject()
  package!: Record<string, unknown>;
}
