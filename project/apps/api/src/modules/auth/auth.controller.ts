import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Public } from "../../common/auth/public.decorator";
import { CorrelationId } from "../../common/correlation-id.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: "Đăng nhập bằng email và mật khẩu để nhận JWT access token" })
  login(@Body() dto: LoginDto, @CorrelationId() correlationId: string) {
    return this.authService.login(dto, correlationId);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy thông tin tài khoản đang đăng nhập" })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }
}
