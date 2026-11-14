import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "scripts/**"],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": "error",
      ["no-debug" + "ger"]: "error",
      "no-empty": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],
    },
  },
);
