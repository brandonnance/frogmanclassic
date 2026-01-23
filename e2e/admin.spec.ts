import { test, expect } from '@playwright/test'

test.describe('Admin Login', () => {
  test('redirects to login page when not authenticated', async ({ page }) => {
    await page.goto('/admin')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('shows login form', async ({ page }) => {
    await page.goto('/admin/login')

    // Page elements
    await expect(page.getByRole('heading', { name: 'Admin Access' })).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  test('has back to home link', async ({ page }) => {
    await page.goto('/admin/login')

    const homeLink = page.getByRole('link', { name: /Back to home/i })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('href', '/')
  })

  test('shows error for invalid password', async ({ page }) => {
    await page.goto('/admin/login')

    // Enter wrong password
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Should show error
    await expect(page.getByText(/Invalid password/i)).toBeVisible({ timeout: 5000 })
  })

  test('password field clears after failed attempt', async ({ page }) => {
    await page.goto('/admin/login')

    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Wait for error
    await expect(page.getByText(/Invalid password/i)).toBeVisible({ timeout: 5000 })

    // Password field should be cleared
    await expect(page.getByLabel('Password')).toHaveValue('')
  })

  test('shows loading state while checking password', async ({ page }) => {
    await page.goto('/admin/login')

    await page.getByLabel('Password').fill('testpassword')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Button should show loading state
    await expect(page.getByRole('button', { name: /Checking/i })).toBeVisible()
  })

  test('password field is required', async ({ page }) => {
    await page.goto('/admin/login')

    const passwordInput = page.getByLabel('Password')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('password field has autofocus', async ({ page }) => {
    await page.goto('/admin/login')

    // Check that password field is focused
    const passwordInput = page.getByLabel('Password')
    await expect(passwordInput).toBeFocused()
  })
})

test.describe('Admin Dashboard (unauthenticated)', () => {
  test('admin teams page redirects to login', async ({ page }) => {
    await page.goto('/admin/teams')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('admin sponsors page redirects to login', async ({ page }) => {
    await page.goto('/admin/sponsors')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('admin players page redirects to login', async ({ page }) => {
    await page.goto('/admin/players')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('admin packages page redirects to login', async ({ page }) => {
    await page.goto('/admin/packages')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})

test.describe('Admin Login Page UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
  })

  test('has frogman logo', async ({ page }) => {
    const logo = page.locator('img[alt="Frogman Classic"]')
    await expect(logo).toBeVisible()
  })

  test('logo links to home page', async ({ page }) => {
    const logoLink = page.locator('a:has(img[alt="Frogman Classic"])')
    await expect(logoLink).toHaveAttribute('href', '/')
  })

  test('has lock icon in title', async ({ page }) => {
    // The Lock icon should be present near the title
    const lockIcon = page.locator('svg').first()
    await expect(lockIcon).toBeVisible()
  })

  test('has description text', async ({ page }) => {
    await expect(page.getByText(/Enter the admin password/i)).toBeVisible()
  })
})

test.describe('Admin Protected Routes', () => {
  // These tests verify the authentication middleware works correctly

  test('login page accepts redirect parameter', async ({ page }) => {
    await page.goto('/admin/login?redirect=/admin/sponsors')

    // Should stay on login page with redirect param
    await expect(page).toHaveURL(/redirect=.*sponsors/)
  })

  test('direct admin access shows login', async ({ page }) => {
    // Try to access admin directly
    await page.goto('/admin')

    // Should end up at login
    await expect(page.getByRole('heading', { name: 'Admin Access' })).toBeVisible()
  })
})
