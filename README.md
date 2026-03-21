# Calc Notes

A free and open-source natural language calculator with notes. Built with Nuxt 4, Vue 3, and CodeMirror.

Write calculations naturally alongside notes, with live results, unit conversions, currency exchange, and more — all client-side in the browser.

## Prerequisites

- Node.js 22.20.0 (pinned in `mise.toml` — use [mise](https://mise.jdx.dev/) or nvm)
- npm

## Getting started

```bash
cp .env.example .env       # configure environment (see .env.example)
npm install
npm run dev                 # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build (outputs to `.output/`) |
| `npm run preview` | Preview production build locally |
| `npm run generate` | Static site generation |
| `npm run test` | Run all tests once (vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Project structure

```
├── app.vue                    # Root app component
├── pages/
│   └── index.vue              # Main (only) page — SPA
├── components/
│   ├── AppHeader.vue          # Top bar with title and settings
│   ├── NoteEditor.vue         # CodeMirror editor wrapper with calc integration
│   ├── NotesList.vue          # Sidebar note list with CRUD
│   ├── NoteMetaModal.vue      # Note rename/metadata modal
│   ├── SettingsDropdown.vue   # Settings menu (theme, language, help)
│   ├── HelpModal.vue          # In-app documentation modal
│   ├── ShortcutsModal.vue     # Keyboard shortcuts reference
│   ├── TemplatesModal.vue     # Calculation templates picker
│   ├── LanguageSwitcher.vue   # i18n locale selector
│   └── ThemeSwitcher.vue      # Light/dark mode toggle
├── composables/
│   ├── useCalculator.js       # Core calculator engine (all math/units/currency logic)
│   ├── useCalcLanguage.js       # Custom CodeMirror language definition + tokenizer
│   ├── useNotes.js            # Note persistence (localStorage) and state
│   └── useTemplates.js        # Predefined calculation templates
├── locales/                   # i18n translation files
│   ├── en-GB.json
│   ├── es-ES.json
│   └── pages/index/           # Page-scoped translations
├── tests/
│   └── useCalculator.test.js  # 221 unit tests for the calculator engine
├── nuxt.config.ts             # Nuxt configuration (SSR disabled, modules, i18n)
├── tailwind.config.js         # Tailwind with custom color palette
├── vitest.config.js           # Vitest configuration
├── Dockerfile                 # Multi-stage production build
└── docker-compose.yml         # Local Postgres (for future backend features)
```

## Architecture

The app is a pure client-side SPA (`ssr: false` in `nuxt.config.ts`). All data is stored in the browser's localStorage — there is no backend or database required for the current feature set.

### Key modules

- `useCalculator.js` — The core engine. Parses natural language input and evaluates arithmetic, percentages, unit conversions, currency exchange, date/time, variables, and aggregation (sum/average). This is where most of the logic lives and where most contributions will happen.
- `useCalcLanguage.js` — Registers a custom CodeMirror language (`calcnotes`) with syntax highlighting for numbers, operators, units, currencies, functions, and comments.
- `useNotes.js` — Manages multiple notes with auto-save to localStorage.
- `useTemplates.js` — Provides predefined templates (budget, cooking, fitness, etc.).

### Calculator engine overview

The calculator processes input line-by-line. Each line goes through this pipeline:

1. Check for formatting (headers `#`, comments `//`, labels `Label:`)
2. Check for variable assignment (`x = ...`)
3. Check for aggregation keywords (`sum`, `total`, `average`, `avg`)
4. Try timezone conversion
5. Try date/time expression
6. Try `fromunix()` function
7. Try number format conversion (`X in hex/bin/oct/sci`)
8. Try unit conversion (length, weight, volume, temp, area, speed, data, time, CSS, angular)
9. Try currency conversion
10. Fall back to regular math evaluation

Important implementation details:
- `mod` uses `⊘` as an internal placeholder to avoid conflict with the `%` percentage handler
- `xor` uses `⊕` to distinguish from `^` (exponentiation)
- Variable assignment is checked before sum/total keywords to prevent `total = X` from being caught as an aggregation
- The `times` word operator uses `\btimes\b` word boundary to avoid conflicts with date expressions
- Exchange rates are fetched live from [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) on startup, with hardcoded fallback rates for offline use

## Testing

Tests live in `tests/useCalculator.test.js` — 221 tests across 35 categories covering every calculator feature.

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

### Test setup

The composable uses Nuxt's auto-imported `ref`. Since tests run outside Nuxt, we mock it:

```js
vi.stubGlobal('ref', (val) => ({ value: val }))
```

Tests use four helper functions:

```js
calc(expression)         // evaluate single expression, return result string
calcNum(expression)      // evaluate single expression, return parsed number
calcLines(lines)         // evaluate multiple lines, return all result strings
calcLinesLastNum(lines)  // evaluate multiple lines, return last result as number
```

### Test categories

1. Basic arithmetic
2. Word operators (plus, minus, times, divide, etc.)
3. Implicit multiplication
4. Number formats (binary, octal, hex)
5. Scientific notation output
6. Scales (k, M, billion, trillion)
7. Constants (pi, e, tau, phi)
8. Variables and assignment
9. Previous result (`prev`)
10. Percentages (all 9 operations)
11. Math functions (sqrt, cbrt, abs, log, ln, fact, round, ceil, floor)
12. Trigonometry (sin, cos, tan with degree support)
13. Inverse trig (arcsin, arccos, arctan)
14. Hyperbolic functions (sinh, cosh, tanh)
15. Unit conversion — length, weight, volume, temperature, area, speed, data, time
16. CSS units (px, pt, em, rem with custom ppi)
17. Angular units (degrees, radians)
18. Currency conversion (45+ currencies, live rates)
19. Date and time (now, today, yesterday, tomorrow, relative dates)
20. Duration calculations
21. `fromunix()` timestamp conversion
22. Sum and total aggregation
23. Average aggregation
24. Formatting (headers, comments, labels, inline comments)
25. Bitwise operations (AND, OR, XOR, shift)
26. SI prefixes
27. Compound unit expressions
28. Square/cubic prefixes for area/volume
29. Timezone conversion
30. Edge cases

### Writing new tests

When adding a calculator feature, add tests to the appropriate `describe` block in `useCalculator.test.js`. If it's a new category, add a new `describe` block following the existing numbering pattern. All tests must pass before merging.

## i18n

Translations use [nuxt-i18n-micro](https://github.com/nicholasio/nuxt-i18n-micro) with the `no_prefix` strategy (no URL prefixes).

Current locales: `en-GB`, `es-ES`

Translation files:
- `locales/{locale}.json` — global translations
- `locales/pages/index/{locale}.json` — page-scoped translations

To add a new locale:
1. Add the locale config to `nuxt.config.ts` under `i18n.locales`
2. Create the corresponding JSON files in `locales/` and `locales/pages/index/`
3. Copy the structure from `en-GB.json` files and translate

## Theming

Uses `@nuxtjs/color-mode` with `class` strategy (adds `dark` class to `<html>`). System preference is detected automatically.

Custom color palette is defined in `tailwind.config.js` with semantic names: `primary`, `success`, `warning`, `error`, and an extended `gray` scale optimized for dark mode.

## Docker

```bash
docker build -t calcnotes .
docker run -p 3000:3000 calcnotes
```

The Dockerfile uses a multi-stage build: build stage with full Node.js, production stage with just the `.output` directory running as a non-root user.

## Contributing guidelines

- All calculator logic goes in `composables/useCalculator.js`
- Every new feature must have corresponding unit tests
- Run `npm run test` before committing — all 221+ tests must pass
- The app is a client-side SPA — no server-side logic for calculator features
- Use Tailwind utility classes for styling, follow the existing color palette
- All user-facing strings must use i18n keys, not hardcoded text
- Components should be single-file Vue components in `components/`

## What the app does (quick reference)

Arithmetic, word operators, variables, percentages (9 operations), math functions, trig, unit conversions (10 categories), 45+ currencies with live rates, date/time arithmetic, timezone conversion, sum/average aggregation, number format conversion, bitwise operations, and more. See the in-app help modal or `tests/useCalculator.test.js` for the full feature list with examples.

## License

GPLv3 — see [LICENSE](LICENSE) for details.
