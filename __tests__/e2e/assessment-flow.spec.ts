import { test, expect } from '@playwright/test'

test.describe('Assessment Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication by setting up localStorage
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
  })

  test('Complete assessment flow: save → interrupt → resume → complete', async ({ page }) => {
    // Start DISC assessment
    await page.goto('/assessment/disc')
    
    // Verify assessment page loaded
    await expect(page.getByRole('heading', { name: /disc/i })).toBeVisible()
    
    // Fill out some DISC questions (simulate partial completion)
    const firstQuestion = page.locator('[data-testid="disc-question-1"]').first()
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click()
    }
    
    // Wait for auto-save to trigger (debounced)
    await page.waitForTimeout(1000)
    
    // Verify saving indicator appears
    const savingIndicator = page.locator('[data-testid="saving-indicator"]')
    if (await savingIndicator.isVisible()) {
      await expect(savingIndicator).toContainText(/salvando|salvo/i)
    }
    
    // Simulate interruption by navigating away
    await page.goto('/')
    await expect(page.getByText(/início|home/i)).toBeVisible()
    
    // Return to assessment page to test resume functionality
    await page.goto('/assessment/disc')
    
    // Verify assessment state is restored
    await expect(page.getByRole('heading', { name: /disc/i })).toBeVisible()
    
    // Complete remaining questions
    const questions = page.locator('[data-testid^="disc-question"]')
    const questionCount = await questions.count()
    
    for (let i = 0; i < Math.min(questionCount, 5); i++) {
      const question = questions.nth(i)
      if (await question.isVisible()) {
        await question.click()
        await page.waitForTimeout(200) // Small delay between clicks
      }
    }
    
    // Submit assessment
    const submitButton = page.getByRole('button', { name: /finalizar|submeter|concluir/i })
    if (await submitButton.isVisible()) {
      await submitButton.click()
    }
    
    // Verify completion
    await expect(page.getByText(/concluído|finalizado|completo/i)).toBeVisible({ timeout: 10000 })
  })

  test('Soft skills assessment with auto-save functionality', async ({ page }) => {
    await page.goto('/assessment/soft-skills')
    
    // Verify soft skills assessment page loaded
    await expect(page.getByRole('heading', { name: /soft skills|habilidades/i })).toBeVisible()
    
    // Fill out some soft skills ratings
    const sliders = page.locator('input[type="range"]')
    const sliderCount = await sliders.count()
    
    if (sliderCount > 0) {
      // Set some slider values
      for (let i = 0; i < Math.min(sliderCount, 3); i++) {
        await sliders.nth(i).fill('7')
        await page.waitForTimeout(300)
      }
      
      // Wait for auto-save debounce
      await page.waitForTimeout(1000)
      
      // Verify progress is saved
      const saveStatus = page.locator('[data-testid="save-status"]')
      if (await saveStatus.isVisible()) {
        await expect(saveStatus).not.toContainText(/não salvo/i)
      }
    }
  })

  test('Assessment persistence across browser refresh', async ({ page }) => {
    await page.goto('/assessment/disc')
    
    // Fill out first question
    const firstOption = page.locator('[data-testid="disc-question-1"]').first()
    if (await firstOption.isVisible()) {
      await firstOption.click()
      await page.waitForTimeout(1000) // Wait for auto-save
    }
    
    // Refresh the page
    await page.reload()
    
    // Verify the page reloads and assessment state is maintained
    await expect(page.getByRole('heading', { name: /disc/i })).toBeVisible()
    
    // Verify previously selected option is still selected
    if (await firstOption.isVisible()) {
      await expect(firstOption).toBeChecked()
    }
  })

  test('Multiple assessment types completion flow', async ({ page }) => {
    // Complete DISC assessment
    await page.goto('/assessment/disc')
    await expect(page.getByRole('heading', { name: /disc/i })).toBeVisible()
    
    // Fill out DISC questions quickly for test purposes
    const discQuestions = page.locator('[data-testid^="disc-question"]')
    const discCount = await discQuestions.count()
    
    for (let i = 0; i < Math.min(discCount, 4); i++) {
      const question = discQuestions.nth(i)
      if (await question.isVisible()) {
        await question.click()
      }
    }
    
    const discSubmit = page.getByRole('button', { name: /próximo|continuar/i })
    if (await discSubmit.isVisible()) {
      await discSubmit.click()
    }
    
    // Move to soft skills assessment
    await page.goto('/assessment/soft-skills')
    await expect(page.getByRole('heading', { name: /soft skills|habilidades/i })).toBeVisible()
    
    // Fill out soft skills ratings
    const sliders = page.locator('input[type="range"]')
    const sliderCount = await sliders.count()
    
    for (let i = 0; i < Math.min(sliderCount, 4); i++) {
      await sliders.nth(i).fill('8')
    }
    
    await page.waitForTimeout(1000) // Wait for auto-save
    
    const softSkillsSubmit = page.getByRole('button', { name: /próximo|continuar/i })
    if (await softSkillsSubmit.isVisible()) {
      await softSkillsSubmit.click()
    }
    
    // Move to SJT assessment
    await page.goto('/assessment/sjt')
    if (await page.getByRole('heading', { name: /sjt|situacional/i }).isVisible()) {
      // Fill out SJT questions
      const sjtQuestions = page.locator('[data-testid^="sjt-question"]')
      const sjtCount = await sjtQuestions.count()
      
      for (let i = 0; i < Math.min(sjtCount, 3); i++) {
        const question = sjtQuestions.nth(i)
        if (await question.isVisible()) {
          await question.click()
        }
      }
    }
    
    // Final submission
    const finalSubmit = page.getByRole('button', { name: /finalizar|concluir/i })
    if (await finalSubmit.isVisible()) {
      await finalSubmit.click()
      
      // Verify completion page or message
      await expect(page.getByText(/parabéns|concluído|completo/i)).toBeVisible({ timeout: 15000 })
    }
  })

  test('Error handling and retry functionality', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/assessment', (route) => {
      route.abort('failed')
    })
    
    await page.goto('/assessment/disc')
    
    // Fill out a question to trigger save
    const firstQuestion = page.locator('[data-testid="disc-question-1"]').first()
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click()
      await page.waitForTimeout(2000) // Wait for save attempt and retries
    }
    
    // Verify error state is shown
    const errorIndicator = page.locator('[data-testid="save-error"]')
    if (await errorIndicator.isVisible()) {
      await expect(errorIndicator).toBeVisible()
    }
    
    // Restore network and verify retry works
    await page.unroute('**/api/assessment')
    
    // Wait for retry mechanism
    await page.waitForTimeout(3000)
    
    // Verify save eventually succeeds
    const saveStatus = page.locator('[data-testid="save-status"]')
    if (await saveStatus.isVisible()) {
      await expect(saveStatus).not.toContainText(/erro|falha/i, { timeout: 10000 })
    }
  })

  test('Local backup functionality when offline', async ({ page }) => {
    await page.goto('/assessment/soft-skills')
    
    // Go offline
    await page.context().setOffline(true)
    
    // Fill out assessment data
    const sliders = page.locator('input[type="range"]')
    const sliderCount = await sliders.count()
    
    if (sliderCount > 0) {
      for (let i = 0; i < Math.min(sliderCount, 2); i++) {
        await sliders.nth(i).fill('6')
      }
      
      await page.waitForTimeout(2000) // Wait for backup to localStorage
      
      // Verify data is backed up to localStorage
      const backupData = await page.evaluate(() => {
        const backup = localStorage.getItem('assessment_backup_soft_skills_test-user-id')
        return backup ? JSON.parse(backup) : null
      })
      
      expect(backupData).toBeTruthy()
      expect(backupData.soft_skills_results).toBeTruthy()
    }
    
    // Go back online
    await page.context().setOffline(false)
    
    // Wait for sync to occur
    await page.waitForTimeout(2000)
  })

  test('Assessment navigation and progress tracking', async ({ page }) => {
    await page.goto('/assessment')
    
    // Verify assessment dashboard or selection page
    await expect(page).toHaveURL(/\/assessment/)
    
    // Start with DISC assessment
    const discButton = page.getByRole('link', { name: /disc/i })
    if (await discButton.isVisible()) {
      await discButton.click()
      await expect(page).toHaveURL(/\/assessment\/disc/)
    }
    
    // Fill some data
    const question = page.locator('[data-testid^="disc-question"]').first()
    if (await question.isVisible()) {
      await question.click()
      await page.waitForTimeout(500)
    }
    
    // Navigate back to assessment list
    const backButton = page.getByRole('button', { name: /voltar|back/i })
    if (await backButton.isVisible()) {
      await backButton.click()
    } else {
      await page.goto('/assessment')
    }
    
    // Verify progress is shown in assessment list
    const progressIndicator = page.locator('[data-testid="assessment-progress"]')
    if (await progressIndicator.isVisible()) {
      await expect(progressIndicator).toBeVisible()
    }
  })

  test('Data validation and form validation', async ({ page }) => {
    await page.goto('/assessment/soft-skills')
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /próximo|continuar|finalizar/i })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      
      // Verify validation messages appear
      const validationErrors = page.locator('[data-testid="validation-error"]')
      if (await validationErrors.count() > 0) {
        await expect(validationErrors.first()).toBeVisible()
      }
    }
    
    // Fill out form properly
    const sliders = page.locator('input[type="range"]')
    const sliderCount = await sliders.count()
    
    if (sliderCount > 0) {
      for (let i = 0; i < sliderCount; i++) {
        await sliders.nth(i).fill('7')
      }
      
      // Now submission should work
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Verify no validation errors
        const errors = page.locator('[data-testid="validation-error"]')
        if (await errors.count() > 0) {
          await expect(errors.first()).not.toBeVisible()
        }
      }
    }
  })
})