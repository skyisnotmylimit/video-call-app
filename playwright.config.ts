import { defineConfig } from '@playwright/test'

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    use: {
        baseURL: externalBaseURL ?? 'http://localhost:5173',
        trace: 'retain-on-failure',
        launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
    },
    projects: [
        { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 950 } } },
        { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    ],
    webServer: externalBaseURL ? undefined : [
        {
            command: 'npm run build -w packages/contracts && npm run dev -w apps/api',
            url: 'http://localhost:3001/api/health',
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
        },
        {
            command: 'npm run dev -w apps/web',
            url: 'http://localhost:5173',
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
        },
    ],
})