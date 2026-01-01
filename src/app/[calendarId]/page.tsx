import { redirect } from 'next/navigation'
import { getSessionCalendarId } from '@/lib/auth'
import { getCalendarConfig } from '@/lib/dynamodb'
import { YearCalendar } from '@/components/YearCalendar'

interface PageProps {
  params: Promise<{ calendarId: string }>
}

export default async function CalendarPage({ params }: PageProps) {
  const { calendarId } = await params

  // Check if user is authenticated for this calendar
  const sessionCalendarId = await getSessionCalendarId()

  if (sessionCalendarId !== calendarId) {
    redirect('/')
  }

  // Check if calendar exists
  const config = await getCalendarConfig(calendarId)

  if (!config) {
    redirect('/')
  }

  return <YearCalendar calendarId={calendarId} />
}
