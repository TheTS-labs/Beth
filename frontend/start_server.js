const dotenv =  require("dotenv");
const env =  require("env-var");

dotenv.config({ 
  path: process.env.NODE_ENV == "development" ? "../env/development/.frontend.env" : "../env/production/.frontend.env"
});

const nodeEnv = env.get("NODE_ENV").default("development").asEnum(["development", "production", "test"]);

import(`next/dist/cli/next-${nodeEnv == "development" || nodeEnv == "test" ? "dev" : "start"}.js`).then(cli => {
  const command = nodeEnv == "development" || nodeEnv == "test" ? cli.nextDev : cli.nextStart;

  command(["-p", env.get("NEXT_PORT").required().asPortNumber()]);
});