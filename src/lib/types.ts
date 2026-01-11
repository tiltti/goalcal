// Calendar configuration
export interface Goal {
  id: string
  name: string
  startDate?: string // YYYY-MM-DD, goal active from this date (inclusive)
  endDate?: string   // YYYY-MM-DD, goal active until this date (inclusive)
}

// Check if a goal is active for a given date
export function isGoalActive(goal: Goal, dateStr: string): boolean {
  if (goal.startDate && dateStr < goal.startDate) return false
  if (goal.endDate && dateStr > goal.endDate) return false
  return true
}

// Filter goals that are active for a given date
export function getActiveGoals(goals: Goal[], dateStr: string): Goal[] {
  return goals.filter(g => isGoalActive(g, dateStr))
}

// Trackable: something to log that doesn't affect scoring
export interface Trackable {
  id: string
  name: string
  type: 'boolean' | 'number'
  unit?: string // e.g., "tuntia", "km" for number types
  startDate?: string // YYYY-MM-DD, trackable active from this date (inclusive)
  endDate?: string   // YYYY-MM-DD, trackable active until this date (inclusive)
}

// Check if a trackable is active for a given date
export function isTrackableActive(trackable: Trackable, dateStr: string): boolean {
  if (trackable.startDate && dateStr < trackable.startDate) return false
  if (trackable.endDate && dateStr > trackable.endDate) return false
  return true
}

// Filter trackables that are active for a given date
export function getActiveTrackables(trackables: Trackable[], dateStr: string): Trackable[] {
  return trackables.filter(t => isTrackableActive(t, dateStr))
}

// Yearly goal: one-time achievement for the year
export interface YearlyGoal {
  id: string
  name: string
  type: 'boolean' | 'count'
  target?: number // for count type: target number to reach
  current: number // for count type: current progress (0 for boolean = not done, 1 = done)
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
  trackables?: Trackable[]
  yearlyGoals?: YearlyGoal[]
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
  trackables?: Record<string, boolean | number> // trackableId -> value
  notes?: string // free-form notes for the day
  isSick?: boolean // sick day - no goals counted, doesn't break streaks
  updatedAt: string
}

// DynamoDB item types
export interface ConfigItem {
  calendarId: string
  entryType: 'CONFIG'
  name: string
  passwordHash: string
  goals: Goal[]
  trackables?: Trackable[]
  yearlyGoals?: YearlyGoal[]
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
  trackables?: Record<string, boolean | number>
  notes?: string
  isSick?: boolean
  updatedAt: string
}

export type DynamoItem = ConfigItem | DayItem

// Goal status for coloring
export type GoalStatus = 'empty' | 'red' | 'yellow' | 'green' | 'sick'

export function getGoalStatus(
  entry: DayEntry | null,
  threshold: ColorThreshold,
  allGoals?: Goal[],
  dateStr?: string
): GoalStatus {
  if (!entry || !entry.goals) return 'empty'

  // Check for sick day first
  if (entry.isSick) return 'sick'

  // If goals and date provided, only count active goals
  let completed: number
  if (allGoals && dateStr) {
    const activeGoals = getActiveGoals(allGoals, dateStr)
    const activeGoalIds = new Set(activeGoals.map(g => g.id))
    completed = Object.entries(entry.goals)
      .filter(([id, done]) => done && activeGoalIds.has(id))
      .length
  } else {
    completed = Object.values(entry.goals).filter(Boolean).length
  }

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

// Helper to calculate streak with sick days as "pass-through" (don't break streak)
function calculateStreakWithSickDays(
  qualifyingDates: string[],
  sickDates: Set<string>,
  today: Date
): SingleStreakInfo {
  if (qualifyingDates.length === 0) {
    return { current: 0, currentStart: null, longest: 0, longestStart: null, longestEnd: null }
  }

  const todayStr = formatDate(today)
  const qualifyingSet = new Set(qualifyingDates)

  // Calculate current streak - walk backwards from today
  // Count consecutive qualifying days, treating sick days as "bridges"
  let current = 0
  let currentStart: string | null = null
  let checkDate = new Date(today)

  while (true) {
    const dateStr = formatDate(checkDate)
    if (qualifyingSet.has(dateStr)) {
      current++
      currentStart = dateStr
      checkDate = new Date(checkDate.getTime() - 86400000)
    } else if (sickDates.has(dateStr)) {
      // Sick day - skip it but don't break streak
      checkDate = new Date(checkDate.getTime() - 86400000)
    } else {
      // Not qualifying and not sick - streak breaks
      break
    }

    // Don't go before the year started
    if (checkDate.getFullYear() < today.getFullYear()) break
  }

  // Calculate longest streak (simplified - just use regular calculation)
  // For longest, we can use the basic method since sick days in the middle
  // are complex to track historically
  const basicStreak = calculateStreakFromDates(qualifyingDates.sort((a, b) => b.localeCompare(a)), today)

  return {
    current,
    currentStart,
    longest: Math.max(current, basicStreak.longest),
    longestStart: current >= basicStreak.longest ? currentStart : basicStreak.longestStart,
    longestEnd: current >= basicStreak.longest ? todayStr : basicStreak.longestEnd
  }
}

export function calculateStreak(
  entries: DayEntry[],
  threshold: ColorThreshold,
  today: Date
): StreakInfo {
  // Get sick day dates
  const sickDates = new Set(
    entries.filter(e => e.isSick).map(e => e.date)
  )

  // Green streak: only green days (sick days bridge the gap)
  const greenDates = entries
    .filter(e => getGoalStatus(e, threshold) === 'green')
    .map(e => e.date)
    .sort((a, b) => b.localeCompare(a))

  const greenStreak = calculateStreakWithSickDays(greenDates, sickDates, today)

  // Activity streak: any day with an entry (excluding sick days from count but they bridge)
  const activityDates = entries
    .filter(e => !e.isSick) // Don't count sick days in activity
    .map(e => e.date)
    .sort((a, b) => b.localeCompare(a))

  const activityStreak = calculateStreakWithSickDays(activityDates, sickDates, today)

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
