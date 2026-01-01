/// <reference path="./.sst/platform/config.d.ts" />

/**
 * ⚠️  CRITICAL: NEVER DELETE OR OVERWRITE PRODUCTION DATA
 *
 * The DynamoDB table contains user goal data that CANNOT be recovered.
 * - NEVER run `sst remove` on production
 * - NEVER delete the table manually
 * - NEVER run destructive scripts against production
 * - Always use `removal: "retain"` for production
 * - Table has `deletionProtection: true` as extra safeguard
 */

export default $config({
  app(input) {
    return {
      name: "goalcal",
      // CRITICAL: retain prevents accidental deletion of production resources
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-1",
        },
      },
    };
  },
  async run() {
    const isProduction = $app.stage === "production";

    // DynamoDB table - contains all user calendar and goal data
    // ⚠️ NEVER DELETE THIS TABLE - user data cannot be recovered
    const table = new sst.aws.Dynamo("GoalcalTable", {
      fields: {
        calendarId: "string",
        entryType: "string",
      },
      primaryIndex: { hashKey: "calendarId", rangeKey: "entryType" },
      // Prevent accidental deletion via AWS Console or API
      deletionProtection: isProduction,
    });

    // Next.js app
    const site = new sst.aws.Nextjs("GoalcalSite", {
      link: [table],
      environment: {
        DYNAMODB_TABLE: table.name,
        SESSION_SECRET: process.env.SESSION_SECRET || "change-this-in-production-min-32-chars",
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
      },
      domain: "2026.tiltti.net",
    });

    return {
      url: site.url,
      table: table.name,
    };
  },
});
