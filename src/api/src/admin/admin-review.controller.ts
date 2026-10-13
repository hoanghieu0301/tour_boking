import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminReviewService } from './admin-review.service'

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminReviewController {
  constructor(private readonly reviewService: AdminReviewService) {}

  @Get()
  listReviews(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('tourId') tourId?: string,
    @Query('rating') rating?: string,
    @Query('search') search?: string,
  ) {
    return this.reviewService.listReviews({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      tourId: tourId ? Number(tourId) : undefined,
      rating: rating ? Number(rating) : undefined,
      search,
    })
  }

  @Delete(':id')
  deleteReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.deleteReview(id)
  }
}
