// Calendar configuration
export interface Goal {
  id: string
  name: string
}

export interface ColorThreshold {
  green: number  // >= this many goals = green
  yellow: number // >= this many goals = yellow (less than green)
  // below yellow = red, no data = empty
}

export interface CalendarConfig {
  calendarId: string
  name: string
  passwordHash: string
  goals: Goal[]
  colorThreshold: ColorThreshold
  year: number
  createdAt: string
  updatedAt: string
}

// Day entry
export interface DayEntry {
  calendarId: string
  date: string // YYYY-MM-DD
  goals: Record<string, boolean> // goalId -> completed
  updatedAt: string
}

// DynamoDB item types
export interface ConfigItem {
  calendarId: string
  entryType: 'CONFIG'
  name: string
  passwordHash: string
  goals: Goal[]
  colorThreshold: ColorThreshold
  year: number
  createdAt: string
  updatedAt: string
}

export interface DayItem {
  calendarId: string
  entryType: string // DAY#YYYY-MM-DD
  date: string
  goals: Record<string, boolean>
  updatedAt: string
}

export type DynamoItem = ConfigItem | DayItem

// Goal status for coloring
export type GoalStatus = 'empty' | 'red' | 'yellow' | 'green'

export function getGoalStatus(
  entry: DayEntry | null,
  threshold: ColorThreshold
): GoalStatus {
  if (!entry || !entry.goals) return 'empty'

  const completed = Object.values(entry.goals).filter(Boolean).length

  if (completed >= threshold.green) return 'green'
  // yellow = 0 means "no yellow zone", skip directly to red
  if (threshold.yellow > 0 && completed >= threshold.yellow) return 'yellow'
  if (completed === 0 && Object.keys(entry.goals).length === 0) return 'empty'
  return 'red'
}

// Streak calculation
export interface StreakInfo {
  current: number
  longest: number
  lastGreenDate: string | null
}

export function calculateStreak(
  entries: DayEntry[],
  threshold: ColorThreshold,
  today: Date
): StreakInfo {
  // Sort entries by date descending
  const sorted = [...entries]
    .filter(e => getGoalStatus(e, threshold) === 'green')
    .sort((a, b) => b.date.localeCompare(a.date))

  if (sorted.length === 0) {
    return { current: 0, longest: 0, lastGreenDate: null }
  }

  const todayStr = formatDate(today)
  const yesterdayStr = formatDate(new Date(today.getTime() - 86400000))

  let current = 0
  let longest = 0
  let tempStreak = 1

  // Check if streak is active (today or yesterday is green)
  const lastGreen = sorted[0].date
  const isActive = lastGreen === todayStr || lastGreen === yesterdayStr

  if (isActive) {
    // Count backwards from the last green day
    let expectedDate = new Date(lastGreen)
    for (const entry of sorted) {
      const entryDate = formatDate(new Date(entry.date))
      const expected = formatDate(expectedDate)

      if (entryDate === expected) {
        current++
        expectedDate = new Date(expectedDate.getTime() - 86400000)
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      tempStreak = 1
      continue
    }

    const prevDate = new Date(sorted[i - 1].date)
    const currDate = new Date(sorted[i].date)
    const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000

    if (diffDays === 1) {
      tempStreak++
    } else {
      longest = Math.max(longest, tempStreak)
      tempStreak = 1
    }
  }
  longest = Math.max(longest, tempStreak, current)

  return {
    current,
    longest,
    lastGreenDate: sorted[0]?.date || null
  }
}

// Utility functions
export function getDaysInYear(year: number): Date[] {
  const days: Date[] = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }

  return days
}

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateFi(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Default goals for new calendars
export function getDefaultGoals(): Goal[] {
  return [
    { id: 'g1', name: 'Tavoite 1' },
    { id: 'g2', name: 'Tavoite 2' },
    { id: 'g3', name: 'Tavoite 3' }
  ]
}

export function getDefaultThreshold(): ColorThreshold {
  return {
    green: 3,
    yellow: 1
  }
}
