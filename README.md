# PlanRight — Exempt Development Wizard

Modular, commented React + Vite project with a deterministic rules engine.
Left = stepper, center = form, right = AI chat panel. Chat action chips write straight into the form.

## Quick start

1. **Install**: `npm i`
2. **Run dev**: `npm run dev` then open the URL it prints.
3. **Run tests**: `npm test` (Vitest).
4. **Build**: `npm run build` then `npm run preview`.

## Structure

```
src/
  App.tsx                 # App shell
  index.css               # Tailwind entry
  main.tsx                # Mounts React
  types.ts                # Shared type definitions
  rules/
    engine.ts             # Deterministic rules (placeholder thresholds) — heavily commented
  components/
    ChatBubble.tsx        # Single declaration of chat bubble
    ChatPanel.tsx         # Right-hand AI copilot (chips + input)
    DecisionCard.tsx      # Result summary with bullets and quick fixes
    Stepper.tsx           # Left column vertical stepper
    ui/
      Badge.tsx           # Small status badge
      FormBits.tsx        # Label, Field, TextInput, NumberInput, Select, Toggle, Chip
      Section.tsx         # Card section wrapper
  features/
    wizard/
      PlanRightWizard.tsx # The actual multi-step wizard logic
  tests/
    engine.test.ts        # Vitest: 8 scenarios (6 original preserved + 2 new)
standalone/
  index.html              # CDN demo you can open without installing anything
  app.jsx                 # Same wizard bundled into one file for quick manual runs
tests_python/
  rules_engine_mirror.py  # Python mirror to verify logic in this environment
  scenarios.json          # Test cases (kept stable; original 6 untouched)
  run_tests.py            # Executes and prints a summary
```

## Notes

- **No duplicate components**: `ChatBubble` is declared once and used everywhere, which fixes the previous `Identifier 'ChatBubble' has already been declared` error.
- Thresholds in `rules/engine.ts` are clearly marked as placeholders pending exact SEPP clause values.
- Every major file has comments explaining the intent. You’re welcome.

Generated: 2025-10-11T05:55:31.531281Z
