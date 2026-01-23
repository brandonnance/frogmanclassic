import { test, expect } from '@playwright/test'

test.describe('Team Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('shows initial registration choice cards', async ({ page }) => {
    // Should see the two choice cards
    await expect(page.getByRole('heading', { name: 'Register Your Team' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'I Have a Code' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Register & Pay' })).toBeVisible()
  })

  test('clicking "I Have a Code" shows code entry form', async ({ page }) => {
    // Click the "I Have a Code" card
    await page.getByRole('heading', { name: 'I Have a Code' }).click()

    // Should show code entry form
    await expect(page.getByRole('heading', { name: 'Enter Your Code' })).toBeVisible()
    await expect(page.getByLabel('Code')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

    // Continue button should be disabled without code
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()

    // Enter a code
    await page.getByLabel('Code').fill('FROG-2026-TEST')
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  test('clicking "Register & Pay" shows registration form', async ({ page }) => {
    // Click the "Register & Pay" card
    await page.getByRole('heading', { name: 'Register & Pay' }).click()

    // Should show the registration form with Sat/Sun event details
    await expect(page.getByRole('heading', { name: /Saturday\/Sunday/i })).toBeVisible()

    // Team info section
    await expect(page.getByLabel(/Team Name/i)).toBeVisible()
    await expect(page.getByLabel(/Captain Email/i)).toBeVisible()

    // Players section
    await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible()

    // Payment section
    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()
  })

  test('can navigate back from code entry', async ({ page }) => {
    // Go to code entry
    await page.getByRole('heading', { name: 'I Have a Code' }).click()
    await expect(page.getByRole('heading', { name: 'Enter Your Code' })).toBeVisible()

    // Click back
    await page.getByRole('button', { name: /Back/i }).click()

    // Should be back at choice screen
    await expect(page.getByRole('heading', { name: 'I Have a Code' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Register & Pay' })).toBeVisible()
  })

  test('can navigate back from registration form', async ({ page }) => {
    // Go to registration form
    await page.getByRole('heading', { name: 'Register & Pay' }).click()
    await expect(page.getByRole('heading', { name: /Saturday\/Sunday/i })).toBeVisible()

    // Click back to options
    await page.getByRole('button', { name: /Back to options/i }).click()

    // Should be back at choice screen
    await expect(page.getByRole('heading', { name: 'I Have a Code' })).toBeVisible()
  })

  test('registration form shows Sun Willows member discount checkbox', async ({ page }) => {
    await page.getByRole('heading', { name: 'Register & Pay' }).click()

    // Should show Sun Willows member checkbox for each player
    const memberCheckbox = page.getByLabel(/Sun Willows Member/i).first()
    await expect(memberCheckbox).toBeVisible()
  })

  test('submit button is disabled until payment method selected', async ({ page }) => {
    await page.getByRole('heading', { name: 'Register & Pay' }).click()

    // Submit button should be disabled initially
    const submitButton = page.getByRole('button', { name: /Register Team/i })
    await expect(submitButton).toBeDisabled()
  })

  test('home link navigates correctly', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back to Home/i })).toBeVisible()
  })
})

test.describe('Registration Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('heading', { name: 'Register & Pay' }).click()
  })

  test('captain email is required', async ({ page }) => {
    const captainEmailInput = page.getByLabel(/Captain Email/i)
    await expect(captainEmailInput).toHaveAttribute('required')
  })

  test('payment method dropdown has options', async ({ page }) => {
    // Click the payment method dropdown
    await page.getByRole('combobox', { name: /Payment Method/i }).click()

    // Should have payment options
    await expect(page.getByRole('option', { name: /Check/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Invoice/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Venmo/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /PayPal/i })).toBeVisible()
  })

  test('session preference dropdown has options', async ({ page }) => {
    // Click the session preference dropdown
    await page.getByRole('combobox', { name: /Session Preference/i }).click()

    // Should have session options
    await expect(page.getByRole('option', { name: /No Preference/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Morning/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Afternoon/i })).toBeVisible()
  })
})
