# Technical Documentation

## Architecture Overview
PlanRight is a React-based web application for assessing development proposals against NSW SEPP (Exempt Development) 2008 Part 2 requirements.

## Core Components
- **Wizard Interface**: Multi-step form for property and development input
- **Rules Engine**: Deterministic assessment logic based on SEPP requirements
- **Decision Cards**: Results display with detailed explanations
- **PDF Export**: Generate assessment reports

## Key Files
- `src/features/wizard/PlanRightWizard.tsx` - Main wizard component
- `src/rules/engine.ts` - Core business logic
- `src/components/DecisionCard.tsx` - Results display
- `src/store.ts` - State management

## Dependencies
- React + TypeScript + Vite
- Tailwind CSS for styling
- Zustand for state management
- Zod for validation
- Vitest + Playwright for testing