# Direct Booking Architecture Blueprint

This blueprint serves as the master technical documentation and a copy-pasteable guide for replicating the Next.js + Supabase direct booking engine built for our BnB properties. It outlines the robust two-way calendar sync, dynamic waterfall pricing, and secure admin portal.

## 1. Environment Setup & Prerequisites

Before writing any code, the environment variables must be defined. These variables separate sensitive keys from the source code and allow different configurations for local development versus production.

### Required `.env` Variables

```env
# Supabase PostgreSQL Database (Transaction pooler)
DATABASE_URL="postgres://postgres.xxx:xxx@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (For Prisma migrations)
DIRECT_URL="postgres://postgres.xxx:xxx@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# The outbound iCal link provided by the Airbnb Host Dashboard
AIRBNB_ICAL_URL="https://www.airbnb.co.in/calendar/ical/..."

# Secret PIN to access the /admin dashboard
ADMIN_PIN="123456"

# Default Pricing Variables (Exposed to frontend via NEXT_PUBLIC_)
NEXT_PUBLIC_BASE_PRICE="4000"
NEXT_PUBLIC_WEEKEND_PRICE="5500"
```

### Vercel Management
When deploying, these variables must be mapped in the Vercel Project Settings. 
- **Production vs Local:** Vercel automatically injects these into the production environment. Locally, they are read from the `.env` file. 
- **Public Variables:** The `NEXT_PUBLIC_` prefix allows the frontend to read base prices without an API call, minimizing latency on initial render.

---

## 2. The Database Schema (Supabase + Prisma)

The database acts as the Single Source of Truth (SSOT). We use Prisma ORM to interface with our Supabase PostgreSQL instance.

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Booking {
  id          String   @id @default(uuid())
  checkIn     DateTime
  checkOut    DateTime
  guestName   String
  source      String   // e.g., "Website", "Manual", "Airbnb"
  status      String   @default("CONFIRMED")
  createdAt   DateTime @default(now())
}

model PriceOverride {
  id     String   @id @default(uuid())
  date   DateTime @unique
  price  Int
  reason String?
}
```

- **`Booking`**: Stores all confirmed dates to ensure we don't double-book.
- **`PriceOverride`**: Allows the admin to set dynamic pricing for festivals or high-demand dates, superseding the base/weekend prices.

---

## 3. The Two-Way Calendar Sync Engine (Inbound & Outbound)

To prevent double-booking, the engine continuously talks to Airbnb via the iCal format (`.ics`).

### Inbound Sync (Fetching Airbnb Dates)

**File:** `app/api/availability/route.ts`

**Rationale for String Slicing:** Instead of using Regex or passing raw string dates directly to `new Date()`, we manually slice the YYYYMMDD string (e.g., `substring(0,8)`) and construct an explicit `T00:00:00` date string. This prevents severe hydration crashes and off-by-one errors caused by the server and browser interpreting UTC offsets differently.

```typescript
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
```

### Outbound Sync (Pushing to Airbnb)

**File:** `app/api/calendar/route.ts`

Formats all non-Airbnb bookings from the Database into a raw `.ics` text file endpoint that Airbnb periodically ingests.

```typescript
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
```

---

## 4. The Waterfall Pricing Engine

Calculates dynamic pricing by checking: **PriceOverride > Weekend Rate > Base Rate**.

### The Total Calculator

**File:** `app/api/pricing/route.ts`

Calculates the total stay cost. The guard clause `if (!checkIn || !checkOut)` prevents UI crashes during initial calendar load.

```typescript
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
```

### The Calendar Dictionary

**File:** `app/api/pricing/calendar/route.ts`

Generates a dictionary map (e.g., `{ "2026-05-01": 4000 }`) used by the frontend to render the daily price directly inside the `react-day-picker` cell component without hacky absolute positioning.

```typescript
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
```

---

## 5. The Secure Admin Dashboard (The "Pro Host" Portal)

Provides a hidden `/admin` UI for the host to log direct WhatsApp bookings and modify high-demand pricing.

### The Admin APIs

**Booking Endpoints:** `app/api/admin/bookings/route.ts` (Fetch) and `app/api/admin/book/route.ts` (POST/DELETE)

```typescript
// Example: POST /api/admin/book (Creating a Manual Booking)
const checkInIST = toZonedTime(new Date(`${checkIn}T00:00:00`), TIMEZONE);
const checkOutIST = toZonedTime(new Date(`${checkOut}T00:00:00`), TIMEZONE);

const booking = await prisma.booking.create({
  data: { guestName, source, checkIn: checkInIST, checkOut: checkOutIST, status: 'CONFIRMED' },
});
```

**Pricing Override Endpoints:** `app/api/admin/pricing/route.ts`

Uses `Promise.all` and `eachDayOfInterval` to safely batch insert overrides for a date range.

```typescript
// Example: PUT /api/admin/pricing (Batch Upsert Pricing)
const dates = eachDayOfInterval({ start: startObj, end: endObj });

const upsertPromises = dates.map(dateObj => {
  return prisma.priceOverride.upsert({
    where: { date: dateObj },
    update: { price: parsedPrice, reason: resolvedReason },
    create: { date: dateObj, price: parsedPrice, reason: resolvedReason }
  });
});

await Promise.all(upsertPromises);
```

### The Frontend 

**File:** `app/admin/page.tsx`

A mobile-first, dark-mode protected interface.

```tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";

export default function AdminPage() {
  const [form, setForm] = useState({ guestName: "", source: "WhatsApp", checkIn: "", checkOut: "" });
  const [pin, setPin] = useState("");
  const [bookings, setBookings] = useState([]);
  const [priceOverrides, setPriceOverrides] = useState([]);
  
  // Handlers for API calls (Fetch Dashboard, Submit Booking, Delete Booking, Upsert/Delete Overrides) omitted for brevity.
  // ...

  return (
    <main className="bg-[#1A202C] text-white min-h-screen p-6 flex flex-col items-center pt-16 pb-24">
      
      {/* Auth Gate */}
      <div className="w-full max-w-md mb-6">
        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Admin PIN</label>
        <div className="flex gap-3">
          <input type="password" placeholder="••••••" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3.5 focus:border-[#E27D60]" />
          <button onClick={handleFetchDashboard} className="bg-white/10 hover:bg-white/20 text-white px-5 rounded-2xl">
            Fetch Dashboard
          </button>
        </div>
      </div>

      {/* Manual Booking Form */}
      <motion.div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl mb-10">
         <h2 className="text-lg font-bold mb-6 text-white/80">+ Log New Booking</h2>
         {/* ... inputs for Guest Name, Source, Dates ... */}
      </motion.div>

      {/* List Views & Dynamic Pricing Override Form */}
      {/* ... mapping over bookings and priceOverrides ... */}
      
    </main>
  );
}
```

---

## 6. Deployment Checklist

1. **Commit and Push:** Commit all codebase changes to the `main` branch.
2. **Vercel Env Vars:** In the Vercel Dashboard, map the `.env` variables ensuring `DATABASE_URL` uses the pooler (port 6543) and `DIRECT_URL` uses the direct connection (port 5432).
3. **Database Migration:** Ensure `npx prisma db push` or `npx prisma migrate deploy` has run on the Supabase instance.
4. **Airbnb Integration:** 
   - Paste the Airbnb iCal link into Vercel's `AIRBNB_ICAL_URL`.
   - Take the deployed Outbound route (e.g. `https://my-bnb.com/api/calendar`) and paste it into the Airbnb Host dashboard under "Import Calendar" to finalize the sync.
