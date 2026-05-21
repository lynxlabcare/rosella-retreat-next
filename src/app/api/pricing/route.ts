import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { eachDayOfInterval, subDays, getDay } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'Asia/Kolkata';

export async function POST(req: NextRequest) {
  try {
    const { checkIn, checkOut } = await req.json();

    // Guard clause prevents 400 errors on initial page load
    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'Dates required.' }, { status: 400 });
    }

    const checkInDate = toZonedTime(new Date(`${checkIn}T00:00:00`), TIMEZONE);
    const checkOutDate = toZonedTime(new Date(`${checkOut}T00:00:00`), TIMEZONE);

    if (checkInDate >= checkOutDate) return NextResponse.json({ error: 'Invalid dates.' }, { status: 400 });

    const nights = eachDayOfInterval({ start: checkInDate, end: subDays(checkOutDate, 1) });
    const overrides = await prisma.priceOverride.findMany({
      where: { date: { gte: checkInDate, lte: subDays(checkOutDate, 1) } }
    });

    const overrideMap = new Map();
    overrides.forEach(ovr => overrideMap.set(formatInTimeZone(ovr.date, TIMEZONE, 'yyyy-MM-dd'), ovr));

    const BASE_PRICE = parseInt(process.env.NEXT_PUBLIC_BASE_PRICE || '4000', 10);
    const WEEKEND_PRICE = parseInt(process.env.NEXT_PUBLIC_WEEKEND_PRICE || '5500', 10);

    let totalPrice = 0;
    const breakdown = [];

    for (const night of nights) {
      const dateStr = formatInTimeZone(night, TIMEZONE, 'yyyy-MM-dd');
      const dayOfWeek = getDay(night); 

      let appliedPrice = BASE_PRICE;
      let reason = 'Base Rate';

      if (overrideMap.has(dateStr)) {
        appliedPrice = overrideMap.get(dateStr).price;
        reason = overrideMap.get(dateStr).reason || 'Custom Override';
      } else if (dayOfWeek === 5 || dayOfWeek === 6) {
        appliedPrice = WEEKEND_PRICE;
        reason = 'Weekend Rate';
      }

      totalPrice += appliedPrice;
      breakdown.push({ date: dateStr, price: appliedPrice, reason });
    }

    return NextResponse.json({ totalPrice, breakdown });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
