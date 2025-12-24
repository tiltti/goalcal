export interface DayData {
  id?: number
  date: string
  year: number
  month: number
  day: number
  noSubstances: boolean
  exercise: boolean
  writing: boolean
}

export type GoalStatus = 'empty' | 'red' | 'yellow' | 'green'

export function getGoalStatus(data: DayData | null): GoalStatus {
  if (!data) return 'empty'

  const goals = [data.noSubstances, data.exercise, data.writing]
  const completed = goals.filter(Boolean).length

  if (completed === 3) return 'green'
  if (completed >= 1) return 'yellow'
  return 'red'
}

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
  return date.toISOString().split('T')[0]
}

export function formatDateFi(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}
