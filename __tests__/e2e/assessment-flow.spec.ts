import { test, expect, Page } from '@playwright/test'

// Test data
const testUser = {
  email: 'test@soyuzinterface.com',
  password: 'TestPassword123!'
}

const discAnswers = [
  0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2 // Pattern for 15 DISC questions
]

const softSkillsAnswers = Array(20).fill(0).map((_, i) => i % 4) // 20 soft skills questions
const sjtAnswers = Array(10).fill(0).map((_, i) => i % 4) // 10 SJT scenarios

test.describe('Complete Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Clear any existing state
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should complete full assessment flow: DISC → Soft Skills → SJT → Results', async ({ page }) => {
    // Step 1: Authentication
    await authenticateUser(page)
    
    // Step 2: Start new assessment
    await startNewAssessment(page)
    
    // Step 3: Complete DISC assessment
    await completeDISCAssessment(page)
    
    // Step 4: Complete Soft Skills assessment  
    await completeSoftSkillsAssessment(page)
    
    // Step 5: Complete SJT assessment
    await completeSJTAssessment(page)
    
    // Step 6: Verify results and completion
    await verifyAssessmentCompletion(page)
  })

  test('should persist progress and allow resumption after interruption', async ({ page }) => {
    // Step 1: Start assessment and complete DISC
    await authenticateUser(page)
    await startNewAssessment(page)
    await completeDISCAssessment(page)
    
    // Step 2: Start Soft Skills but interrupt midway
    await page.waitForSelector('[data-testid="soft-skills-question"]')
    
    // Answer half the soft skills questions
    for (let i = 0; i < 10; i++) {
      await answerSoftSkillsQuestion(page, i % 4)
      if (i < 9) {
        await page.click('[data-testid="next-button"]')
        await page.waitForTimeout(500) // Auto-save debounce
      }
    }
    
    // Step 3: Simulate browser close/refresh
    await page.reload()
    
    // Step 4: Should show resume modal
    await page.waitForSelector('[data-testid="resume-assessment-modal"]')
    expect(await page.textContent('[data-testid="resume-assessment-modal"]')).toContain('retomar')
    
    // Step 5: Resume assessment
    await page.click('[data-testid="resume-button"]')
    
    // Step 6: Should be on soft skills question 11
    await page.waitForSelector('[data-testid="soft-skills-question"]')
    expect(await page.textContent('[data-testid="question-counter"]')).toContain('11')
    
    // Step 7: Complete remaining assessment
    await completeSoftSkillsAssessment(page, 10) // Start from question 10
    await completeSJTAssessment(page)
    await verifyAssessmentCompletion(page)
  })

  test('should handle auto-save during rapid input changes', async ({ page }) => {
    await authenticateUser(page)
    await startNewAssessment(page)
    
    // Monitor network requests
    const saveRequests: any[] = []
    page.on('request', request => {
      if (request.url().includes('/api/assessment') && request.method() === 'POST') {
        saveRequests.push(request)
      }
    })
    
    // Navigate to first DISC question
    await page.waitForSelector('[data-testid="disc-question"]')
    
    // Make rapid answer changes (should be debounced)
    for (let i = 0; i < 4; i++) {
      await page.click(`[data-testid="disc-option-${i}"]`)
      await page.waitForTimeout(100) // Fast changes
    }
    
    // Wait for debounce period
    await page.waitForTimeout(1000)
    
    // Should have made only one save request (debounced)
    expect(saveRequests.length).toBeLessThanOrEqual(2) // Allow for some timing variance
    
    // Verify loading indicator appeared
    await expect(page.locator('[data-testid="save-status"]')).toContainText(/Salvando|Salvo/)
  })

  test('should work offline with localStorage fallback', async ({ page }) => {
    await authenticateUser(page)
    await startNewAssessment(page)
    
    // Complete DISC assessment while online
    await completeDISCAssessment(page)
    
    // Go offline
    await page.context().setOffline(true)
    
    // Continue with Soft Skills (should save to localStorage)
    await page.waitForSelector('[data-testid="soft-skills-question"]')
    
    // Answer a few questions offline
    for (let i = 0; i < 5; i++) {
      await answerSoftSkillsQuestion(page, i % 4)
      if (i < 4) {
        await page.click('[data-testid="next-button"]')
        await page.waitForTimeout(500)
      }
    }
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="save-status"]')).toContainText(/offline|erro/i)
    
    // Go back online
    await page.context().setOffline(false)
    
    // Should sync localStorage data
    await page.waitForTimeout(2000)
    await expect(page.locator('[data-testid="save-status"]')).toContainText(/salvo/i)
  })

  test('should maintain assessment history access', async ({ page }) => {
    // Complete a full assessment first
    await authenticateUser(page)
    await startNewAssessment(page)
    await completeDISCAssessment(page)
    await completeSoftSkillsAssessment(page)
    await completeSJTAssessment(page)
    await verifyAssessmentCompletion(page)
    
    // Navigate to assessment history
    await page.click('[data-testid="history-button"]')
    await page.waitForSelector('[data-testid="assessment-history"]')
    
    // Should show completed assessment
    const historyItems = await page.locator('[data-testid="history-item"]').count()
    expect(historyItems).toBeGreaterThan(0)
    
    // Click on the assessment to view details
    await page.click('[data-testid="history-item"]:first-child')
    await page.waitForSelector('[data-testid="assessment-details"]')
    
    // Should show assessment results
    expect(await page.locator('[data-testid="disc-results"]')).toBeVisible()
    expect(await page.locator('[data-testid="soft-skills-results"]')).toBeVisible()
    expect(await page.locator('[data-testid="sjt-results"]')).toBeVisible()
  })

  test('should handle multiple assessment types independently', async ({ page }) => {
    await authenticateUser(page)
    
    // Test DISC-only assessment
    await page.click('[data-testid="start-disc-only"]')
    await completeDISCAssessment(page)
    await verifyAssessmentCompletion(page, 'disc')
    
    // Return to home and start Soft Skills only
    await page.click('[data-testid="home-button"]')
    await page.click('[data-testid="start-soft-skills-only"]')
    await completeSoftSkillsAssessment(page)
    await verifyAssessmentCompletion(page, 'soft_skills')
    
    // Return to home and start SJT only  
    await page.click('[data-testid="home-button"]')
    await page.click('[data-testid="start-sjt-only"]')
    await completeSJTAssessment(page)
    await verifyAssessmentCompletion(page, 'sjt')
  })

  test('should handle network errors gracefully with retry', async ({ page }) => {
    await authenticateUser(page)
    await startNewAssessment(page)
    
    // Intercept and fail API calls initially
    let failCount = 0
    await page.route('**/api/assessment', route => {
      failCount++
      if (failCount <= 2) {
        route.abort('failed') // Fail first 2 attempts
      } else {
        route.continue() // Succeed on 3rd attempt
      }
    })
    
    // Start answering questions (should trigger auto-save)
    await page.waitForSelector('[data-testid="disc-question"]')
    await page.click('[data-testid="disc-option-0"]')
    
    // Should show error initially
    await page.waitForTimeout(1000)
    await expect(page.locator('[data-testid="save-status"]')).toContainText(/erro/i)
    
    // Wait for retries to succeed
    await page.waitForTimeout(5000) // Allow time for exponential backoff retries
    
    // Should eventually succeed
    await expect(page.locator('[data-testid="save-status"]')).toContainText(/salvo/i)
  })

  test('should prevent data leakage between users', async ({ page }) => {
    // Complete assessment as first user
    await authenticateUser(page, testUser)
    await startNewAssessment(page)
    await completeDISCAssessment(page)
    
    // Sign out and sign in as different user
    await signOut(page)
    const secondUser = { email: 'test2@soyuzinterface.com', password: 'TestPassword123!' }
    await authenticateUser(page, secondUser)
    
    // Should not see previous user's assessment
    await page.click('[data-testid="history-button"]')
    await page.waitForSelector('[data-testid="assessment-history"]')
    
    const historyItems = await page.locator('[data-testid="history-item"]').count()
    expect(historyItems).toBe(0)
    
    // Should not be offered to resume previous assessment
    await page.goto('/')
    await expect(page.locator('[data-testid="resume-assessment-modal"]')).not.toBeVisible()
  })
})

// Helper functions
async function authenticateUser(page: Page, user = testUser) {
  await page.goto('/')
  
  // Check if already authenticated
  const isAuthenticated = await page.locator('[data-testid="user-avatar"]').isVisible()
  if (isAuthenticated) return
  
  // Fill authentication form
  await page.fill('[data-testid="email-input"]', user.email)
  await page.fill('[data-testid="password-input"]', user.password)
  await page.click('[data-testid="sign-in-button"]')
  
  // Wait for authentication success
  await page.waitForSelector('[data-testid="user-avatar"]')
}

async function startNewAssessment(page: Page) {
  await page.click('[data-testid="start-assessment"]')
  await page.waitForSelector('[data-testid="disc-question"]')
}

async function completeDISCAssessment(page: Page) {
  await page.waitForSelector('[data-testid="disc-question"]')
  
  for (let i = 0; i < 15; i++) {
    // Answer question
    await page.click(`[data-testid="disc-option-${discAnswers[i]}"]`)
    
    // Wait for auto-save
    await page.waitForTimeout(200)
    
    // Navigate to next question or finish
    if (i < 14) {
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="disc-question"]')
    } else {
      await page.click('[data-testid="finish-button"]')
    }
  }
  
  // Wait for transition to next section
  await page.waitForTimeout(1000)
}

async function completeSoftSkillsAssessment(page: Page, startFrom = 0) {
  await page.waitForSelector('[data-testid="soft-skills-question"]')
  
  for (let i = startFrom; i < 20; i++) {
    await answerSoftSkillsQuestion(page, softSkillsAnswers[i])
    
    if (i < 19) {
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="soft-skills-question"]')
    } else {
      await page.click('[data-testid="finish-button"]')
    }
  }
  
  await page.waitForTimeout(1000)
}

async function answerSoftSkillsQuestion(page: Page, answerIndex: number) {
  const slider = page.locator('[data-testid="skill-slider"]')
  await slider.fill(String((answerIndex + 1) * 25)) // Convert to percentage
  await page.waitForTimeout(200)
}

async function completeSJTAssessment(page: Page) {
  await page.waitForSelector('[data-testid="sjt-scenario"]')
  
  for (let i = 0; i < 10; i++) {
    // Read scenario and select answer
    await page.click(`[data-testid="sjt-option-${sjtAnswers[i]}"]`)
    await page.waitForTimeout(200)
    
    if (i < 9) {
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="sjt-scenario"]')
    } else {
      await page.click('[data-testid="finish-button"]')
    }
  }
  
  await page.waitForTimeout(1000)
}

async function verifyAssessmentCompletion(page: Page, type = 'complete') {
  // Should navigate to results screen
  await page.waitForSelector('[data-testid="assessment-results"]')
  
  // Verify completion message
  await expect(page.locator('[data-testid="completion-message"]')).toContainText(/concluída|finalizada/i)
  
  // Verify results are displayed based on assessment type
  if (type === 'complete' || type === 'disc') {
    await expect(page.locator('[data-testid="disc-results"]')).toBeVisible()
  }
  
  if (type === 'complete' || type === 'soft_skills') {
    await expect(page.locator('[data-testid="soft-skills-results"]')).toBeVisible()
  }
  
  if (type === 'complete' || type === 'sjt') {
    await expect(page.locator('[data-testid="sjt-results"]')).toBeVisible()
  }
  
  // Verify assessment is marked as completed in database
  const response = await page.evaluate(async () => {
    const res = await fetch('/api/assessments')
    return res.json()
  })
  
  expect(response.assessments).toHaveLength.greaterThan(0)
  expect(response.assessments[0].status).toBe('completed')
}

async function signOut(page: Page) {
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="sign-out"]')
  await page.waitForSelector('[data-testid="sign-in-button"]')
}

test.describe('Performance Tests', () => {
  test('should load assessment in under 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await authenticateUser(page)
    await startNewAssessment(page)
    
    // Wait for full page load
    await page.waitForSelector('[data-testid="disc-question"]')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000)
  })
  
  test('should handle rapid interactions without blocking UI', async ({ page }) => {
    await authenticateUser(page)
    await startNewAssessment(page)
    
    await page.waitForSelector('[data-testid="disc-question"]')
    
    // Make rapid clicks
    const startTime = Date.now()
    for (let i = 0; i < 10; i++) {
      await page.click(`[data-testid="disc-option-${i % 4}"]`)
    }
    const interactionTime = Date.now() - startTime
    
    // UI should remain responsive
    expect(interactionTime).toBeLessThan(1000)
    
    // Last selection should be visible
    await expect(page.locator('[data-testid="disc-option-2"]')).toBeChecked()
  })
})

test.describe('Accessibility Tests', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await authenticateUser(page)
    await startNewAssessment(page)
    
    // Should be able to navigate with Tab
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to select with Enter
    await page.keyboard.press('Enter')
    
    // Should be able to navigate with Arrow keys within radio group
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Space')
    
    // Verify selection worked
    await expect(page.locator('[data-testid="next-button"]')).not.toBeDisabled()
  })
  
  test('should have proper ARIA labels', async ({ page }) => {
    await authenticateUser(page)
    await startNewAssessment(page)
    
    // Check for proper labels
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[role="radiogroup"]')).toBeVisible()
    
    const radios = page.locator('[role="radio"]')
    const count = await radios.count()
    
    for (let i = 0; i < count; i++) {
      await expect(radios.nth(i)).toHaveAttribute('aria-labelledby')
    }
  })
})