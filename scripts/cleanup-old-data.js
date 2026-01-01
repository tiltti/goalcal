/**
 * ⚠️  LOCAL DEVELOPMENT ONLY - NEVER RUN ON PRODUCTION
 * This script cleans up old/malformed data from local DynamoDB.
 * It will FAIL if endpoint is not localhost (safety check).
 */

const { DynamoDBClient, ScanCommand, BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');

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

async function cleanup() {
  // Scan for all items with lowercase entryType patterns
  const result = await client.send(new ScanCommand({
    TableName: 'goalcal'
  }));

  const toDelete = result.Items.filter(item => {
    const entryType = item.entryType.S;
    // Delete lowercase config and lowercase day# entries
    return entryType === 'config' || entryType.startsWith('day#');
  });

  if (toDelete.length === 0) {
    console.log('No old entries to clean up');
    return;
  }

  console.log(`Deleting ${toDelete.length} old entries with lowercase entryType...`);

  // Delete in batches of 25
  for (let i = 0; i < toDelete.length; i += 25) {
    const batch = toDelete.slice(i, i + 25).map(item => ({
      DeleteRequest: {
        Key: {
          calendarId: item.calendarId,
          entryType: item.entryType
        }
      }
    }));

    await client.send(new BatchWriteItemCommand({
      RequestItems: { goalcal: batch }
    }));
    process.stdout.write('.');
  }
  console.log('\nCleanup complete!');
}

cleanup().catch(console.error);
