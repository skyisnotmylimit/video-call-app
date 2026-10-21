# Deployment

Run all commands from the repository root. The recommended deployment is one Vercel project containing the Vite and NestJS services. LiveKit Cloud, or your own LiveKit server, carries the audio/video; the API only issues room-scoped tokens.

## Recommended: One Vercel Project with Services

The root `vercel.json` uses [Vercel Services](https://vercel.com/docs/services), currently in Beta, to build both apps independently in one deployment with shared environment settings and one public domain. It replaces the previous per-app configurations and two-project deployment instructions. LiveKit remains external; it is not a Vercel service.

### Services, Public Routing, and Bindings

| Service | Source root | Framework | Public exposure |
| --- | --- | --- | --- |
| `api` | `apps/api` | NestJS | `/api/*` |
| `web` | `apps/web` | Vite | All remaining paths |

Specific API rewrites run before the frontend catch-all. Vercel preserves the original request path: `/api/health` reaches NestJS as `/api/health`, matching `app.setGlobalPrefix('api')`. Unknown API routes return backend 404 responses rather than frontend HTML.

No service-level catch-all rewrite to `index.html` is needed: the current app navigates at `/` with meeting codes in `?room=...`. Such a rewrite can mask JavaScript modules during Vercel local development. Static files use normal Vite asset routing. If path-based client routing is introduced later, add and test an asset-safe fallback rather than rewriting every frontend request to HTML.

**No internal bindings are declared.** This was explicitly confirmed for the current architecture: the caller is browser JavaScript, not a function in `web`. The browser calls the public same-origin `/api/meetings` endpoint. Runtime binding variables cannot be used by static Vite bundles, during builds, or by middleware. Do not create or manually set an `API_URL` binding variable when there is no server-side consumer.

If a future feature introduces a server-side function that privately calls another service, declare all four binding fields (`type`, `service`, `format`, `env`) on that caller, and use the generated URL at function runtime. An internal-only API would also need a server-side proxy for the browser; it is not the current setup.

### 1. Create One Vercel Project

Push the repository to your Git provider without local environment files. Import it once into Vercel:

- Root Directory: the repository root, not either app subdirectory.
- Framework preset: Services, or allow detection from the root configuration.
- Node.js version: 24.x.
- Do not add top-level build/install/output overrides; those settings belong to each service in `vercel.json`.
- Keep the repository-wide workspace files, `packages/contracts`, and `tools` available during builds.

Each service's install command runs `npm ci` from the workspace root, and its build command compiles the shared contracts before its own app. The `web` output directory is `dist`, relative to its service root. Vercel detects the backend using its explicit `src/main.ts` entrypoint. There is no need for a custom serverless handler, Docker deployment, separate start command, or manual `PORT` setting on Vercel.

### 2. Set Environment Variables

Add these values in the single project's Environment Variables settings for each deployment environment you use:

```dotenv
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-actual-api-key
LIVEKIT_API_SECRET=your-actual-api-secret
```

Keep these values server-side. Shared project environment settings do not mean secrets should be embedded in the frontend; never prefix LiveKit keys or secrets with `VITE_`. Do not commit local environment files. Rotate any credentials accidentally disclosed in chat, logs, or source control.

Remove the old absolute `VITE_API_BASE_URL` value from the earlier two-project setup, or set it to `/api`. When it is unset, the existing client already defaults to `/api`. It must not point to localhost, an old backend project, or an internal binding URL.

The frontend and API share an origin, so their normal requests do not require cross-origin permissions. `FRONTEND_URL` is only needed to configure CORS for separately hosted clients; if used, set it to an exact trusted origin without a trailing slash. Do not allow arbitrary preview-host wildcards.

Environment changes affect new deployments. Redeploy after changing them.

### 3. Develop with Actual Service Routing

```sh
npm ci
npm run dev:vercel
```

This builds contracts and runs the pinned Vercel CLI's `vercel dev --local`, starting the services together without cloud authentication. The CLI prints the public origin, normally `http://localhost:3000`. The backend still supports its ignored local environment file. Local mode does not download cloud environment values. Use authenticated `vercel dev` if you want Vercel to load linked project settings and cloud variables. Bindings, if added later, are injected by Vercel; do not synthesize them yourself.

The original `npm run dev` remains available for two-port framework development. Its localhost proxy is development-only and is not used for Vercel's public service routing.

To run the browser suite against the running services, set `PLAYWRIGHT_BASE_URL` to the printed Vercel origin and run `npm run test:e2e`. For example, in PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3000'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

### 4. Deploy and Verify

Deploy once from the repository root using Vercel's Git integration or the linked CLI. Check `https://your-domain.vercel.app/api/health` returns `{"status":"ok"}`. Open the same domain at `/`, create a meeting, and join its invitation link from another browser/device. Check audio/video, mute controls, screen sharing, and leave/rejoin. An HTTP health response does not verify media transport.

Preview frontend/API traffic stays on the same preview origin. Deployment Protection still applies to that project's public routes; configure access according to your audience. No separate backend preview URL or browser-exposed protection-bypass secret is needed.

Vercel Function duration, concurrency, and plan limits apply to API requests, but meeting media does not pass through these functions. The in-memory API throttle is per instance, not a global serverless abuse limit. Configure Vercel Firewall rate limits or shared throttling before opening unrestricted meeting creation publicly.

Local validation does not publish a deployment. Your Git repository, Vercel account settings, cloud environment variables, and successful deployment remain necessary.

### Backend Module Format

The NestJS package intentionally uses `"type": "commonjs"` with TypeScript's `NodeNext` compilation. This emits a CommonJS-compatible `main.js`, matching the deployed Vercel loader even when its function bundle does not retain an ESM package scope. The frontend and contracts package remain ESM; the backend can load the contracts with the required Node.js 24 runtime.

If runtime logs show `Cannot use import statement outside a module` at `main.js`, the failure happens during backend startup, before LiveKit credentials are read. Deploy the current backend package configuration and rebuild without the previous build cache to replace the stale ESM artifact. Confirm `/api/health` returns 200 before testing meeting creation.

## Backend: Render, Railway, or a Container Host

- Build: `npm ci && npm run build -w packages/contracts && npm run build -w apps/api`
- Start: `npm run start:api`
- Health endpoint: `/api/health`
- Set `NODE_ENV=production`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `FRONTEND_URL` to your exact frontend origin, without a trailing slash. The host can set `PORT`.

Use Node.js 24 LTS. Keep the whole workspace available during the build, including `tools`, because the contracts and API builds share the TypeScript cleanup utility. Each build removes its own previous output to avoid shipping obsolete files after source moves.

## Docker

Keep the repository root as the build context, even though the Dockerfile belongs to the backend:

```sh
docker build -f apps/api/Dockerfile -t gather-api .
docker run --env-file apps/api/.env -p 3001:3001 gather-api
```

The image uses a multi-stage build, production dependencies, and a non-root runtime user. It does not contain your environment file. TLS should terminate at your hosting platform or reverse proxy.

The image has not been built locally because the Docker Linux daemon was unavailable. Start Docker Desktop before running these commands.

## Alternative Frontend Hosting: Netlify

The root `netlify.toml` builds the frontend and publishes `apps/web/dist`.

For a separately hosted frontend:

- Set `VITE_API_BASE_URL=https://your-backend.example.com/api` **before building**.
- Build: `npm run build -w packages/contracts && npm run build -w apps/web`.
- Publish/output directory: `apps/web/dist`.
- Set the backend's `FRONTEND_URL` to the deployed frontend's origin. Redeploy after changing environment variables.

Only public configuration belongs in `VITE_` variables. Keep all LiveKit credentials on the backend. Environment templates remain in each application's root; local environment files are ignored by Git and Docker.

## HTTPS and Media Connectivity

Use HTTPS for both apps. Camera, microphone, screen sharing, and clipboard APIs require a secure browser context (localhost is allowed for development). If you self-host LiveKit, configure its public hostname, TLS, UDP ports, and TURN connectivity per the [LiveKit deployment guide](https://docs.livekit.io/home/self-hosting/deployment/).

## Production Checks

- Run unit tests, lint/type checks, production builds, and browser regression tests before deploying.
- Validate real multi-participant audio/video, device toggles, screen sharing, and leave/rejoin with your configured LiveKit project and separate browser/devices.
- Configure trusted proxy/IP handling and edge rate limiting for your host. The current NestJS limiter is process-local; a multi-replica deployment needs shared throttling or an edge gateway.
- Decide the abuse/quota policy for anonymous meeting creation. CORS is not authentication. Add authentication or host admission controls when stronger access protection is required.
- Check LiveKit quotas and capacity. The current API sets a 20-participant room limit.

The source folder reorganization does not make these operational checks optional. See the root [README](../README.md) for current scope and security limitations.