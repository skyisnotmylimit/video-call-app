# Deployment

Run all commands from the repository root. Deploy the Vite frontend and NestJS backend separately. LiveKit Cloud, or your own LiveKit server, carries the audio/video; the API only issues room-scoped tokens.

## Recommended: Both Apps on Vercel

Vercel supports both [Vite](https://vercel.com/docs/frameworks/frontend/vite) and [NestJS](https://vercel.com/docs/frameworks/backend/nestjs). Deploy this repository as two Vercel projects, following its [monorepo workflow](https://vercel.com/docs/monorepos). The NestJS API becomes a Vercel Function; LiveKit handles the persistent media connections, not Vercel.

### 1. Connect the Repository

Push the project to your Git provider without local environment files. Import the same repository twice in Vercel:

| Setting | Backend project | Frontend project |
| --- | --- | --- |
| Suggested name | `gather-api` | `gather-web` |
| Root Directory | `apps/api` | `apps/web` |
| Framework | NestJS | Vite |
| Node.js version | 24.x | 24.x |
| Configuration | `apps/api/vercel.json` | `apps/web/vercel.json` |
| Output Directory | Leave framework default | `dist` |

For **both projects**, enable **Include source files outside of the Root Directory in the Build Step** in the Root Directory settings. The install/build commands intentionally run from the repository root so npm workspaces, `packages/contracts`, and `tools` are available. If this setting is not enabled, builds can fail to locate shared files. Keep the file-provided install/build commands rather than overriding them with the whole-repository build command.

### 2. Configure and Deploy the Backend

Add these values in the backend project's Environment Variables settings for Production:

```dotenv
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-actual-api-key
LIVEKIT_API_SECRET=your-actual-api-secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

Use your actual LiveKit values, not the example placeholders. `FRONTEND_URL` must be the exact frontend production origin without a trailing slash. If the frontend domain has not been assigned yet, update this value and redeploy the backend after creating the frontend project. Do not upload your local environment file or set these secrets in the frontend project.

Deploy the backend and check `https://your-backend-domain.vercel.app/api/health`; it should return `{"status":"ok"}`. Vercel manages the runtime and detects the existing `src/main.ts` NestJS entrypoint. No Docker deployment, custom handler, static output directory override, start command, or manually configured `PORT` is required for this Vercel project.

### 3. Configure and Deploy the Frontend

Set the following public variable in the frontend project **before building**:

```dotenv
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
```

Deploy the frontend. Its configuration compiles the contracts first, builds Vite, publishes `dist`, and provides the SPA fallback. Never put LiveKit API credentials in `VITE_` variables: those values are embedded in the browser bundle.

Confirm the backend's `FRONTEND_URL` matches the assigned frontend production origin and redeploy the backend if necessary. Vercel environment-variable changes affect new deployments; updating a value does not update an existing deployment.

### 4. Verify the Production URLs

Open the public frontend production URL, create a meeting, and join its invitation link from another browser/device. Check audio/video, mute controls, screen sharing, and leave/rejoin. An HTTP health response does not verify actual media transport.

Use stable production domains for this first deployment. Preview deployments have different origins and may have deployment protection enabled; they require separate API URL/CORS settings and, where applicable, protection bypass setup. Do not solve this by allowing arbitrary `*.vercel.app` origins or placing a protection-bypass secret in the frontend bundle. Ensure the API production domain is accessible to the users who will call it.

Vercel Function duration, concurrency, and plan limits apply to API requests, but meeting media does not pass through these functions. The current in-memory API throttle is per instance and is not a global abuse limit on a serverless platform. Configure Vercel Firewall rate limits or shared throttling before opening unrestricted meeting creation publicly.

The included commands are checked locally; deploying them on Vercel still requires your Git repository, Vercel project settings, environment variables, and a successful cloud deployment.

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

## Frontend: Netlify or Vercel

The root `netlify.toml` builds the frontend and publishes `apps/web/dist`.

For either host:

- Set `VITE_API_BASE_URL=https://your-backend.example.com/api` **before building**.
- Build: `npm run build -w packages/contracts && npm run build -w apps/web`.
- Publish/output directory: `apps/web/dist`.
- On Vercel, select the Vite framework preset and override the build command/output directory as above.
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