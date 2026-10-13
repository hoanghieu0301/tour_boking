import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class AdminReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews(query: {
    page?: number
    pageSize?: number
    tourId?: number
    rating?: number
    search?: string
  }) {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))
    const skip = (page - 1) * pageSize

    const where: Prisma.ReviewWhereInput = {}

    if (query.tourId) {
      where.tourId = Number(query.tourId)
    }

    if (query.rating) {
      where.rating = Number(query.rating)
    }

    if (query.search?.trim()) {
      const term = query.search.trim()
      where.OR = [
        { comment: { contains: term } },
        { user: { firstName: { contains: term } } },
        { user: { lastName: { contains: term } } },
        { user: { email: { contains: term } } },
        { tour: { name: { contains: term } } },
      ]
    }

    const [total, items] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAtUtc: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          tour: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ])

    return {
      total,
      page,
      pageSize,
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment ?? null,
        createdAtUtc: r.createdAtUtc ? r.createdAtUtc.toISOString() : null,
        user: {
          id: r.user.id,
          fullName: `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || r.user.email,
          email: r.user.email,
          avatar: r.user.avatar ?? null,
        },
        tour: {
          id: r.tour.id,
          name: r.tour.name,
          slug: r.tour.slug,
        },
      })),
    }
  }

  async deleteReview(reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, tourId: true },
    })

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      })

      const agg = await tx.review.aggregate({
        where: { tourId: review.tourId },
        _avg: { rating: true },
        _count: { _all: true },
      })

      const ratingAvg = agg._avg.rating ?? null
      const totalReviews = agg._count._all ? agg._count._all : null

      await tx.tour.update({
        where: { id: review.tourId },
        data: { ratingAvg, totalReviews },
      })
    })

    return { message: 'Đã xóa đánh giá thành công' }
  }
}
