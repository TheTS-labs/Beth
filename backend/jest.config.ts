import merge from "merge";
import dotenv from "dotenv";
import * as env from "env-var";

dotenv.config({ path: "../env/.backend.env" });

// https://stackoverflow.com/a/42505940
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TSPreset = require("ts-jest/jest-preset");

// ENV
// https://gist.github.com/tsmx/feb3748be5ba62a0164d575adb4b9368
process.env.LOG_LEVEL = env.get("TEST_LOG_LEVEL").required().asString();

// https://stackoverflow.com/a/52622141
export default merge.recursive(TSPreset, {
  collectCoverage: true,
  collectCoverageFrom: [
    "endpoints/**/*",
    "common/**/*",
    "middlewares/**/*",
    "db/**/*",
    "!common/types/**/*",
    "!db/migrations/**/*",
    "!db/seeds/**/*",
    "!endpoints/dev/**/*",
    env.get("REDIS_REQUIRED").required().asBool() ? "db/models/caching/**/*" : "!db/models/caching/**/*"
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: [
    "json",
    // "text",
    "lcov",
    "clover"
  ],
  coverageThreshold: {
    global: {
      branches: env.get("REDIS_REQUIRED").required().asBool() ? 90 : 85, // With disabled Redis many branches can't be covered
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest"
  }
});
