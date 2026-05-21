import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as ics from 'ics';
import { formatInTimeZone } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'Asia/Kolkata';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      where: { source: { not: 'Airbnb' }, status: 'CONFIRMED' },
    });

    const events: ics.EventAttributes[] = bookings.map((booking) => {
      const startYear = parseInt(formatInTimeZone(booking.checkIn, TIMEZONE, 'yyyy'), 10);
      const startMonth = parseInt(formatInTimeZone(booking.checkIn, TIMEZONE, 'MM'), 10);
      const startDay = parseInt(formatInTimeZone(booking.checkIn, TIMEZONE, 'dd'), 10);

      const endYear = parseInt(formatInTimeZone(booking.checkOut, TIMEZONE, 'yyyy'), 10);
      const endMonth = parseInt(formatInTimeZone(booking.checkOut, TIMEZONE, 'MM'), 10);
      const endDay = parseInt(formatInTimeZone(booking.checkOut, TIMEZONE, 'dd'), 10);

      return {
        title: `Reserved - ${booking.guestName}`,
        start: [startYear, startMonth, startDay],
        end: [endYear, endMonth, endDay],
        description: `Source: ${booking.source}`,
        uid: booking.id,
        status: 'CONFIRMED'
      };
    });

    return new Promise<Response>((resolve) => {
      if (events.length === 0) {
        resolve(new NextResponse("BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//StraightUpVibe//EN\nEND:VCALENDAR", {
          headers: { 'Content-Type': 'text/calendar', 'Cache-Control': 'no-cache' },
        }));
        return;
      }

      ics.createEvents(events, (error, value) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(new NextResponse(value, {
          headers: { 'Content-Type': 'text/calendar', 'Cache-Control': 'no-cache' },
        }));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
