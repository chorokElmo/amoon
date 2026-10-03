import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.medusa/**", "**/.next/**", "**/next-env.d.ts"] },
  ...tseslint.configs.recommended,
  { files: ["apps/medusa/**/*.ts"], rules: { "@typescript-eslint/no-require-imports": "off" } }
);
