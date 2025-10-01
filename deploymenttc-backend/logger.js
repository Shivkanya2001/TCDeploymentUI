import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// helper for consistent app events
export function logEvent(level, event, payload = {}) {
  const entry = { ts: new Date().toISOString(), level, event, ...payload };
  logger.log(level, entry);
}
