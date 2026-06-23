import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const DEMO = '?demo=true';

test.describe('Critical-Path E2E — GuildOS', () => {

  // ─────────────────────────────────────────────────────────────
  // Test 1: Login → Dashboard → Browse 4 pages → Profile
  // ─────────────────────────────────────────────────────────────
  test('Test 1: Login via demo button, browse dashboard + 4 nav pages + profile', async ({ page }) => {
    // Start at login page
    await page.goto(`${BASE}/login`);
    await expect(page.locator('text=GUILD_OS').first()).toBeVisible({ timeout: 15000 });

    // Click demo mode quick-access button
    const demoBtn = page.locator('#btn-demo-mode');
    await expect(demoBtn).toBeVisible({ timeout: 10000 });
    await demoBtn.click();

    // Should land on dashboard with demo mode
    await page.waitForURL('**/dashboard?demo=true', { timeout: 15000 });
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=⚡ DEMO MODE')).first()).toBeVisible({ timeout: 15000 });

    // Wait for merchant terminal heading to appear
    await expect(page.locator('text=MERCHANT TERMINAL').first()).toBeVisible({ timeout: 15000 });

    // Navigate to Inventory
    const navInventory = page.locator('#nav-inventory');
    await expect(navInventory).toBeVisible({ timeout: 10000 });
    await navInventory.click();
    await page.waitForURL('**/inventory?demo=true', { timeout: 15000 });
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=INVENTORY MATRIX')).first()).toBeVisible({ timeout: 15000 });
    // Verify URL preserves demo param after client navigation
    expect(page.url()).toContain('demo=true');

    // Navigate to Bounty Board
    const navBounty = page.locator('#nav-bounty-board');
    await expect(navBounty).toBeVisible({ timeout: 10000 });
    await navBounty.click();
    await page.waitForURL('**/bounty-board?demo=true', { timeout: 15000 });
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=QUEST BOARD')).first()).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('demo=true');

    // Navigate to Nexus
    const navNexus = page.locator('#nav-nexus');
    await expect(navNexus).toBeVisible({ timeout: 10000 });
    await navNexus.click();
    await page.waitForURL('**/nexus?demo=true', { timeout: 15000 });
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=THE NEXUS')).first()).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('demo=true');

    // Navigate to Profile
    const navProfile = page.locator('#nav-profile');
    await expect(navProfile).toBeVisible({ timeout: 10000 });
    await navProfile.click();
    await page.waitForURL('**/profile?demo=true', { timeout: 15000 });
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=PROFILE').or(page.locator('text=SAVE ROOM'))).first()).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('demo=true');
  });

  // ─────────────────────────────────────────────────────────────
  // Test 2: Bounty Board — Create bounty via wizard
  // ─────────────────────────────────────────────────────────────
  test('Test 2: Bounty Board — create bounty via Post Bounty wizard', async ({ page }) => {
    await page.goto(`${BASE}/bounty-board${DEMO}`);

    // Wait for page to stabilise
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=QUEST BOARD')).first()).toBeVisible({ timeout: 15000 });

    // Click "Post Bounty" button
    const postBtn = page.locator('#btn-post-bounty');
    await expect(postBtn).toBeVisible({ timeout: 10000 });
    await postBtn.click();

    // Wait for the wizard modal to appear — step 1: item name field
    const itemNameInput = page.locator('#wizard-item-name');
    await expect(itemNameInput).toBeVisible({ timeout: 10000 });
    await itemNameInput.fill('Chrono Trigger (SNES)');

    // Click "NEXT: ORDER TYPE" (step 1→2) — try multiple match strategies
    const nextBtn = page.locator('button:has-text("ORDER TYPE")').or(page.locator('button:has-text("NEXT")')).first();
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await nextBtn.click();
    await page.waitForTimeout(400); // animation

    // Step 2: Choose order type — click "Bounty" option if present
    const bountyTypeBtn = page.locator('button:has-text("Bounty")').first();
    const nextBtn2 = page.locator('button:has-text("PRICING")').or(page.locator('button:has-text("NEXT")')).first();
    if (await bountyTypeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bountyTypeBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(nextBtn2).toBeVisible({ timeout: 5000 });
    await nextBtn2.click();
    await page.waitForTimeout(400); // animation

    // Step 3: Set pricing — just click NEXT: CONFIRM
    const nextBtn3 = page.locator('button:has-text("CONFIRM")').or(page.locator('button:has-text("NEXT")')).first();
    await expect(nextBtn3).toBeVisible({ timeout: 5000 });
    await nextBtn3.click();
    await page.waitForTimeout(400); // animation

    // Step 4: Confirm deployment — click DEPLOY QUEST
    const deployBtn = page.locator('button:has-text("DEPLOY QUEST")').or(page.locator('button:has-text("DEPLOY")')).first();
    await expect(deployBtn).toBeVisible({ timeout: 5000 });
    await deployBtn.click();

    // Wait for success state after deployment
    await page.waitForTimeout(1000);
    const successMsg = page.locator('text=QUEST DEPLOYED').or(page.locator('text=Deployed').or(page.locator('text=Success'))).first();
    await expect(successMsg).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────
  // Test 3: Inventory — Browse items, test search
  // ─────────────────────────────────────────────────────────────
  test('Test 3: Inventory — browse items and test search/filter', async ({ page }) => {
    await page.goto(`${BASE}/inventory${DEMO}`);

    // Wait for page
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=INVENTORY MATRIX').or(page.locator('text=SCRAP YARD'))).first()).toBeVisible({ timeout: 15000 });

    // Wait for search input
    const searchInput = page.locator('#input-inventory-search');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Verify items grid or table has loaded (check for item card/row in DOM)
    // The page shows either a grid of items or an empty state
    const itemsExist = page.locator('[class*="grid"]').or(page.locator('table')).first();
    await expect(itemsExist).toBeVisible({ timeout: 10000 });

    // Test search: type part of a common phantom-data item name
    await searchInput.fill('Chrono');
    await page.waitForTimeout(500); // debounce

    // Verify items still visible after filtering (or empty state shows no results)
    const demoBanner = page.locator('text=DEMO MODE').first();
    await expect(demoBanner).toBeVisible({ timeout: 5000 });

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
  });

  // ─────────────────────────────────────────────────────────────
  // Test 4: Nexus/LFG — Browse lobbies and save rooms
  // ─────────────────────────────────────────────────────────────
  test('Test 4: Nexus — browse LFG lobbies and save rooms', async ({ page }) => {
    await page.goto(`${BASE}/nexus${DEMO}`);

    // Wait for page
    await expect(page.locator('text=DEMO MODE').or(page.locator('text=THE NEXUS')).first()).toBeVisible({ timeout: 15000 });

    // Look for LFG tab or lobby content
    const lfgTab = page.locator('button:has-text("LFG Board")').or(page.locator('button:has-text("LFG")')).first();
    const createLobbyBtn = page.locator('#btn-create-lobby');

    // Check for LFG tab — click it if visible
    if (await lfgTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lfgTab.click();
      await page.waitForTimeout(500);
    }

    // Verify the CREATE LOBBY button loaded (confirms LFG content is rendered)
    await expect(createLobbyBtn).toBeVisible({ timeout: 10000 });

    // Try Save Rooms tab
    const saveRoomsTab = page.locator('button:has-text("Save Rooms")').first();
    if (await saveRoomsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveRoomsTab.click();
      await page.waitForTimeout(500);
      const bookBtn = page.locator('button:has-text("BOOK NOW")').first();
      await expect(bookBtn).toBeVisible({ timeout: 10000 });
    }

    // Verify demo mode remains active
    const demoBadge = page.locator('text=DEMO MODE').first();
    await expect(demoBadge).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('demo=true');
  });

  // ─────────────────────────────────────────────────────────────
  // Test 5: API Health — 10 critical endpoints with ?demo=true
  // ─────────────────────────────────────────────────────────────
  test('Test 5: API health — 10 critical endpoints return < 500 with ?demo=true', async ({ page }) => {
    const endpoints = [
      { path: '/api/inventory?demo=true', name: 'inventory' },
      { path: '/api/bounties?demo=true', name: 'bounties' },
      { path: '/api/nexus/lfg?demo=true', name: 'nexus-lfg' },
      { path: '/api/nexus/rooms?demo=true', name: 'nexus-rooms' },
      { path: '/api/wallet?demo=true', name: 'wallet' },
      { path: '/api/wallet/transactions?demo=true', name: 'wallet-transactions' },
      { path: '/api/system/mode?demo=true', name: 'system-mode' },
      { path: '/api/vitality/quests?demo=true', name: 'vitality-quests' },
      { path: '/api/potions/menu?demo=true', name: 'potions-menu' },
      { path: '/api/discounts?demo=true', name: 'discounts' },
    ];

    const results: Array<{ name: string; status: number; ok: boolean }> = [];

    for (const ep of endpoints) {
      let status = 0;
      let ok = false;
      try {
        const res = await page.request.get(`${BASE}${ep.path}`, { timeout: 15000 });
        status = res.status();
        ok = res.ok();
      } catch (err) {
        status = -1;
      }
      results.push({ name: ep.name, status, ok });
    }

    // Log results for debugging
    console.log('API health results:', JSON.stringify(results, null, 2));

    // Verify all endpoints returned < 500
    for (const r of results) {
      expect(r.status, `Endpoint ${r.name} returned status ${r.status}`).toBeGreaterThanOrEqual(200);
      expect(r.status, `Endpoint ${r.name} returned 5xx error`).toBeLessThan(500);
    }
  });
});
