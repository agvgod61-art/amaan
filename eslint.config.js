import js from "@eslint/js";
import react from "eslint-plugin-react";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/**/*',
      'bundle.js',
      'demo.cjs',
      'extract.cjs',
      'extract2.cjs',
      'fetch.cjs',
      'fix-imports.js',
      'fix-orderby.js',
      'fix-orders.js',
      'fix-uid.js',
      'run-test.js',
      'test-firestore.js',
      'long.cjs',
      'script.ts'
    ]
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      react,
      "@typescript-eslint": typescriptEslint
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-undef": "error"
    }
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
