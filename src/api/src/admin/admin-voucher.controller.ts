import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import {
  AdminVoucherService,
  CreateVoucherDto,
  UpdateVoucherDto,
} from './admin-voucher.service'

@Controller('admin/vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminVoucherController {
  constructor(private readonly voucherService: AdminVoucherService) {}

  @Get()
  listVouchers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('tourId') tourId?: string,
  ) {
    return this.voucherService.listVouchers({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      isActive:
        isActive !== undefined && isActive !== ''
          ? isActive === 'true'
          : undefined,
      tourId: tourId ? Number(tourId) : undefined,
    })
  }

  @Get(':id')
  getVoucher(@Param('id', ParseIntPipe) id: number) {
    return this.voucherService.getVoucherById(id)
  }

  @Post()
  createVoucher(@Body() dto: CreateVoucherDto) {
    return this.voucherService.createVoucher(dto)
  }

  @Put(':id')
  updateVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVoucherDto,
  ) {
    return this.voucherService.updateVoucher(id, dto)
  }

  @Patch(':id/toggle')
  toggleVoucher(@Param('id', ParseIntPipe) id: number) {
    return this.voucherService.toggleVoucher(id)
  }

  @Delete(':id')
  deleteVoucher(@Param('id', ParseIntPipe) id: number) {
    return this.voucherService.deleteVoucher(id)
  }
}
