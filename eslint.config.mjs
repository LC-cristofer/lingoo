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
    // Python env and caches of the audio tools.
    "tools/audio/.venv/**",
    "tools/audio/.cache/**",
    "**/__pycache__/**",
    // The approved prototype (reference only, plain browser scripts), not app code.
    "tools/visual/ilha/**",
  ]),
]);

export default eslintConfig;
