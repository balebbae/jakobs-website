import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "next-env.d.ts", "drizzle/**"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      // The board components predate the React Compiler rules; they are kept as written.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
    },
  },
  // Error pages leave with a full page load on purpose, to reset a broken client state.
  { files: ["src/app/error.tsx", "src/app/global-error.tsx"], rules: { "@next/next/no-html-link-for-pages": "off" } },
]);
