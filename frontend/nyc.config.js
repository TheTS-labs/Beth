module.exports = {
  all: true,
  include: [
    "pages/**/**",
    "components/common/errors.tsx",
    "lib/hooks/use_request.ts",
    "lib/hooks/use_auth_token.ts",
    "components/common/loader.tsx",

    // Work in progress, so exclude them to meet global coverage threshold
    "components/**/**",
    "lib/**/**",
  ],
  exclude: ["node_modules/**/**", "lib/atomWithHash.ts"],
  watermarks: {
    lines: [80, 90],
    functions: [80, 90],
    branches: [80, 90],
    statements: [80, 90]
  }
}