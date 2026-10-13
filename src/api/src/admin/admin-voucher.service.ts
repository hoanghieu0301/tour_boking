import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'
import { Prisma } from '@prisma/client'

export class CreateVoucherDto {
  code!: string
  fixedOff?: number | null
  percentOff?: number | null
  maxDiscountAmount?: number | null
  isActive?: boolean
  validFromUtc?: string | null
  validToUtc?: string | null
  tourId?: number | null
}

export class UpdateVoucherDto {
  code?: string
  fixedOff?: number | null
  percentOff?: number | null
  maxDiscountAmount?: number | null
  isActive?: boolean
  validFromUtc?: string | null
  validToUtc?: string | null
  tourId?: number | null
}

@Injectable()
export class AdminVoucherService {
  constructor(private readonly prisma: PrismaService) {}

  async listVouchers(query: {
    page?: number
    pageSize?: number
    search?: string
    isActive?: boolean
    tourId?: number
  }) {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))
    const skip = (page - 1) * pageSize

    const where: Prisma.PromoCodeWhereInput = {}

    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    if (query.tourId) {
      where.tourId = Number(query.tourId)
    }

    if (query.search?.trim()) {
      const term = query.search.trim()
      where.OR = [
        { code: { contains: term } },
        { tour: { name: { contains: term } } },
      ]
    }

    const [total, items] = await Promise.all([
      this.prisma.promoCode.count({ where }),
      this.prisma.promoCode.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
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
      items: items.map((item) => ({
        id: item.id,
        code: item.code,
        fixedOff: item.fixedOff ? Number(item.fixedOff) : null,
        percentOff: item.percentOff ? Number(item.percentOff) : null,
        maxDiscountAmount: item.maxDiscountAmount
          ? Number(item.maxDiscountAmount)
          : null,
        isActive: item.isActive,
        validFromUtc: item.validFromUtc ? item.validFromUtc.toISOString() : null,
        validToUtc: item.validToUtc ? item.validToUtc.toISOString() : null,
        tourId: item.tourId,
        tour: item.tour
          ? {
              id: item.tour.id,
              name: item.tour.name,
              slug: item.tour.slug,
            }
          : null,
      })),
    }
  }

  async getVoucherById(id: number) {
    const item = await this.prisma.promoCode.findUnique({
      where: { id },
      include: {
        tour: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
    if (!item) {
      throw new NotFoundException('Mã giảm giá không tồn tại')
    }
    return {
      id: item.id,
      code: item.code,
      fixedOff: item.fixedOff ? Number(item.fixedOff) : null,
      percentOff: item.percentOff ? Number(item.percentOff) : null,
      maxDiscountAmount: item.maxDiscountAmount
        ? Number(item.maxDiscountAmount)
        : null,
      isActive: item.isActive,
      validFromUtc: item.validFromUtc ? item.validFromUtc.toISOString() : null,
      validToUtc: item.validToUtc ? item.validToUtc.toISOString() : null,
      tourId: item.tourId,
      tour: item.tour
        ? {
            id: item.tour.id,
            name: item.tour.name,
            slug: item.tour.slug,
          }
        : null,
    }
  }

  async createVoucher(dto: CreateVoucherDto) {
    const code = dto.code.trim().toUpperCase()
    if (!code) {
      throw new BadRequestException('Mã voucher không được để trống')
    }

    const existing = await this.prisma.promoCode.findUnique({
      where: { code },
    })
    if (existing) {
      throw new ConflictException(`Mã giảm giá "${code}" đã tồn tại`)
    }

    const fixedOff =
      dto.fixedOff != null && Number(dto.fixedOff) > 0
        ? new Prisma.Decimal(Number(dto.fixedOff))
        : null
    const percentOff =
      dto.percentOff != null && Number(dto.percentOff) > 0
        ? new Prisma.Decimal(Number(dto.percentOff))
        : null
    const maxDiscountAmount =
      dto.maxDiscountAmount != null && Number(dto.maxDiscountAmount) > 0
        ? new Prisma.Decimal(Number(dto.maxDiscountAmount))
        : null

    if (!fixedOff && !percentOff) {
      throw new BadRequestException(
        'Phải chỉ định số tiền giảm cố định (VNĐ) hoặc phần trăm giảm (%)',
      )
    }

    const created = await this.prisma.promoCode.create({
      data: {
        code,
        fixedOff,
        percentOff,
        maxDiscountAmount,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
        validFromUtc: dto.validFromUtc ? new Date(dto.validFromUtc) : null,
        validToUtc: dto.validToUtc ? new Date(dto.validToUtc) : null,
        tourId: dto.tourId ? Number(dto.tourId) : null,
      },
      include: {
        tour: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return {
      message: 'Tạo mã giảm giá thành công',
      voucher: {
        id: created.id,
        code: created.code,
        fixedOff: created.fixedOff ? Number(created.fixedOff) : null,
        percentOff: created.percentOff ? Number(created.percentOff) : null,
        maxDiscountAmount: created.maxDiscountAmount
          ? Number(created.maxDiscountAmount)
          : null,
        isActive: created.isActive,
        validFromUtc: created.validFromUtc
          ? created.validFromUtc.toISOString()
          : null,
        validToUtc: created.validToUtc ? created.validToUtc.toISOString() : null,
        tourId: created.tourId,
        tour: created.tour,
      },
    }
  }

  async updateVoucher(id: number, dto: UpdateVoucherDto) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
    })
    if (!existing) {
      throw new NotFoundException('Mã giảm giá không tồn tại')
    }

    let code = existing.code
    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      code = dto.code.trim().toUpperCase()
      const duplicate = await this.prisma.promoCode.findUnique({
        where: { code },
      })
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Mã giảm giá "${code}" đã tồn tại`)
      }
    }

    const data: Prisma.PromoCodeUpdateInput = {
      code,
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : existing.isActive,
      validFromUtc:
        dto.validFromUtc !== undefined
          ? dto.validFromUtc
            ? new Date(dto.validFromUtc)
            : null
          : existing.validFromUtc,
      validToUtc:
        dto.validToUtc !== undefined
          ? dto.validToUtc
            ? new Date(dto.validToUtc)
            : null
          : existing.validToUtc,
    }

    if (dto.fixedOff !== undefined) {
      data.fixedOff =
        dto.fixedOff != null && Number(dto.fixedOff) > 0
          ? new Prisma.Decimal(Number(dto.fixedOff))
          : null
    }

    if (dto.percentOff !== undefined) {
      data.percentOff =
        dto.percentOff != null && Number(dto.percentOff) > 0
          ? new Prisma.Decimal(Number(dto.percentOff))
          : null
    }

    if (dto.maxDiscountAmount !== undefined) {
      data.maxDiscountAmount =
        dto.maxDiscountAmount != null && Number(dto.maxDiscountAmount) > 0
          ? new Prisma.Decimal(Number(dto.maxDiscountAmount))
          : null
    }

    if (dto.tourId !== undefined) {
      if (dto.tourId) {
        data.tour = { connect: { id: Number(dto.tourId) } }
      } else {
        data.tour = { disconnect: true }
      }
    }

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data,
      include: {
        tour: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return {
      message: 'Cập nhật mã giảm giá thành công',
      voucher: {
        id: updated.id,
        code: updated.code,
        fixedOff: updated.fixedOff ? Number(updated.fixedOff) : null,
        percentOff: updated.percentOff ? Number(updated.percentOff) : null,
        maxDiscountAmount: updated.maxDiscountAmount
          ? Number(updated.maxDiscountAmount)
          : null,
        isActive: updated.isActive,
        validFromUtc: updated.validFromUtc
          ? updated.validFromUtc.toISOString()
          : null,
        validToUtc: updated.validToUtc ? updated.validToUtc.toISOString() : null,
        tourId: updated.tourId,
        tour: updated.tour,
      },
    }
  }

  async toggleVoucher(id: number) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
      select: { id: true, isActive: true, code: true },
    })
    if (!existing) {
      throw new NotFoundException('Mã giảm giá không tồn tại')
    }

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    return {
      message: updated.isActive
        ? `Đã kích hoạt mã ${existing.code}`
        : `Đã tạm dừng mã ${existing.code}`,
      isActive: updated.isActive,
    }
  }

  async deleteVoucher(id: number) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
      select: { id: true, code: true },
    })
    if (!existing) {
      throw new NotFoundException('Mã giảm giá không tồn tại')
    }

    await this.prisma.promoCode.delete({
      where: { id },
    })

    return {
      message: `Đã xóa mã giảm giá "${existing.code}" thành công`,
    }
  }
}
