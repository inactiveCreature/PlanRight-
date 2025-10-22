import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      eqeqeq: 'error',
      'no-fallthrough': 'error',
      'no-case-declarations': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
  },
  {
    files: ['src/server/**/*.ts', 'scripts/**/*.{ts,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      'no-console': 'off', // Allow console in server/scripts
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}', 'src/tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.jest,
        RequestInfo: 'readonly',
        RequestInit: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in tests
    },
  },
  {
    ignores: ['dist', 'node_modules', '*.config.js', '*.config.ts'],
  },
]
