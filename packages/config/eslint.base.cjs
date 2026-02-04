module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "sonarjs"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  env: {
    es2022: true,
    node: true
  },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "sonarjs/cognitive-complexity": ["warn", 15],
    "sonarjs/no-duplicate-string": "warn",
    "sonarjs/no-identical-functions": "warn",
    "sonarjs/no-small-switch": "warn"
  }
};
