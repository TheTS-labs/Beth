const Dotenv = require("dotenv-webpack");
const env = require("env-var");
const dotenv = require("dotenv");

dotenv.config({ path: "../env/.frontend.env" });

const nodeEnv = env.get("NODE_ENV").required().asEnum(["development", "production", "test"]);
const useInstrumentPlugin = nodeEnv == "development" || nodeEnv == "test";

module.exports = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(new Dotenv({ path: "../env/.frontend.env" }));
    config.resolve.fallback = { fs: false };

    return config;
  },
  experimental: {
    swcPlugins: useInstrumentPlugin ? [
       ["swc-plugin-coverage-instrument", {}],
    ] : []
  }
};