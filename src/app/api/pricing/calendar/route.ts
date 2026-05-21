import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    if (!startStr || !endStr) return NextResponse.json({ error: 'Dates required' }, { status: 400 });

    const startDate = parseISO(startStr);
    const endDate = parseISO(endStr);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const overrides = await prisma.priceOverride.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    });

    const overrideMap = new Map();
    overrides.forEach(ovr => overrideMap.set(format(ovr.date, 'yyyy-MM-dd'), ovr.price));

    const BASE = parseInt(process.env.NEXT_PUBLIC_BASE_PRICE || '4000', 10);
    const WEEKEND = parseInt(process.env.NEXT_PUBLIC_WEEKEND_PRICE || '5500', 10);
    const prices: Record<string, number> = {};

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (overrideMap.has(dateStr)) {
        prices[dateStr] = overrideMap.get(dateStr);
      } else {
        const d = day.getDay();
        prices[dateStr] = (d === 5 || d === 6) ? WEEKEND : BASE;
      }
    }

    return NextResponse.json(prices);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
