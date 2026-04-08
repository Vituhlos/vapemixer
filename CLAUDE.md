# VapeMixer Context

## High-Level Summary

VapeMixer is a self-hosted DIY e-liquid calculator built as a mobile-first PWA.

Core product areas:
- calculator for base / booster / flavor amounts
- recipe save/load/edit/export
- stock tracking for supplies
- mixing history with reload back into the calculator
- mobile-friendly PWA behavior

Primary goal of the app:
- feel good on a phone
- stay simple enough for daily personal use
- run easily as a self-hosted Docker app

## Tech Stack

- Frontend: React 19 + Vite
- Styling: Tailwind 4 + custom CSS tokens + many inline styles
- Backend: Node.js + Express 5
- Database: SQLite via `better-sqlite3`
- Packaging: Docker multi-stage build
- Deployment targets in repo:
  - normal Docker
  - Docker Compose
  - Unraid Compose
  - Unraid Community Applications template

## Current Project Structure

- `client/`
  Frontend app.

- `server/`
  Express API and SQLite logic.

- `unraid/`
  Unraid CA XML template and companion documentation.

- `Dockerfile`
  Multi-stage production build.

- `docker-compose.yml`
  Generic container run.

- `docker-compose.unraid.yml`
  Unraid Compose Manager variant.

- `package.json`
  Root convenience scripts for running client + server together.

## Important Frontend Files

- `client/src/App.jsx`
  Main shell, tab switching, centered mobile-width layout, calculator hook ownership.

- `client/src/hooks/useCalculator.js`
  Persistent calculator state in `localStorage`, recipe/history loading into the calculator.

- `client/src/lib/calc.js`
  Pure calculator logic extracted for testability.

- `client/src/lib/calc.test.js`
  Frontend calculator tests.

- `client/src/screens/Calculator.jsx`
  Main calculator screen orchestration.

- `client/src/components/calculator/CalculatorParameterCard.jsx`
  Volume, flavor, nicotine, booster input UI.

- `client/src/components/calculator/BaseSectionCard.jsx`
  MTL / DL / custom base selection UI.

- `client/src/components/calculator/ResultSectionCard.jsx`
  Result display and warnings.

- `client/src/components/calculator/SaveRecipeCard.jsx`
  Recipe save UI.

- `client/src/components/calculator/MixConfirmSheet.jsx`
  Confirmation sheet for logging mix and optionally deducting stock.

- `client/src/screens/Recipes.jsx`
  Listing, duplication, export, and edit sheet for recipes.

- `client/src/screens/Stock.jsx`
  Add/edit/import/export and quick quantity adjustments for stock.

- `client/src/screens/History.jsx`
  History list, clear-all, reload into calculator, search, and "today" filter.

- `client/src/components/StatusMessage.jsx`
- `client/src/components/StatusStack.jsx`
  Shared UI for error / warning / success states.

- `client/src/api.js`
  Thin fetch wrapper with custom `ApiError`.

- `client/src/index.css`
  Design tokens and base styling.

## Important Backend Files

- `server/app.js`
  App factory used for tests and future cleaner server composition.

- `server/index.js`
  Production / runtime bootstrap.

- `server/db.js`
  SQLite bootstrap, schema version tracking, table creation, seed data.

- `server/middleware/validate.js`
  Request validation helpers for recipes / stock / history / mix.

- `server/routes/recipes.js`
  CRUD for recipes.

- `server/routes/stock.js`
  CRUD for stock.

- `server/routes/history.js`
  History list, add, delete single, delete all.

- `server/routes/mix.js`
  Transactional route:
  - inserts history
  - optionally deducts stock atomically
  - returns updated stock when deduction is used

- `server/tests/api.test.js`
  Backend API tests using `supertest`.

## Data Model Overview

Tables in SQLite:

- `recipes`
  Stored recipe presets.

- `stock`
  User inventory.
  Valid `type` values:
  - `baze_mtl`
  - `baze_dl`
  - `booster_mtl`
  - `booster_dl`
  - `prichut`

- `history`
  Logged mixes.

- `app_meta`
  Stores schema version metadata.

Seed behavior:
- one sample recipe is inserted on first run
- base and booster stock defaults are inserted on first run

## API Overview

Base path:
- `/api`

Routes:

- `GET /api/recipes`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

- `GET /api/stock`
- `POST /api/stock`
- `PUT /api/stock/:id`
- `DELETE /api/stock/:id`

- `GET /api/history`
- `POST /api/history`
- `DELETE /api/history`
- `DELETE /api/history/:id`

- `POST /api/mix`
  Main transactional route for logging a mix and optionally deducting stock.

## Dev Workflow

Root scripts:
- `npm install`
- `npm run dev`
- `npm run dev:server`
- `npm run dev:client`
- `npm run build`
- `npm run test`

Frontend only:
- `cd client`
- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`

Backend only:
- `cd server`
- `npm install`
- `npm run dev`
- `npm test`

## Runtime Notes

- Frontend expects API under `/api`.
- Vite dev server proxies `/api` to `http://localhost:3333`.
- Backend default port is `3333`.
- SQLite DB path defaults to `/app/data/vapemixer.db`.
- The app is centered with a mobile-like max width in `App.jsx`.
- Production static serving only happens when `NODE_ENV=production`.
- This was explicitly fixed in `Dockerfile`.

## Local Development Notes

Important recent change:
- `better-sqlite3` was upgraded to `^12.8.0` to improve local Windows installation.

Why this matters:
- earlier local setup hit native build / compatibility issues
- current local backend install now works in a normal Windows dev setup

Root convenience:
- root `npm run dev` uses `concurrently` to start client + server together

Known caveat:
- some scripted process-management checks on Windows can show weird exit codes when background processes are killed artificially
- normal manual terminal use is fine

## Docker / Production Notes

- Docker build was validated after fixing `NODE_ENV=production`.
- A real runtime issue previously existed where `/` returned `404` because frontend serving only happened in production mode.
- That issue is already fixed in the current `Dockerfile`.

If production behavior looks wrong again:
1. check `Dockerfile`
2. check `NODE_ENV`
3. check `server/app.js`
4. verify `client/dist` exists in image

## UI / UX Notes

Design direction:
- mobile-first
- centered app panel on large screens
- intentionally app-like, not a generic desktop admin layout

Current desktop behavior:
- app shell is constrained to a centered narrow column
- this already gives a mobile-app feel on desktop

Potential future refinement:
- move more shell layout from inline styles into CSS/media queries
- add stronger desktop framing / background treatment if desired
- keep mobile full-bleed behavior intact

## Recent Major Changes Already Completed

These are already done in the current codebase:

- calculator split into smaller components
- reusable shared status UI added
- history search and "today" filter added
- root one-command dev workflow added
- app factory introduced on backend
- transactional mix route added
- structured JSON parse error handling added
- frontend calculator tests added
- backend API tests added
- Docker production serving issue fixed
- local Windows backend install improved
- Unraid CA template added
- Unraid companion documentation added

## Testing State

Verified recently:
- `npm test` in `client` passes
- `npm run build` in `client` passes
- `npm test` in `server` passes
- Docker build passes
- Docker runtime smoke test previously validated key API and frontend serving

Primary test files:
- `client/src/lib/calc.test.js`
- `server/tests/api.test.js`

## Known Gotchas

1. The UI still uses a lot of inline styles.
This is not broken, but it means visual refactors can still be noisy.

2. `App.jsx` still owns some top-level layout behavior inline.
Good enough for now, but likely future cleanup candidate.

3. `server/db.js` has schema versioning, but not a full file-per-migration system yet.
It is a step forward, not a final migration framework.

4. Generated icons exist in `client/public/`.
They are part of current build workflow and should not be casually removed.

5. Root `npm run test` currently proxies to client tests only.
Backend tests still live under `server`.
If someone wants a true monorepo-wide test command, root scripts should be expanded.

## Unraid Notes

Files:
- `unraid/vapemixer.xml`
- `unraid/README.md`

Manual template destination on Unraid:
- `/boot/config/plugins/dockerMan/templates-user/`

Example SCP destination:
- `root@<unraid-ip>:/boot/config/plugins/dockerMan/templates-user/`

Known user example:
- `scp "...\\unraid\\vapemixer.xml" root@192.168.1.114:/boot/config/plugins/dockerMan/templates-user/`

Current CA template includes:
- image repository
- project/support/readme/template URLs
- icon URL
- bridge networking
- port mapping
- persistent AppData path
- timezone variable

## Git / Commit Context

Recent commits:
- `70e89d9` Add Unraid CA template and companion docs
- `cd2a9e6` Refactor calculator + local dev + tests
- `767a22b` Add README
- `da2dde1` Initial commit

Style preference observed from the user:
- commit titles should be meaningful, not generic
- commit bodies should explain grouped changes in a readable format
- the user explicitly prefers a "nice" commit style similar to well-written GitHub commits with short sections

## Good Next Steps For Future Work

If continuing development, likely high-value next steps are:

- expand backend API coverage
- improve migration structure in `server/db.js`
- refine desktop shell presentation
- reduce remaining inline-style duplication
- possibly unify root tests to include both client and server
- potentially add support-thread text / CA submission polish for Unraid publishing

## Suggested Backlog For Claude

This is a practical backlog list based on current project state and likely user value.

### High Priority

- Match stock flavors by recipe flavor name instead of treating all `prichut` stock as one shared pool.
- Add user preferences for default values such as:
  - default volume
  - default booster strength
  - default base type
  - default flavor percentage
- Add an undo or reversal flow for stock deduction after logging a mix.
- Add recipe organization:
  - favorites
  - simple tags or categories like `MTL`, `DL`, `fruit`, `tobacco`
- Improve desktop presentation around the centered mobile layout so it feels intentional on large screens.

### Medium Priority

- Add recipe import/export parity similar to stock import/export.
- Add history import/export or full backup/restore for the whole app data set.
- Add a direct “mix from recipe” action that goes straight from recipe to mix confirmation.
- Add a user setting for stock deduction behavior:
  - always ask
  - deduct automatically
  - never deduct
- Improve empty states with stronger next actions, for example:
  - add first stock item
  - create first recipe
  - return to calculator

### Lower Priority But Useful

- Add cost calculation per mix if stock items later gain optional price metadata.
- Add low-stock intelligence such as “enough for N more mixes”.
- Add a better PWA update notification / refresh prompt.
- Expand the history filter beyond search + today, for example by recipe or date range.

### Architectural Improvements

- Move from inline migration logic in `server/db.js` toward explicit migration files.
- Continue reducing duplicated inline styles where reuse is obvious.
- Expand root-level scripts so root `npm run test` covers both frontend and backend.
- Add more backend API tests around stock deduction edge cases and validation failures.

### Practical Recommendations

If choosing only 5 next improvements, the recommended order is:

1. Flavor-to-stock matching by name
2. User default preferences
3. Undo for stock deduction
4. Recipe favorites / tags
5. Better desktop shell polish

## Guidance For Another Agent

If you need to continue quickly:

1. Read `README.md`
2. Read `CLAUDE.md`
3. Inspect:
   - `client/src/App.jsx`
   - `client/src/screens/Calculator.jsx`
   - `client/src/components/calculator/*`
   - `server/app.js`
   - `server/routes/mix.js`
4. Run:
   - `npm test --prefix client`
   - `npm test --prefix server`
   - `npm run build --prefix client`
5. Use Docker to validate production behavior if the task touches serving or deployment

## Practical Rule Of Thumb

When changing behavior:
- if it is pure calculation logic, touch `client/src/lib/calc.js` and tests first
- if it is orchestration between stock/history/calculator, inspect `server/routes/mix.js`
- if it is layout or navigation, start at `client/src/App.jsx`
- if it is persistence or schema, start at `server/db.js`
- if it is Unraid-specific, inspect `unraid/`
