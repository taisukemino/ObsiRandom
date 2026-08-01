import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    files: ["build.ts"],
    languageOptions: {
      globals: { Bun: "readonly" }
    }
  },
  {
    ignores: ["main.js", "node_modules/**"]
  }
);
