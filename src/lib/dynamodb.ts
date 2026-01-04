import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb'
import {
  CalendarConfig,
  DayEntry,
  ConfigItem,
  DayItem,
  Goal,
  ColorThreshold,
  getDefaultGoals,
  getDefaultThreshold
} from './types'
import bcrypt from 'bcryptjs'

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'goalcal'

// Create DynamoDB client
const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
  region: process.env.AWS_REGION || 'eu-north-1',
}

// For local development with DynamoDB Local
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local'
  }
}

const client = new DynamoDBClient(clientConfig)
const docClient = DynamoDBDocumentClient.from(client)

// Calendar Config operations
export async function getCalendarConfig(
  calendarId: string
): Promise<CalendarConfig | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        calendarId,
        entryType: 'CONFIG'
      }
    })
  )

  if (!result.Item) return null

  const item = result.Item as ConfigItem
  return {
    calendarId: item.calendarId,
    name: item.name,
    passwordHash: item.passwordHash,
    goals: item.goals,
    colorThreshold: item.colorThreshold,
    year: item.year,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

export async function createCalendar(
  calendarId: string,
  name: string,
  password: string,
  goals?: Goal[],
  colorThreshold?: ColorThreshold
): Promise<CalendarConfig> {
  const now = new Date().toISOString()
  const passwordHash = await bcrypt.hash(password, 10)

  const config: ConfigItem = {
    calendarId: calendarId.toLowerCase(),
    entryType: 'CONFIG',
    name,
    passwordHash,
    goals: goals || getDefaultGoals(),
    colorThreshold: colorThreshold || getDefaultThreshold(),
    year: 2026,
    createdAt: now,
    updatedAt: now
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: config
    })
  )

  return {
    calendarId: config.calendarId,
    name: config.name,
    passwordHash: config.passwordHash,
    goals: config.goals,
    colorThreshold: config.colorThreshold,
    year: config.year,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt
  }
}

export async function updateCalendarConfig(
  calendarId: string,
  updates: Partial<Omit<CalendarConfig, 'calendarId' | 'createdAt'>>
): Promise<void> {
  const existing = await getCalendarConfig(calendarId)
  if (!existing) throw new Error('Calendar not found')

  const now = new Date().toISOString()

  const updated: ConfigItem = {
    calendarId,
    entryType: 'CONFIG',
    name: updates.name || existing.name,
    passwordHash: updates.passwordHash || existing.passwordHash,
    goals: updates.goals || existing.goals,
    trackables: updates.trackables !== undefined ? updates.trackables : existing.trackables,
    colorThreshold: updates.colorThreshold || existing.colorThreshold,
    year: updates.year || existing.year,
    createdAt: existing.createdAt,
    updatedAt: now
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: updated
    })
  )
}

export async function verifyPassword(
  calendarId: string,
  password: string
): Promise<boolean> {
  const config = await getCalendarConfig(calendarId)
  if (!config) return false
  return bcrypt.compare(password, config.passwordHash)
}

export async function listCalendars(): Promise<CalendarConfig[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'entryType = :config',
      ExpressionAttributeValues: {
        ':config': 'CONFIG'
      }
    })
  )

  return (result.Items || []).map((item) => {
    const config = item as ConfigItem
    return {
      calendarId: config.calendarId,
      name: config.name,
      passwordHash: config.passwordHash,
      goals: config.goals,
      colorThreshold: config.colorThreshold,
      year: config.year,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }
  })
}

// Day Entry operations
export async function getDayEntry(
  calendarId: string,
  date: string
): Promise<DayEntry | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        calendarId,
        entryType: `DAY#${date}`
      }
    })
  )

  if (!result.Item) return null

  const item = result.Item as DayItem
  return {
    calendarId: item.calendarId,
    date: item.date,
    goals: item.goals,
    trackables: item.trackables,
    updatedAt: item.updatedAt
  }
}

export async function saveDayEntry(
  calendarId: string,
  date: string,
  goals: Record<string, boolean>,
  trackables?: Record<string, boolean | number>
): Promise<DayEntry> {
  const now = new Date().toISOString()

  const item: DayItem = {
    calendarId,
    entryType: `DAY#${date}`,
    date,
    goals,
    trackables,
    updatedAt: now
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    })
  )

  return {
    calendarId: item.calendarId,
    date: item.date,
    goals: item.goals,
    trackables: item.trackables,
    updatedAt: item.updatedAt
  }
}

export async function getYearEntries(
  calendarId: string,
  year: number
): Promise<DayEntry[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression:
        'calendarId = :cal AND begins_with(entryType, :prefix)',
      ExpressionAttributeValues: {
        ':cal': calendarId,
        ':prefix': `DAY#${year}`
      }
    })
  )

  return (result.Items || []).map((item) => {
    const day = item as DayItem
    return {
      calendarId: day.calendarId,
      date: day.date,
      goals: day.goals,
      trackables: day.trackables,
      updatedAt: day.updatedAt
    }
  })
}

export async function deleteDayEntry(
  calendarId: string,
  date: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        calendarId,
        entryType: `DAY#${date}`
      }
    })
  )
}
