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
export interface SingleStreakInfo {
  current: number
  currentStart: string | null
  longest: number
  longestStart: string | null
  longestEnd: string | null
}

export interface StreakInfo {
  // Green streak (consecutive green days)
  current: number
  currentStart: string | null
  longest: number
  longestStart: string | null
  longestEnd: string | null
  lastGreenDate: string | null
  // Activity streak (consecutive days with any entry)
  activity: SingleStreakInfo
}

// Helper function to calculate streak from sorted date list
function calculateStreakFromDates(
  sortedDates: string[],
  today: Date
): SingleStreakInfo {
  if (sortedDates.length === 0) {
    return { current: 0, currentStart: null, longest: 0, longestStart: null, longestEnd: null }
  }

  const todayStr = formatDate(today)
  const yesterdayStr = formatDate(new Date(today.getTime() - 86400000))

  let current = 0
  let currentStart: string | null = null
  let longest = 0
  let longestStart: string | null = null
  let longestEnd: string | null = null
  let tempStreak = 1
  let tempStreakEnd = sortedDates[0]

  // Check if streak is active (today or yesterday has entry)
  const lastDate = sortedDates[0]
  const isActive = lastDate === todayStr || lastDate === yesterdayStr

  if (isActive) {
    let expectedDate = new Date(lastDate)
    for (const dateStr of sortedDates) {
      const expected = formatDate(expectedDate)
      if (dateStr === expected) {
        current++
        currentStart = dateStr
        expectedDate = new Date(expectedDate.getTime() - 86400000)
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1
      tempStreakEnd = sortedDates[i]
      continue
    }

    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000

    if (diffDays === 1) {
      tempStreak++
    } else {
      if (tempStreak > longest) {
        longest = tempStreak
        longestEnd = tempStreakEnd
        longestStart = sortedDates[i - 1]
      }
      tempStreak = 1
      tempStreakEnd = sortedDates[i]
    }
  }

  // Check final streak
  if (tempStreak > longest) {
    longest = tempStreak
    longestEnd = tempStreakEnd
    longestStart = sortedDates[sortedDates.length - 1]
  }

  // If current streak is the longest
  if (current > longest) {
    longest = current
    longestStart = currentStart
    longestEnd = lastDate
  } else if (current === longest && current > 0) {
    longestStart = currentStart
    longestEnd = lastDate
  }

  return { current, currentStart, longest, longestStart, longestEnd }
}

export function calculateStreak(
  entries: DayEntry[],
  threshold: ColorThreshold,
  today: Date
): StreakInfo {
  // Green streak: only green days
  const greenDates = entries
    .filter(e => getGoalStatus(e, threshold) === 'green')
    .map(e => e.date)
    .sort((a, b) => b.localeCompare(a))

  const greenStreak = calculateStreakFromDates(greenDates, today)

  // Activity streak: any day with an entry
  const activityDates = entries
    .map(e => e.date)
    .sort((a, b) => b.localeCompare(a))

  const activityStreak = calculateStreakFromDates(activityDates, today)

  return {
    current: greenStreak.current,
    currentStart: greenStreak.currentStart,
    longest: greenStreak.longest,
    longestStart: greenStreak.longestStart,
    longestEnd: greenStreak.longestEnd,
    lastGreenDate: greenDates[0] || null,
    activity: activityStreak
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
