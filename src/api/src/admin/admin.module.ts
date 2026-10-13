import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prima.module'
import { AdminDashboardController } from './admin-dashboard.controller'
import { AdminDashboardService } from './admin-dashboard.service'
import { AdminReviewController } from './admin-review.controller'
import { AdminReviewService } from './admin-review.service'
import { AdminVoucherController } from './admin-voucher.controller'
import { AdminVoucherService } from './admin-voucher.service'

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminDashboardController,
    AdminReviewController,
    AdminVoucherController,
  ],
  providers: [
    AdminDashboardService,
    AdminReviewService,
    AdminVoucherService,
  ],
})
export class AdminModule {}

