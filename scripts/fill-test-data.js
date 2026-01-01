/**
 * ⚠️  LOCAL DEVELOPMENT ONLY - NEVER RUN ON PRODUCTION
 * This script fills test data into local DynamoDB.
 * It will FAIL if endpoint is not localhost (safety check).
 */

const { DynamoDBClient, BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');

const ENDPOINT = 'http://localhost:8000';

// Safety check: ensure we're only connecting to localhost
if (!ENDPOINT.includes('localhost')) {
  console.error('ERROR: This script can only run against localhost!');
  process.exit(1);
}

const client = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: 'eu-north-1',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
});

async function fillData() {
  const items = [];
  // Use the correct goal IDs from the config (g1, g2, g3)
  const goals = ['g1', 'g2', 'g3'];

  // Generate entries from Jan 1 to June 30
  for (let month = 0; month < 6; month++) {
    const daysInMonth = new Date(2026, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Random goals: 0-3 completed
      const goalsObj = {};
      goals.forEach(g => {
        goalsObj[g] = { BOOL: Math.random() > 0.3 }; // 70% chance true
      });

      items.push({
        PutRequest: {
          Item: {
            calendarId: { S: 'ossi' },
            entryType: { S: `DAY#${date}` },  // Uppercase DAY# to match the app
            date: { S: date },
            goals: { M: goalsObj },
            updatedAt: { S: new Date().toISOString() }
          }
        }
      });
    }
  }

  // BatchWrite in chunks of 25
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await client.send(new BatchWriteItemCommand({
      RequestItems: { goalcal: batch }
    }));
    process.stdout.write('.');
  }

  console.log(`\nCreated ${items.length} entries for ossi (Jan-June)`);
}

fillData().catch(console.error);
