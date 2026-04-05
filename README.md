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
│   ├── useNotes.js            # Note persistence (Dexie/IndexedDB) and state
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

The app is a pure client-side SPA (`ssr: false` in `nuxt.config.ts`). All data is stored locally in IndexedDB via Dexie.js — there is no backend or database required for the current feature set.

### Key modules

- `useCalculator.js` — The core engine. Parses natural language input and evaluates arithmetic, percentages, unit conversions, currency exchange, date/time, variables, and aggregation (sum/average). This is where most of the logic lives and where most contributions will happen.
- `useCalcLanguage.js` — Registers a custom CodeMirror language (`calcnotes`) with syntax highlighting for numbers, operators, units, currencies, functions, and comments.
- `useNotes.js` — Manages multiple notes with auto-save to IndexedDB via Dexie.js.
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

## Security & authentication

Calc Notes supports optional cloud sync with end-to-end encryption (E2E). The design ensures the server never has access to plaintext note content or the user's raw password.

### Key derivation

From a single user password, two independent keys are derived client-side using PBKDF2-SHA256 (600 000 iterations), each with a distinct salt:

| Key | Purpose | Leaves the client? |
|---|---|---|
| `authKey` | Hex string sent to the server for authentication | Yes (server stores `bcrypt(authKey)`) |
| `encKey` | AES-256-GCM key used to encrypt/decrypt notes | Never |

```mermaid
flowchart LR
    PW[User password] --> PBKDF2a[PBKDF2 + AUTH_SALT]
    PW --> PBKDF2e[PBKDF2 + ENC_SALT]
    PBKDF2a --> AK[authKey — hex]
    PBKDF2e --> EK[encKey — AES-256-GCM CryptoKey]
    AK -->|sent to server| SRV[(Server: bcrypt hash)]
    EK -->|never leaves client| LOCAL[Client memory + sessionStorage]
```

### Registration & login

```mermaid
sequenceDiagram
    participant U as Browser
    participant S as Server

    Note over U: User enters email + password

    U->>U: authKey = PBKDF2(password, AUTH_SALT)
    U->>U: encKey = PBKDF2(password, ENC_SALT)

    alt Register
        U->>S: POST /api/auth/register { email, authKey }
        S->>S: store bcrypt(authKey)
        S-->>U: { token, user }
    else Login
        U->>S: POST /api/auth/login { email, authKey, password* }
        S->>S: verify bcrypt(authKey) or bcrypt(password)
        Note over S: *password sent only for legacy account migration
        S-->>U: { token, user }
    end

    U->>U: store JWT in IndexedDB
    U->>U: store exported encKey bytes in sessionStorage
```

On login the server tries `authKey` first. For legacy accounts (created before E2E), it falls back to the raw password and transparently upgrades the stored hash to `bcrypt(authKey)`.

### Session persistence across page refresh

The JWT token is persisted in IndexedDB and survives page refreshes. The `encKey` (raw AES-256 key bytes, base64-encoded) is stored in `sessionStorage`, which is tab-scoped and cleared when the tab/window closes.

On page load, `restore()` recovers the JWT from IndexedDB, validates it against the server (`GET /api/auth/me`), and re-imports the `encKey` from `sessionStorage`. If either is missing, the user must log in again.

```mermaid
flowchart TD
    LOAD[Page load / refresh] --> JWT{JWT in IndexedDB?}
    JWT -- No --> GUEST[Guest mode — local only]
    JWT -- Yes --> VERIFY[GET /api/auth/me]
    VERIFY -- 401 --> CLEAR[Clear token + key] --> GUEST
    VERIFY -- 200 --> KEY{encKey in sessionStorage?}
    KEY -- Yes --> IMPORT[Import AES key from bytes] --> READY[Sync enabled]
    KEY -- No --> NOSYNC[Logged in but sync paused — re-login required]
```

### Encryption format

All sensitive note fields (title, description, tags, content) are encrypted individually with AES-256-GCM before being sent to the server. Each encrypted field is a JSON string:

```json
{ "iv": "<base64 — 12-byte nonce>", "ct": "<base64 — ciphertext + 16-byte auth tag>" }
```

The server stores these opaque strings as-is. Non-sensitive fields (clientId, sortOrder, timestamps) pass through unencrypted.

### Sync flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>C: encrypt all local notes with encKey
    C->>S: POST /api/notes/sync { notes, deletedClientIds, lastSyncedAt }
    S->>S: upsert encrypted blobs, soft-delete, pull all active
    S-->>C: { pushed, pulled, deletedClientIds, syncedAt }
    C->>C: decrypt pulled notes with encKey
    C->>C: merge into local state, save to IndexedDB (plaintext)

    Note over C: Local IndexedDB stores plaintext for offline use
    Note over S: Server only ever sees encrypted blobs
```

Sync triggers: immediate on create/delete/reorder, debounced (3 s) on edits, 2-minute interval, and SSE push from other clients.

### Password change

Password change re-encrypts all notes atomically:

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>C: derive oldEncKey + newEncKey from old/new passwords
    C->>C: derive oldAuthKey + newAuthKey

    loop Each note
        C->>C: decrypt with oldEncKey
        C->>C: encrypt with newEncKey
    end

    C->>S: PUT /api/auth/password { currentAuthKey, newAuthKey, reEncryptedNotes }
    S->>S: verify currentAuthKey, update hash to bcrypt(newAuthKey)
    S->>S: overwrite all notes with re-encrypted data
    S-->>C: { updated: true }
    C->>C: logout — user must re-login with new password
```

### Shared notes

Shared notes use a completely separate key derived from a share-specific password (user-chosen or randomly generated) with its own PBKDF2 salt (`SHARE_SALT`). This key is independent from the user's personal `encKey`.

### Legacy migration

On the first sync after E2E deployment, the client detects unencrypted (legacy) notes from the server by checking whether the `content` field parses as a `{ iv, ct }` JSON object. Legacy notes are used as-is locally and then re-uploaded encrypted in a one-time migration pass with a progress indicator.

### Known security limitations

The following items are known trade-offs or areas for future improvement:

1. **Hardcoded PBKDF2 salts** — The three salts (`AUTH_SALT`, `ENC_SALT`, `SHARE_SALT`) are static strings compiled into the client bundle. Ideally, salts should be per-user and stored server-side. This is acceptable for now because the salts serve to domain-separate the three derived keys (not to prevent rainbow tables — PBKDF2's iteration count handles that), but per-user salts would be stronger.

2. **Derived key in sessionStorage** — The raw AES-256 key bytes are stored in `sessionStorage` (base64-encoded) to survive page refreshes. While `sessionStorage` is tab-scoped and not shared across tabs or persisted to disk, it is accessible to any JavaScript running in the same origin. An XSS vulnerability could exfiltrate the key. Alternatives considered:
   - Non-extractable CryptoKey (original approach) — prevents export but is lost on refresh, breaking sync.
   - IndexedDB with CryptoKey objects — some browsers support storing non-extractable CryptoKeys in IndexedDB, but support is inconsistent.
   - Service Worker vault — would isolate the key from the main thread but adds significant complexity.

3. **No key rotation mechanism** — There is no periodic key rotation. The `encKey` only changes when the user changes their password. A future improvement could introduce versioned keys.

4. **Server-side note metadata exposure** — While note content fields are encrypted, the server can still observe: number of notes, note sizes, timestamps, sort order, and sync frequency. A padding or fixed-size scheme could mitigate size-based analysis.

5. **JWT in IndexedDB** — The JWT is stored in IndexedDB (not httpOnly cookie) because the app is a client-side SPA that calls the API directly. This means the token is accessible to JavaScript and vulnerable to XSS. The token has an expiry, but there is no refresh token rotation yet.

6. **Legacy password fallback** — During the migration period, the login endpoint accepts both `authKey` and raw `password`. The raw password is sent over TLS but does reach the server. Once all accounts are migrated, the raw password fallback should be removed.

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
