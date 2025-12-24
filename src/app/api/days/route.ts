import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET all days for a year
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  const days = await prisma.dayEntry.findMany({
    where: { year },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(days)
}

// POST/PUT - create or update a day
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, noSubstances, exercise, writing } = body

  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()

  const entry = await prisma.dayEntry.upsert({
    where: { date: dateObj },
    update: {
      noSubstances,
      exercise,
      writing,
    },
    create: {
      date: dateObj,
      year,
      month,
      day,
      noSubstances,
      exercise,
      writing,
    },
  })

  return NextResponse.json(entry)
}
