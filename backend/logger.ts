import winston, { format } from "winston";

export default class Logger {
  get(): winston.Logger {
    return winston.createLogger({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, path, context }) => {
          const now = new Date().toISOString();

          if (path) {
            path = path.split("/").slice(-1).join("/");
          }

          if (context) {
            context = JSON.stringify(context);

            return `┌${level} at ${now} by [${path}]: ${message} \n└Context: ${context}`;
          }

          return `${level} at ${now} by [${path}]: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console({ level: process.env.NODE_ENV === "production" ? "info" : "debug"}),
        new winston.transports.File({ level: "debug", filename: "app.log" }),
      ],
    });
  }
}
