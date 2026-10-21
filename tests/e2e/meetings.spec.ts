import { expect, test } from '@playwright/test'

test('backend is healthy and rejects malformed meeting requests', async ({ request }) => {
    const health = await request.get('/api/health')
    expect(health.status()).toBe(200)
    expect(await health.json()).toEqual({ status: 'ok' })
    const invalid = await request.post('/api/meetings', { data: { action: 'join', displayName: 'Taylor', code: 'invalid-code' } })
    expect(invalid.status()).toBe(400)
    expect((await invalid.json()).message).toContain('valid meeting code')
    expect(invalid.headers()['cache-control']).toBe('no-store')
    const oversized = await request.post('/api/meetings', { data: { action: 'create', displayName: 'a'.repeat(5000) } })
    expect(oversized.status()).toBe(413)
})

test('home screen validates codes without leaving the page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Join', exact: true })).toBeDisabled()
    await page.getByRole('textbox', { name: 'Meeting code' }).fill('bad-code')
    await page.getByRole('button', { name: 'Join', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('valid meeting code')
    await expect(page.getByRole('heading', { name: 'Video meetings. A little closer.' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('new meeting offers device controls and handles service errors', async ({ page }) => {
    let requestBody: unknown
    await page.route('**/api/meetings', async (route) => {
        requestBody = route.request().postDataJSON()
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Video service is not configured.' }) })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'New meeting' }).click()
    await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start meeting', exact: true })).toBeDisabled()
    const microphone = page.getByRole('button', { name: 'Microphone', exact: true })
    const camera = page.getByRole('button', { name: 'Camera', exact: true })
    await expect(microphone).toHaveAttribute('aria-pressed', 'true')
    await microphone.click()
    await expect(microphone).toHaveAttribute('aria-pressed', 'false')
    await camera.click()
    await expect(camera).toHaveAttribute('aria-pressed', 'false')
    await page.getByRole('textbox', { name: 'Your name' }).fill('Taylor')
    await page.getByRole('button', { name: 'Start meeting', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('not configured')
    expect(requestBody).toEqual({ action: 'create', displayName: 'Taylor' })
    await expect(page.getByRole('button', { name: 'Start meeting', exact: true })).toBeEnabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('joining uses the entered meeting code', async ({ page }) => {
    let requestBody: unknown
    await page.route('**/api/meetings', async (route) => {
        requestBody = route.request().postDataJSON()
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'This meeting was not found or has ended.' }) })
    })
    await page.goto('/')
    await page.getByRole('textbox', { name: 'Meeting code' }).fill('ABCD-EFGH-JKMN')
    await page.getByRole('button', { name: 'Join', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Ready to join?' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Your name' }).fill('Sam')
    await page.getByRole('button', { name: 'Join meeting', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('not found')
    expect(requestBody).toEqual({ action: 'join', displayName: 'Sam', code: 'abcd-efgh-jkmn' })
})

test('shared links open the preview and back returns home', async ({ page }) => {
    await page.goto('/?room=abcd-efgh-jkmn')
    await expect(page.getByRole('heading', { name: 'Ready to join?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Join meeting', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page.getByRole('button', { name: 'New meeting' })).toBeVisible()
    await expect(page).toHaveURL('http://localhost:5173/')
})