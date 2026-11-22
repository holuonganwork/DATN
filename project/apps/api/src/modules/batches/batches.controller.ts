import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CorrelationId } from "../../common/correlation-id.decorator";
import { BatchesService } from "./batches.service";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ListBatchesQueryDto } from "./dto/list-batches-query.dto";
import { UpdateBatchEntryDto } from "./dto/update-batch-entry.dto";
import { UpsertBatchEntryDto } from "./dto/upsert-batch-entry.dto";

@ApiTags("Batches")
@ApiBearerAuth()
@Controller("batches")
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Tạo lô chứng chỉ mới (trạng thái DRAFT)" })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBatchDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.create(user, dto, correlationId);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách lô chứng chỉ trong phạm vi tổ chức" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListBatchesQueryDto) {
    return this.batchesService.findAll(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết lô chứng chỉ kèm danh sách dòng" })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.batchesService.findOne(user, id);
  }

  @Post(":id/entries")
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Thêm dòng học viên vào lô (khi DRAFT/VALIDATED)" })
  addEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpsertBatchEntryDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.addEntry(user, id, dto, correlationId);
  }

  @Patch(":id/entries/:entryId")
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Cập nhật dòng học viên trong lô (khi DRAFT/VALIDATED)" })
  updateEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("entryId") entryId: string,
    @Body() dto: UpdateBatchEntryDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.updateEntry(user, id, entryId, dto, correlationId);
  }

  @Delete(":id/entries/:entryId")
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Xóa dòng học viên khỏi lô (khi DRAFT/VALIDATED)" })
  removeEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("entryId") entryId: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.removeEntry(user, id, entryId, correlationId);
  }

  @Post(":id/validate")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Kiểm tra hợp lệ và tính digest/leaf cho toàn bộ dòng trong lô" })
  validate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.validate(user, id, correlationId);
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Phê duyệt lô (VALIDATED -> APPROVED)" })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.approve(user, id, correlationId);
  }

  @Post(":id/freeze")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Đóng băng snapshot, tính Merkle root/proof và tạo chứng chỉ PREPARED" })
  freeze(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.freeze(user, id, correlationId);
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiOperation({ summary: "Phát hành lô qua IssuancePort (FROZEN/FAILED -> CONFIRMED)" })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @CorrelationId() correlationId: string,
  ) {
    return this.batchesService.publish(user, id, idempotencyKey, correlationId);
  }
}
