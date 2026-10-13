/**
 * Seed một tour mẫu (Miền Tây 4N3Đ – mã NDSGN846).
 * Chạy từ thư mục gốc repo: npm run db:seed
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import * as bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { getMariaDbPoolConfig } from '../src/prisma/normalize-database-url'

config({ path: resolve(process.cwd(), 'src/api/.env') })

const raw = process.env.DATABASE_URL
if (!raw) {
  throw new Error(
    'Missing DATABASE_URL. Tạo src/api/.env với DATABASE_URL hoặc export biến môi trường.',
  )
}

const dbConfig = getMariaDbPoolConfig(raw)

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(dbConfig),
})

const SAMPLE_SLUG_PREFIX = 'demo-'

function addDaysUtc(d: Date, days: number): Date {
  const x = new Date(d.getTime())
  x.setUTCDate(x.getUTCDate() + days)
  return x
}

async function removeSeedTours() {
  const existingTours = await prisma.tour.findMany({
    where: {
      OR: [
        { slug: { startsWith: SAMPLE_SLUG_PREFIX } },
        { slug: 'ndsgn846-mien-tay-4n3d' },
      ],
    },
    select: { id: true },
  })

  for (const tour of existingTours) {
    const itineraries = await prisma.tourItinerary.findMany({
      where: { tourId: tour.id },
      select: { id: true },
    })
    const itineraryIds = itineraries.map((itinerary) => itinerary.id)

    if (itineraryIds.length > 0) {
      await prisma.tourAccommodation.deleteMany({
        where: { itineraryId: { in: itineraryIds } },
      })
      await prisma.tourMeal.deleteMany({
        where: { itineraryId: { in: itineraryIds } },
      })
    }

    await prisma.tourSchedule.deleteMany({ where: { tourId: tour.id } })
    await prisma.tourTagMapping.deleteMany({ where: { tourId: tour.id } })
    await prisma.tourImage.deleteMany({ where: { tourId: tour.id } })
    await prisma.tourVideo.deleteMany({ where: { tourId: tour.id } })
    await prisma.tourTransport.deleteMany({ where: { tourId: tour.id } })
    await prisma.tourItinerary.deleteMany({ where: { tourId: tour.id } })
    await prisma.promoCode.deleteMany({ where: { tourId: tour.id } })
    await prisma.tour.delete({ where: { id: tour.id } })
  }

  if (existingTours.length > 0) {
    console.log(`Đã xóa ${existingTours.length} tour seed cũ để tạo lại.`)
  }
}

async function ensureDepartureAndDestination() {
  let region = await prisma.region.findFirst({ where: { name: 'Miền Nam' } })
  if (!region) {
    region = await prisma.region.create({ data: { name: 'Miền Nam' } })
  }

  let provinceHcm = await prisma.province.findFirst({
    where: { name: 'TP. Hồ Chí Minh', regionId: region.id },
  })
  if (!provinceHcm) {
    provinceHcm = await prisma.province.create({
      data: { regionId: region.id, name: 'TP. Hồ Chí Minh' },
    })
  }

  let departure = await prisma.location.findFirst({
    where: { name: 'Thành phố Hồ Chí Minh', provinceId: provinceHcm.id },
  })
  if (!departure) {
    departure = await prisma.location.create({
      data: {
        provinceId: provinceHcm.id,
        name: 'Thành phố Hồ Chí Minh',
        description: 'Điểm khởi hành',
        isActive: true,
      },
    })
  }

  let provinceCt = await prisma.province.findFirst({
    where: { name: 'Cần Thơ', regionId: region.id },
  })
  if (!provinceCt) {
    provinceCt = await prisma.province.create({
      data: { regionId: region.id, name: 'Cần Thơ' },
    })
  }

  let destination = await prisma.location.findFirst({
    where: { name: 'Cần Thơ', provinceId: provinceCt.id },
  })
  if (!destination) {
    destination = await prisma.location.create({
      data: {
        provinceId: provinceCt.id,
        name: 'Cần Thơ',
        description: 'Điểm đến / khu vực tour Miền Tây',
        isActive: true,
      },
    })
  }

  return { departure, destination }
}

async function ensureExtraLocation(name: string, description: string) {
  const region = await prisma.region.findFirstOrThrow({
    where: { name: 'Miền Nam' },
  })
  const province = await prisma.province.findFirstOrThrow({
    where: { name: 'TP. Hồ Chí Minh', regionId: region.id },
  })
  const existing = await prisma.location.findFirst({
    where: { name, provinceId: province.id },
  })
  return (
    existing ??
    prisma.location.create({
      data: { provinceId: province.id, name, description, isActive: true },
    })
  )
}

/** Tài khoản ADMIN để đăng nhập quản trị (CRUD tour cần role ADMIN). */
async function ensureAdminUser() {
  const email = 'admin@example.com'
  const passwordPlain = 'Admin123!'
  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    const passwordHash = await bcrypt.hash(passwordPlain, 10)
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Quản trị',
        lastName: 'Hệ thống',
        status: 'ACTIVE',
        role: 'ADMIN',
        emailVerified: true,
      },
    })
    console.log(`Đã tạo ADMIN: ${email} / ${passwordPlain}`)
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })
    console.log(
      `Đã đảm bảo quyền ADMIN cho: ${email} (giữ mật khẩu hiện tại; tài khoản mới dùng ${passwordPlain})`,
    )
  }
}

async function ensureTags(names: string[]) {
  const tags: { id: number; name: string }[] = []
  for (const name of names) {
    let t = await prisma.tourTag.findFirst({ where: { name } })
    if (!t) {
      t = await prisma.tourTag.create({ data: { name } })
    }
    tags.push(t)
  }
  return tags
}

async function main() {
  await removeSeedTours()
  await ensureAdminUser()

  const { departure } = await ensureDepartureAndDestination()
  const tags = await ensureTags([
    'Tiêu chuẩn',
    'Xe du lịch',
    'Giá tốt',
    'Miền Tây',
    'Biển đảo',
    'Nghỉ dưỡng',
    'Khám phá',
    'Văn hóa',
    'Cao cấp',
    'Gia đình',
  ])

  const destinations = new Map<string, Awaited<ReturnType<typeof ensureExtraLocation>>>()
  for (const name of [
    'Cần Thơ',
    'Đà Lạt',
    'Nha Trang',
    'Phú Quốc',
    'Đà Nẵng',
    'Hạ Long',
    'Sa Pa',
    'Huế',
    'Mũi Né',
    'Côn Đảo',
  ]) {
    destinations.set(name, await ensureExtraLocation(name, `Điểm đến ${name}`))
  }

  const tourSeeds = [
    ['mien-tay-4n3d', 'Miền Tây: Cần Thơ - Cà Mau - Đất Mũi (4N3Đ)', 'Cần Thơ', 4790000, 4, 'STANDARD', 'BUS', true],
    ['da-lat-3n2d', 'Đà Lạt mộng mơ - Langbiang - Thung lũng Tình yêu (3N2Đ)', 'Đà Lạt', 3290000, 3, 'GOOD_VALUE', 'BUS', true],
    ['nha-trang-4n3d', 'Nha Trang biển xanh - VinWonders - Vịnh Nha Phu (4N3Đ)', 'Nha Trang', 5890000, 4, 'PREMIUM', 'BUS', true],
    ['phu-quoc-3n2d', 'Phú Quốc nghỉ dưỡng - Cáp treo Hòn Thơm (3N2Đ)', 'Phú Quốc', 6990000, 3, 'PREMIUM', 'FLIGHT', true],
    ['da-nang-hoi-an-4n3d', 'Đà Nẵng - Hội An - Bà Nà Hills (4N3Đ)', 'Đà Nẵng', 6290000, 4, 'STANDARD', 'FLIGHT', true],
    ['ha-long-yen-tu-3n2d', 'Hạ Long - Yên Tử - du thuyền ngủ đêm (3N2Đ)', 'Hạ Long', 7590000, 3, 'PREMIUM', 'FLIGHT', false],
    ['sa-pa-fansipan-3n2d', 'Sa Pa - Fansipan - bản Cát Cát (3N2Đ)', 'Sa Pa', 5490000, 3, 'STANDARD', 'FLIGHT', false],
    ['hue-phong-nha-4n3d', 'Cố đô Huế - động Phong Nha - Quảng Bình (4N3Đ)', 'Huế', 5190000, 4, 'STANDARD', 'BUS', false],
    ['mui-ne-2n1d', 'Mũi Né - Bàu Trắng - đồi cát bay (2N1Đ)', 'Mũi Né', 2190000, 2, 'ECONOMY', 'BUS', false],
    ['con-dao-3n2d', 'Côn Đảo linh thiêng - biển Đầm Trầu (3N2Đ)', 'Côn Đảo', 8290000, 3, 'PREMIUM', 'FLIGHT', false],
    ['can-tho-cu-chi-2n1d', 'Cần Thơ - Củ Chi - trải nghiệm miền quê (2N1Đ)', 'Cần Thơ', 1890000, 2, 'ECONOMY', 'BUS', false],
    ['nha-trang-da-lat-5n4d', 'Nha Trang - Đà Lạt: biển và cao nguyên (5N4Đ)', 'Nha Trang', 7390000, 5, 'GOOD_VALUE', 'BUS', false],
  ] as const

  for (const [index, seed] of tourSeeds.entries()) {
    const [slug, name, destinationName, price, durationDays, tourLine, transportType, isFeatured] = seed
    const destination = destinations.get(destinationName)
    if (!destination) throw new Error(`Missing destination ${destinationName}`)
    const itinerary = Array.from({ length: durationDays }, (_, dayIndex) => ({
      dayNumber: dayIndex + 1,
      title: `${name.split(' - ')[0]} - chương trình ngày ${dayIndex + 1}`,
      description: 'Ăn sáng, tham quan theo chương trình và hướng dẫn viên địa phương.',
    }))
    const firstDeparture = new Date(Date.UTC(2026, 9 + Math.floor(index / 6), 3 + (index % 6) * 4, 7))
    const departureDays = Array.from({ length: 4 }, (_, scheduleIndex) => addDaysUtc(firstDeparture, scheduleIndex * 14))

    await prisma.tour.create({
      data: {
        departureLocationId: departure.id,
        destinationLocationId: destination.id,
        name,
        slug: `${SAMPLE_SLUG_PREFIX}${slug}`,
        description: `${name}. Chương trình trọn gói, lịch khởi hành linh hoạt và nhiều ưu đãi cho gia đình.`,
        durationDays,
        basePrice: price,
        singleRoomSupplement: Math.round(price * 0.2),
        maxPeople: transportType === 'BUS' ? 45 : 30,
        tourLine,
        transportType,
        thumbnailUrl: `https://images.unsplash.com/photo-${['1583417319070-4a69db38a2c6', '1500530855697-b586d89ba3ee', '1530789253388-582c481c54b0'][index % 3]}?w=1200`,
        ratingAvg: 4.2 + (index % 8) / 10,
        totalReviews: 35 + index * 17,
        isActive: true,
        isFeatured,
        itineraries: { create: itinerary },
        schedules: {
          create: departureDays.map((startDate) => ({
            startDate,
            endDate: addDaysUtc(startDate, durationDays - 1),
            availableSeats: transportType === 'BUS' ? 45 : 30,
            bookedSeats: index % 4,
            priceOverride: price,
            status: 'OPEN',
          })),
        },
        images: {
          create: [
            { imageUrl: `https://images.unsplash.com/photo-${['1583417319070-4a69db38a2c6', '1500530855697-b586d89ba3ee'][index % 2]}?w=1200`, isThumbnail: true },
            { imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', isThumbnail: false },
          ],
        },
        tags: { create: tags.slice(index % 5, (index % 5) + 4).map((tag) => ({ tagId: tag.id })) },
      },
    })
  }

  console.log(`Đã seed ${tourSeeds.length} tour mẫu, mỗi tour 4 lịch khởi hành.`)

  await prisma.promoCode.upsert({
    where: { code: 'GIAM10' },
    create: {
      code: 'GIAM10',
      percentOff: 10,
      maxDiscountAmount: 5_000_000,
      isActive: true,
      tourId: null,
    },
    update: { isActive: true },
  })
  console.log('Đã upsert mã giảm giá mẫu: GIAM10 (10%, tối đa 5.000.000đ)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
