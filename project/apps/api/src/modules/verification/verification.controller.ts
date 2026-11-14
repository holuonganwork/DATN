import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/auth/public.decorator";
import { VerifyPackageDto } from "./dto/verify-package.dto";
import { VerificationService } from "./verification.service";

@ApiTags("Verification (Public)")
@Controller()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get("public/credentials/:code")
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: "Tra cứu và xác thực công khai chứng chỉ theo mã CERT-XXXX-XXXX" })
  verifyByCode(@Param("code") code: string) {
    return this.verificationService.verifyByCode(code);
  }

  @Post("verifications")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: "Xác thực gói JSON chứng chỉ (payload + anchor + Merkle proof)" })
  verifyPackage(@Body() dto: VerifyPackageDto) {
    return this.verificationService.verifyPackage(dto.package);
  }
}
