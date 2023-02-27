import winston, { format } from "winston";

export default class Logger {
  get(): winston.Logger {
    return winston.createLogger({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message }) => {
          return `${level} ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console({ level: process.env.NODE_ENV === "production" ? "info" : "debug" }),
        new winston.transports.File({ level: "debug", filename: "app.log" }),
      ],
    });
  }
}
