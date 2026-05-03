import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Fan out a sync job per non-native calendar connection.
// Native (on-device) connections are pushed by the client and skipped here.
crons.cron(
  "sync external calendars",
  "*/15 * * * *",
  internal.calendars.scheduler.syncAllConnections,
  {},
);

export default crons;
