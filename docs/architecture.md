# Project Architecture

## Workspace Layout

```text
apps/
  api/
    src/
      modules/
        health/
          health.controller.ts
          health.module.ts
        meetings/
          application/
            meeting.service.ts
            meeting.service.test.ts
          domain/
            meeting.errors.ts
            meeting.gateway.ts
          infrastructure/
            livekit.gateway.ts
          presentation/
            meetings.controller.ts
          meetings.module.ts
      app.module.ts
      main.ts
    Dockerfile
    .env.example
    package.json
    tsconfig.json
  web/
    src/
      app/
        App.tsx
      pages/
        home/HomePage.tsx
        meeting-preview/MeetingPreviewPage.tsx
        meeting-ended/MeetingEndedPage.tsx
      features/
        meetings/
          api/
            meeting-api.ts
            meeting-api.test.ts
          components/
            CallHeader.tsx
            CallRoom.tsx
            MeetingPreview.tsx
          model/
            meeting-api.ts
      shared/
        layouts/AppLayout.tsx
        ui/Loading.tsx
      main.tsx
      styles.css
    .env.example
    index.html
    package.json
    vite.config.ts
packages/
  contracts/
    src/
      meetings/
        meeting.schemas.ts
        meeting.schemas.test.ts
      index.ts
docs/
  architecture.md
  deployment.md
tests/
  e2e/meetings.spec.ts
tools/
  clean-build.ts
  tsconfig.json
package.json
package-lock.json
playwright.config.ts
vitest.config.ts
netlify.toml
```

Generated output, installed dependencies, local environment files, reports, and editor settings are omitted. Build configuration stays with the app or package it configures. Repository-wide test configuration and orchestration remain at the root so default discovery and existing commands work normally. The backend Dockerfile remains with the backend, with the repository root as its build context.

## Backend Boundaries

- **`main.ts`** bootstraps HTTP: CORS, JSON payload limits, response headers, listening, and shutdown.
- **`app.module.ts`** composes feature modules and global configuration/throttling. It does not contain endpoint implementations.
- **`modules/<feature>/presentation`** owns HTTP controllers, request validation, and HTTP error mapping.
- **`modules/<feature>/application`** owns use cases. `MeetingService` implements room creation/joining and depends on the `MeetingGateway` interface.
- **`modules/<feature>/domain`** owns provider-independent interfaces and errors. It imports neither NestJS nor LiveKit.
- **`modules/<feature>/infrastructure`** implements integrations. `LiveKitGateway` handles the LiveKit SDK and credentials.
- **`<feature>.module.ts`** wires implementations with NestJS factory providers. Adding a provider does not require changing the use case or controller.

The health feature is intentionally flat because two small HTTP-only files do not need four empty layer folders. Give new features only the layers they actually need.

```text
HTTP controller -> application service -> domain interface
LiveKit adapter ------------------------> domain interface
NestJS module wires the concrete adapter into the service
```

Presentation maps neutral application errors to HTTP responses; it does not import the LiveKit implementation. No custom dependency container, generic repository, or base service class is needed for the current domain.

## Frontend Boundaries

- **`app`** composes navigation and application-level screen state. It does not implement page markup or HTTP requests.
- **`pages`** composes complete screens from feature components and shared UI.
- **`features/<feature>/components`** implements feature behavior and rendering. The preview accepts the `MeetingApi` interface so it can be tested independently of HTTP.
- **`features/<feature>/api`** implements remote API access and validates requests/responses against shared schemas.
- **`features/<feature>/model`** holds feature-level types and ports, rather than concrete API clients.
- **`shared`** contains genuinely reusable, domain-independent UI and layouts. It must not import meeting features, pages, or app navigation.
- **`styles.css`** is the existing global theme and stylesheet. Feature-specific styles can be colocated with components as those features grow; no visual redesign is part of this reorganization.

Dependencies flow from app to pages to features/shared. Features must not import pages or app wiring. Extract cross-feature primitives to `shared` only when there is real reuse. Use direct file imports inside the frontend rather than creating barrel files for every directory.

## Shared Contracts

`packages/contracts` is the only shared application package. It contains runtime schemas and inferred TypeScript types grouped by feature. It has no React, NestJS, or provider dependencies.

`src/index.ts` is its explicit public entry point. Both apps import `@gather/contracts`, not another app's source files or private package paths. Internal layout changes must preserve this public API or be handled as an intentional contract change.

## Testing and Builds

- Unit tests are colocated as `*.test.ts` beside the behavior they cover.
- Schema tests live in the contracts package, not in the backend.
- Browser/API workflows live in `tests/e2e` because they exercise the running apps together.
- Vitest discovers tests in both app and package source directories.
- Backend and contracts production builds exclude unit tests and clean their `dist` directories before compiling. Vite cleans frontend output during its build.
- `tools/clean-build.ts` is the shared cross-platform build cleanup tool. Build scripts execute it with Node's TypeScript stripping flag, supported by the project's Node requirement.
- Build tools have their own Node TypeScript configuration and are type-checked by the root lint command.

Run `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` from the repository root. Backend and contracts entry points remain stable, so startup commands do not depend on internal feature folder names.

## Adding a Feature

1. Define shared request/response schemas under `packages/contracts/src/<feature>` only if the feature crosses the API boundary, then export the intended public API from `src/index.ts`.
2. Add a backend feature module under `apps/api/src/modules/<feature>` and register it in `app.module.ts`. Keep external SDKs behind interfaces where substitution/testing is useful.
3. Add frontend feature code under `apps/web/src/features/<feature>` and compose screens under `pages`. Keep only navigation in `app`.
4. Add colocated unit tests and extend `tests/e2e` when user workflows change.
5. Update deployment documentation only if runtime configuration or infrastructure changes.

Do not pre-create placeholder directories for databases, jobs, authentication, stores, or hooks. Introduce them when their first implementation has an actual owner. Folder boundaries support maintainability, but they do not replace authentication, observability, operational testing, or the production-readiness work documented in the [deployment guide](deployment.md).