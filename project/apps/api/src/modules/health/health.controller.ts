import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/auth/public.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Kiểm tra tình trạng kết nối cơ sở dữ liệu và API" })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "up", mode: "OFF_CHAIN" };
  }
}
