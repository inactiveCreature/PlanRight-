# PlanRight - Project Context & Architecture

## Core Principles

### Deterministic Rules Engine

- **Primary Decision Maker**: The deterministic rules engine makes all assessment decisions
- **AI/Chat Role**: AI assistant and chat functionality serve only as guidance and assistance
- **Source of Truth**: SEPP (Exempt Development) 2008 Part 2 is the authoritative planning framework

## Supported Structures

### In Scope

- **Shed**: Small residential storage structures
- **Patio**: Covered outdoor living areas
- **Carport**: Covered vehicle parking structures

### Out of Scope

- **Other structures**: Only shed, patio, and carport are supported in this prototype

## Data Model

### Property Schema

```typescript
property: {
  id: string // Unique property identifier
  lot_size_m2: number // Total lot area in square metres
  zone_text: string // Planning zone (e.g., R1, R2, R3, RU1, etc.)
  frontage_m: number // Street frontage width in metres
  corner_lot_bool: boolean // Whether property is on a corner
  easement_bool: boolean // Whether property has easements
}
```

### Structure Schema

```typescript
structure: {
  type: 'shed' | 'patio' | 'carport' // Structure type
}
```

### Dimensions Schema

```typescript
dimensions: {
  length_m: number // Structure length in metres
  width_m: number // Structure width in metres
  height_m: number // Structure height in metres
  area_m2: number // Total area in square metres
}
```

### Location Schema

```typescript
location: {
  setback_front_m: number // Front setback distance in metres
  setback_side_m: number // Side setback distance in metres
  setback_rear_m: number // Rear setback distance in metres
  behind_building_line_bool: boolean // Whether structure is behind building line
}
```

### Siting Schema

```typescript
siting: {
  on_easement_bool: boolean // Whether structure is on easement
  over_sewer_bool: boolean // Whether structure is over sewer
  attached_to_dwelling_bool: boolean // Whether structure is attached to dwelling
}
```

### Context Schema

```typescript
context: {
  heritage_item_bool: boolean // Whether property has heritage items
  conservation_area_bool: boolean // Whether property is in conservation area
  flood_prone_bool: boolean // Whether property is flood prone
  bushfire_bool: boolean // Whether property is bushfire prone
}
```

## API Specifications

### run_rules_assessment

**Purpose**: Assess a development proposal against SEPP rules
**Input**: Complete proposal object with all schema fields
**Output**: Assessment result with pass/fail status and detailed rule checks

```typescript
function run_rules_assessment(proposal: Proposal): AssessmentResult {
  // Returns: {
  //   decision: 'Likely Exempt' | 'Likely Not Exempt' | 'Cannot assess',
  //   checks: Array<{ruleId: string, pass: boolean, clause_ref: string, description: string}>,
  //   notes: string[]
  // }
}
```

### lookup_clause

**Purpose**: Retrieve detailed information about specific SEPP clauses
**Input**: Clause reference string (e.g., "2.9(1)(a)")
**Output**: Clause title and summary

```typescript
function lookup_clause(clause_ref: string): { title: string; summary: string } {
  // Returns clause information for display in decision cards
}
```

### list_sample_properties

**Purpose**: Provide sample properties for testing and demonstration
**Input**: None
**Output**: Array of sample property objects

```typescript
function list_sample_properties(): Array<{
  id: string
  label: string
  lot_size_m2: number
  zone_text: string
  flags: string[]
}> {
  // Returns predefined sample properties
}
```

## Technology Stack

### Frontend

- **React**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework

### State Management

- **Zustand**: Lightweight state management

### Validation

- **Zod**: TypeScript-first schema validation

### Testing

- **Vitest**: Fast unit testing framework

### Package Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run typecheck`: Run TypeScript type checking
- `npm run test`: Run test suite

## Architecture Decisions

### Rules Engine

- **Deterministic**: All decisions based on explicit rule definitions
- **SEPP Compliant**: Rules directly map to SEPP (Exempt Development) 2008 Part 2
- **Testable**: Comprehensive test coverage for all rule scenarios

### User Experience

- **Role-Aware**: Different copy and guidance based on user role (Resident, Builder, Purchaser, Planner, Student)
- **Wizard Interface**: Step-by-step form completion
- **Real-time Validation**: Immediate feedback on input errors
- **Decision Cards**: Clear presentation of assessment results

### Data Flow

1. User completes wizard steps
2. Proposal data validated against schemas
3. Rules engine processes proposal
4. Assessment result displayed with role-specific guidance
5. AI assistant provides additional help if needed

## Development Guidelines

### Code Organization

- **Components**: Reusable UI components in `src/components/`
- **Features**: Feature-specific code in `src/features/`
- **Rules**: Business logic in `src/rules/`
- **Utils**: Shared utilities in `src/utils/`
- **Tests**: Test files alongside source code

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase with descriptive names

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test complete user workflows
- **Rules Tests**: Comprehensive coverage of all SEPP scenarios
