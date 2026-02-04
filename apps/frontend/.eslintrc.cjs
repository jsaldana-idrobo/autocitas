module.exports = {
  root: true,
  extends: [
    "../../packages/config/eslint.base.cjs",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  plugins: ["react", "react-hooks", "jsx-a11y"],
  env: {
    browser: true,
    node: false
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  overrides: [
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/triple-slash-reference": "off"
      }
    }
  ]
};
