module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "simple-import-sort"],
  extends: ["@wemake-services/typescript/strict"],
  ignorePatterns: [".eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      "./backend/tsconfig.json",
      "./frontend/tsconfig.json",
      "./tsconfig.json"
    ]
  },
  rules: {
    "@typescript-eslint/semi": [2, "always"],
    "quotes": [2, "double", { "avoidEscape": true }],
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    "camelcase": "error",
    "@typescript-eslint/indent": "off",
    "max-len": ["warn", { "code": 120, "tabWidth": 2 }],
    "import/max-dependencies": ["warn", { "ignoreTypeImports": true }],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/ban-types": ["error", { "types": { "{}": false } }]
  }
}
