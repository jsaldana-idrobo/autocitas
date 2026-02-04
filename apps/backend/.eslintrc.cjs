module.exports = {
  root: true,
  extends: ["../../packages/config/eslint.base.cjs"],
  env: {
    node: true
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  }
};
