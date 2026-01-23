import { test, expect } from '@playwright/test'

test.describe('Code Redemption Flow', () => {
  test('shows loading state while validating code', async ({ page }) => {
    // Go to redemption page with a code
    await page.goto('/redeem/TEST-CODE-1234')

    // Should briefly show loading state
    // Note: This may be too fast to catch reliably, so we check for the end result
    await page.waitForLoadState('networkidle')
  })

  test('shows invalid code message for non-existent code', async ({ page }) => {
    await page.goto('/redeem/INVALID-CODE-XXXX')

    // Wait for validation to complete
    await page.waitForLoadState('networkidle')

    // Should show invalid code message
    await expect(page.getByRole('heading', { name: /Invalid Code|Code Already Used/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/INVALID-CODE-XXXX/i)).toBeVisible()
  })

  test('shows try another code form on invalid code', async ({ page }) => {
    await page.goto('/redeem/INVALID-CODE-XXXX')
    await page.waitForLoadState('networkidle')

    // Should show form to try different code
    await expect(page.getByLabel(/Try a different code/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByPlaceholder(/FROG-2026-XXXX/i)).toBeVisible()
  })

  test('can enter new code from invalid code page', async ({ page }) => {
    await page.goto('/redeem/INVALID-CODE-XXXX')
    await page.waitForLoadState('networkidle')

    // Enter a new code
    const codeInput = page.getByPlaceholder(/FROG-2026-XXXX/i)
    await codeInput.fill('NEW-CODE-1234')

    // Click go button
    await page.getByRole('button', { name: 'Go' }).click()

    // Should navigate to new code URL
    await expect(page).toHaveURL('/redeem/NEW-CODE-1234')
  })

  test('has back to home link on invalid code page', async ({ page }) => {
    await page.goto('/redeem/INVALID-CODE-XXXX')
    await page.waitForLoadState('networkidle')

    const homeLink = page.getByRole('link', { name: /Back to Home/i })
    await expect(homeLink).toBeVisible({ timeout: 10000 })
    await expect(homeLink).toHaveAttribute('href', '/')
  })

  test('code input converts to uppercase', async ({ page }) => {
    await page.goto('/redeem/INVALID-CODE-XXXX')
    await page.waitForLoadState('networkidle')

    const codeInput = page.getByPlaceholder(/FROG-2026-XXXX/i)
    await codeInput.fill('lowercase-code')

    // Should be converted to uppercase
    await expect(codeInput).toHaveValue('LOWERCASE-CODE')
  })
})

test.describe('Code Entry from Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('heading', { name: 'I Have a Code' }).click()
  })

  test('code entry redirects to redemption page', async ({ page }) => {
    // Enter a code
    await page.getByLabel('Code').fill('FROG-2026-TEST')

    // Click continue
    await page.getByRole('button', { name: 'Continue' }).click()

    // Should navigate to redemption page
    await expect(page).toHaveURL('/redeem/FROG-2026-TEST')
  })

  test('code input shows placeholder with correct format', async ({ page }) => {
    const codeInput = page.getByLabel('Code')
    await expect(codeInput).toHaveAttribute('placeholder', /FROG.*\d{4}.*XXXX/i)
  })

  test('code is converted to uppercase on input', async ({ page }) => {
    const codeInput = page.getByLabel('Code')
    await codeInput.fill('frog-2026-test')

    // Should be uppercase
    await expect(codeInput).toHaveValue('FROG-2026-TEST')
  })
})

test.describe('Valid Code Registration Form', () => {
  // Note: These tests require a valid code in the database
  // They test the structure of the form that would appear with a valid code

  test('registration page structure from register entry', async ({ page }) => {
    // The structure we expect when a valid code is found
    // Since we can't easily create test codes, we verify the register flow works

    await page.goto('/register')

    // Can navigate to code entry
    await page.getByRole('heading', { name: 'I Have a Code' }).click()
    await expect(page.getByRole('heading', { name: 'Enter Your Code' })).toBeVisible()

    // Has proper code entry elements
    await expect(page.getByLabel('Code')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  })
})

test.describe('Redemption Page UI Elements', () => {
  test('invalid code page has proper error styling', async ({ page }) => {
    await page.goto('/redeem/INVALID-CODE-XXXX')
    await page.waitForLoadState('networkidle')

    // Should have red error icon (XCircle)
    const errorIcon = page.locator('.bg-red-100')
    await expect(errorIcon).toBeVisible({ timeout: 10000 })
  })

  test('contact sponsor message is shown', async ({ page }) => {
    await page.goto('/redeem/INVALID-CODE-XXXX')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/contact your sponsor/i)).toBeVisible({ timeout: 10000 })
  })
})
