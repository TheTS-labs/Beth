import winston, { format } from "winston";

export default class Logger {
  get(level: string): winston.Logger {
    return winston.createLogger({
      format: format.combine(
        format.colorize(/*{ level: true }*/),
        format.printf(({ level, message, path, context/*, subtext*/ }) => {
          const now = new Date().toISOString();
          // const startsWith = subtext ? "  -->" : "==>";

          if (path) {
            path = path.split("/").slice(-1).join("/");
          }

          if (context) {
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
