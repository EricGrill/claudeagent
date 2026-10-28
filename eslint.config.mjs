import tseslint from "typescript-eslint";

export default tseslint.config({
  ignores: [".next/**", "node_modules/**"],
  extends: [...tseslint.configs.recommended],
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
  },
});
