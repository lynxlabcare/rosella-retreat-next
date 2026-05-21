import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { eachDayOfInterval, parseISO } from 'date-fns';

const prisma = new PrismaClient();

function isAuthenticated(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const pin = authHeader.replace('Bearer ', '').trim();
  return pin === process.env.ADMIN_PIN;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const overrides = await prisma.priceOverride.findMany({
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(overrides);
  } catch (error) {
    console.error('Error fetching price overrides:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start, end, price, reason } = await req.json();

    if (!start || !end || !price) {
      return NextResponse.json({ error: 'Start, end, and price are required.' }, { status: 400 });
    }

    const startObj = parseISO(start);
    const endObj = parseISO(end);
    const parsedPrice = parseInt(price, 10);
    const resolvedReason = reason || 'Custom Override';

    const dates = eachDayOfInterval({ start: startObj, end: endObj });

    const upsertPromises = dates.map(dateObj => {
      return prisma.priceOverride.upsert({
        where: { date: dateObj },
        update: { price: parsedPrice, reason: resolvedReason },
        create: { date: dateObj, price: parsedPrice, reason: resolvedReason }
      });
    });

    await Promise.all(upsertPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error upserting price overrides:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Override ID is required' }, { status: 400 });
    }

    await prisma.priceOverride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price override:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
