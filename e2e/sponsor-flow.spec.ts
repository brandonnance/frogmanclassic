import { test, expect } from '@playwright/test'

test.describe('Sponsor Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sponsor')
  })

  test('shows sponsor signup form', async ({ page }) => {
    // Page title
    await expect(page.getByRole('heading', { name: /Become a Frogman Classic Sponsor/i })).toBeVisible()

    // Form fields
    await expect(page.getByLabel(/Company \/ Sponsor Name/i)).toBeVisible()
    await expect(page.getByLabel(/Contact Name/i)).toBeVisible()
    await expect(page.getByLabel(/Contact Email/i)).toBeVisible()
    await expect(page.getByRole('combobox', { name: /Sponsorship Package/i })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /Payment Method/i })).toBeVisible()
  })

  test('has back to home link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to Home/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/')
  })

  test('has view all packages link that opens modal', async ({ page }) => {
    // Click to view all packages
    const viewPackagesButton = page.getByRole('button', { name: /view all levels/i })
    await expect(viewPackagesButton).toBeVisible()

    await viewPackagesButton.click()

    // Modal should open with package details
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sponsorship Packages' })).toBeVisible()
  })

  test('package dropdown loads packages from API', async ({ page }) => {
    // Wait for packages to load (spinner should disappear)
    await page.waitForSelector('[role="combobox"]', { timeout: 10000 })

    // Click the package dropdown
    await page.getByRole('combobox', { name: /Sponsorship Package/i }).click()

    // Should have at least one package option (loaded from API)
    // The packages are loaded dynamically, so we check for any SelectItem
    const options = page.locator('[role="option"]')
    await expect(options.first()).toBeVisible({ timeout: 10000 })
  })

  test('payment method dropdown has options', async ({ page }) => {
    await page.getByRole('combobox', { name: /Payment Method/i }).click()

    await expect(page.getByRole('option', { name: /Check/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Invoice/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Venmo/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /PayPal/i })).toBeVisible()
  })

  test('submit button is disabled without required fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Register as Sponsor/i })
    await expect(submitButton).toBeDisabled()
  })

  test('shows package preview when package is selected', async ({ page }) => {
    // Wait for packages to load
    await page.waitForSelector('[role="combobox"]', { timeout: 10000 })

    // Select a package
    await page.getByRole('combobox', { name: /Sponsorship Package/i }).click()
    await page.getByRole('option').first().click()

    // Should show package preview with benefits
    await expect(page.getByText(/What's included/i)).toBeVisible({ timeout: 5000 })
  })

  test('form fields are required', async ({ page }) => {
    const companyInput = page.getByLabel(/Company \/ Sponsor Name/i)
    const contactNameInput = page.getByLabel(/Contact Name/i)
    const contactEmailInput = page.getByLabel(/Contact Email/i)

    await expect(companyInput).toHaveAttribute('required')
    await expect(contactNameInput).toHaveAttribute('required')
    await expect(contactEmailInput).toHaveAttribute('required')
  })
})

test.describe('Sponsorship Packages Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sponsor')
  })

  test('modal shows packages with details', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /view all levels/i }).click()

    // Wait for modal content
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should show package cards with prices and benefits
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const spinner = document.querySelector('.animate-spin')
      return !spinner
    }, { timeout: 10000 })

    // Should have package cards
    const packageCards = dialog.locator('.border.rounded-lg')
    await expect(packageCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('modal can be closed', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /view all levels/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Close by pressing Escape
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('modal has become a sponsor CTA', async ({ page }) => {
    // Open modal from homepage or another location that shows CTA
    await page.goto('/')

    // Look for the modal trigger on homepage
    const viewPackagesButton = page.getByRole('button', { name: /View Sponsorship Packages/i })
    if (await viewPackagesButton.isVisible()) {
      await viewPackagesButton.click()

      // Modal should have CTA button (when showCta is true)
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(page.getByRole('link', { name: /Become a Sponsor/i })).toBeVisible()
    }
  })
})
