# KEEP.md - Intentionally Kept Files

This document lists files and code that were flagged as unused by audit tools but are intentionally kept for specific reasons.

## Server Dependencies
- `cors`, `express`, `node-fetch` - Used by the chat server (`src/server/chat.ts`) which is run via npm script `npm run server`
- `@types/cors`, `@types/express`, `@types/node-fetch` - Type definitions for server dependencies

## Internal Usage (Not Exported)
- `THRESHOLDS` in `src/config/thresholds.ts` - Used internally by `getThresholds()` function
- `fieldLabels` in `src/wizard/steps.ts` - Used internally by `getStepValidationErrors()` function
- `requiredPaths` in `src/wizard/steps.ts` - Used by rules engine in `src/rules/engine.ts`

## Test Dependencies
- `@testing-library/react` - Used in component tests
- `jsdom` - Used as test environment for DOM testing
- `vitest` - Test runner used throughout the project

## Build Tools
- `autoprefixer`, `postcss` - Used by Tailwind CSS for CSS processing
- `tailwindcss` - CSS framework used throughout the project
- `@vitejs/plugin-react-swc` - Vite plugin for React compilation
- `vite` - Build tool and dev server
- `typescript` - TypeScript compiler

## Development Tools
- `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` - Code linting
- `prettier` - Code formatting
- `concurrently` - Run multiple npm scripts simultaneously
- `tsx` - TypeScript execution for server
- `knip`, `ts-prune`, `depcheck` - Code analysis tools
- `rollup-plugin-visualizer` - Bundle analysis
- `vite-plugin-checker` - Type checking during build

## Test Files
All test files in `src/tests/` and `tests/` directories are kept as they provide test coverage for the application.

## Notes
- The audit tools may flag some dependencies as unused because they're used in build scripts, configuration files, or server code that's not part of the main application bundle
- Some exports are used internally within the same file and don't need to be exported
- Test utilities and mock data are intentionally kept for test coverage
