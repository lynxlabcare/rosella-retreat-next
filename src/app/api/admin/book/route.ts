import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'Asia/Kolkata';

function isAuthenticated(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const pin = authHeader.replace('Bearer ', '').trim();
  return pin === process.env.ADMIN_PIN;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guestName, source, checkIn, checkOut } = await req.json();

    if (!guestName || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Guest name, check-in, and check-out are required.' }, { status: 400 });
    }

    const checkInIST = toZonedTime(new Date(`${checkIn}T00:00:00`), TIMEZONE);
    const checkOutIST = toZonedTime(new Date(`${checkOut}T00:00:00`), TIMEZONE);

    const booking = await prisma.booking.create({
      data: { guestName, source, checkIn: checkInIST, checkOut: checkOutIST, status: 'CONFIRMED' },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
