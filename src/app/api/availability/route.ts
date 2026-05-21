import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { eachDayOfInterval, format, subDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'Asia/Kolkata';

function getDatesInRange(startDate: Date, endDate: Date) {
  const startZoned = toZonedTime(startDate, TIMEZONE);
  const endZoned = toZonedTime(endDate, TIMEZONE);
  if (startZoned.getTime() >= endZoned.getTime()) return [];

  const intervalDates = eachDayOfInterval({
    start: startZoned,
    end: subDays(endZoned, 1)
  });

  return intervalDates.map(date => formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd'));
}

export async function GET() {
  try {
    const lockedDates = new Set<string>();

    // 1. Fetch DB Bookings
    const internalBookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
    });

    internalBookings.forEach((booking) => {
      const dates = getDatesInRange(booking.checkIn, booking.checkOut);
      dates.forEach(d => lockedDates.add(d));
    });

    // 2. Fetch & Parse Airbnb iCal
    const airbnbIcalUrl = process.env.AIRBNB_ICAL_URL;
    if (airbnbIcalUrl) {
      try {
        const response = await fetch(airbnbIcalUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
            'Accept': 'text/calendar' 
          }
        });
        
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        
        const text = await response.text();
        const lines = text.split(/\r?\n/);
        const unavailableDates: string[] = [];
        let currentStart: string | null = null;
        let currentEnd: string | null = null;

        for (const line of lines) {
          if (line.startsWith('BEGIN:VEVENT')) {
            currentStart = null;
            currentEnd = null;
          } else if (line.startsWith('DTSTART')) {
            currentStart = line.split(':')[1]?.substring(0, 8) ?? null;
          } else if (line.startsWith('DTEND')) {
            currentEnd = line.split(':')[1]?.substring(0, 8) ?? null;
          } else if (line.startsWith('END:VEVENT') && currentStart && currentEnd) {
            // String slicing prevents timezone drift
            const startStr = `${currentStart.substring(0, 4)}-${currentStart.substring(4, 6)}-${currentStart.substring(6, 8)}`;
            const endStr = `${currentEnd.substring(0, 4)}-${currentEnd.substring(4, 6)}-${currentEnd.substring(6, 8)}`;

            const startDate = new Date(`${startStr}T00:00:00`);
            const endDate = new Date(`${endStr}T00:00:00`);

            if (startDate < endDate) {
              const days = eachDayOfInterval({ start: startDate, end: endDate });
              days.slice(0, -1).forEach(day => {
                unavailableDates.push(format(day, 'yyyy-MM-dd'));
              });
            }
          }
        }
        unavailableDates.forEach(d => lockedDates.add(d));
      } catch (icalError: any) {
        console.error('Error fetching/parsing Airbnb iCal feed:', icalError);
      }
    }

    const flatDates = Array.from(lockedDates).sort();
    return NextResponse.json({ unavailableDates: flatDates }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
