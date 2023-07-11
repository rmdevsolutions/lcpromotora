import { createLogger, transports, format } from "winston";

const mainLogger = createLogger({
  level: "info",
  transports: [
    new transports.File({
      filename: "info-logs.log",
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.File({
      filename: "error-logs.log",
      level: "error",
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});

export default mainLogger;
