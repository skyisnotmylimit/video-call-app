# Gather

A minimal video meeting app built with **Vite + React + TypeScript** and a **NestJS + TypeScript** backend. LiveKit provides WebRTC media transport, signaling, and connectivity across networks. Next.js is not used.

## First Run

Use Node.js 24 LTS (minimum 22.12) and npm.

1. Run `npm ci` in the repository root.
2. Create a [LiveKit Cloud](https://cloud.livekit.io/) project, or run your own LiveKit server.
3. Create `apps/api/.env` using `apps/api/.env.example` and enter your LiveKit URL, API key, and secret. Keep credentials on your machine and hosting platform, not in source control or frontend variables.
4. Run `npm run dev` from the root.
5. Open **http://localhost:5173**. The API runs at **http://localhost:3001/api**.

The home screen and local camera/microphone preview work without LiveKit credentials. Creating or joining a connected meeting requires a reachable, configured LiveKit server. The app shows an actionable error if it is not configured.

## Meeting Flow

- **New meeting** opens the local device preview. Enter your name, choose devices, and start the meeting.
- The connected meeting shows a share panel with a generated `xxxx-xxxx-xxxx` code and a copyable invitation link.
- Other people enter the code on the home screen or open the invitation link, preview their devices, and join.
- The call provides microphone and camera toggles, device menus, participant video tiles, screen sharing, chat, and a leave button through LiveKit's React components.
- Leave returns to a screen with home and rejoin actions. Device tracks are released when the preview or call unmounts.

Rooms allow up to 20 participants in this initial version. A newly created empty room expires after 10 minutes; a room is removed approximately 60 seconds after its last participant leaves. Codes are temporary, not scheduled meeting reservations. A token is valid for joining for 15 minutes; an established connection is not ended at that time.

## Architecture

The npm workspace separates deployable apps (`apps/web`, `apps/api`), shared API contracts (`packages/contracts`), cross-app browser tests (`tests/e2e`), documentation (`docs`), and shared build tools (`tools`).

The frontend uses app/pages/features/shared boundaries. The NestJS backend uses feature modules with application, domain, infrastructure, and presentation layers where needed. Unit tests live beside their owning implementation, and shared schemas retain a stable public package entry point.

See [Project Architecture](docs/architecture.md) for the source tree, dependency rules, and how to add features.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build contracts and run both apps |
| `npm run build` | Build contracts, frontend, and backend |
| `npm test` | Run domain and API-client unit tests |
| `npm run lint` | Lint frontend and type-check backend/build tools |
| `npx playwright install chromium` | Install the browser once |
| `npm run test:e2e` | Run desktop/mobile browser regression tests |
| `npm run start:api` | Run the built NestJS server |

After editing shared contracts, run `npm run build -w packages/contracts` (or restart `npm run dev`). Never commit `.env` files or include LiveKit secrets in any `VITE_` variable. Vite variables are public and are embedded at build time.

## Deployment

See the [Deployment Guide](docs/deployment.md) for backend hosting, the Docker build, frontend hosting, environment variables, and production checks. Existing root commands, API URLs, environment file locations, and Docker build paths are unchanged.

## Security and Scope

This first iteration uses anonymous, code-based access: anyone with a code can join, and all participants can publish media. Codes are cryptographically random and contain 12 characters from a 31-character alphabet; tokens are signed server-side, short-lived, and restricted to one room. Credentials and tokens are never written to browser storage by application code. Display names and local device preferences may be persisted by the preview component.

The API limits meeting requests to 30 per minute per client address per instance and accepts at most 4 KB of JSON per request. Behind a reverse proxy, configure a trusted proxy/IP policy and edge rate limiting for your hosting environment; do not blindly trust forwarded IP headers. CORS restricts browser origins but is not authentication. Before a public launch, choose your abuse/quota policy and add authentication or host admission controls if meetings need stronger access protection.

Account management, scheduled rooms, recordings, a persistent database, and host moderation are intentionally outside this first iteration. Calls use WebRTC transport encryption; application-level end-to-end encryption is not configured. External Google Fonts and an Unsplash image are used on the home screen; self-host these assets if your deployment requires no external asset requests.

## Verification

The domain and HTTP-client tests cover generated codes, existing/missing rooms, validation, unique identities, malformed responses, and request failures. Browser tests cover create/join preview, camera/microphone toggles, invite links, error recovery, and desktop/mobile overflow using fake local media devices and controlled API error responses.

**Real multi-participant audio/video, cross-network connectivity, and deployed infrastructure must still be verified with your LiveKit project.** To check: create a meeting in one browser, join its code in another browser/device, confirm both video and audio, toggle each device, test screen sharing, and leave/rejoin. Browser tests do not pretend that mocked API responses verify real media transport.

Container validation limitations are recorded in the [Deployment Guide](docs/deployment.md).