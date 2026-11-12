import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Saída do `vercel build`: código gerado, gitignorado, e o ESLint 9 não
    // lê .gitignore sozinho — sem isso o lint quebra em arquivo que não é nosso.
    ".vercel/**",
  ]),
]);

export default eslintConfig;
