const Dotenv = require("dotenv-webpack");

module.exports = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(new Dotenv({ path: "../env/.frontend.env" }))

    return config
  },
};