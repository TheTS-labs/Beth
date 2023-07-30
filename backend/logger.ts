import winston, { format } from "winston";

const customLevels = {
  levels: {
    error: 0,
    fail: 0,
    system: 1,
    middleware: 2,
    trying: 3,
    database: 3,
    request: 4,
    response: 5,
    env: 6,
    quiet: -1
  },
  colors: {
    error: "brightRed bold",
    fail: "red",
    system: "brightBlue",
    middleware: "yellow",
    trying: "cyan italic",
    database: "brightGreen",
    request: "green italic",
    response: "magenta",
    env: "gray",
    quiet: "white"
  }
};

export default class Logger {
  get(level: string): winston.Logger {
    winston.addColors(customLevels.colors);

    return winston.createLogger({
      levels: customLevels.levels,
      format: format.combine(
        format.colorize(/*{ level: true }*/),
        format.printf(({ level, message, path, context/*, subtext*/ }) => {
          const now = new Date().toISOString();
          // const startsWith = subtext ? "  -->" : "==>";

          if (path) {
            path = path.split("/").slice(-1).join("/");
          }

          if (context) {
            // TODO: Use pretty JSON
            context = JSON.stringify(context);

            // return `==> [ ${level} ] ${message} | ${path} \n  --> Context: ${context}`;
            return `┌${level} at ${now} by [${path}]: ${message} \n└Context: ${context}`;
          }

          // return `${startsWith} [ ${level} ] ${message} | ${path}`;
          return `${level} at ${now} by [${path}]: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console({ level: level }),
        new winston.transports.File({ level: "debug", filename: "app.log" }),
      ],
    });
  }
}