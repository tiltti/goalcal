/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "goalcal",
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
    // DynamoDB table
    const table = new sst.aws.Dynamo("GoalcalTable", {
      fields: {
        calendarId: "string",
        entryType: "string",
      },
      primaryIndex: { hashKey: "calendarId", rangeKey: "entryType" },
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
