/**
 * Browser smoke test for algorythm
 * Tests all levels: target playback, correct answer check.
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5175';

// Level target codes for verification (must match src/levels/index.ts)
const LEVELS = [
  { id: 'beat-1', target: 'sound("bd")' },
  { id: 'beat-2', target: 'sound("bd hh sd hh")' },
  { id: 'beat-3', target: 'sound("bd hh*4 sd hh*4")' },
  { id: 'beat-4', target: 'sound("bd sd bd sd")' },
  { id: 'beat-5', target: 'sound("bd hh sd hh bd hh sd hh")' },
  { id: 'note-1', target: 'note("c e g b").sound("piano")' },
  { id: 'note-2', target: 'n("0 2 4 6").scale("C:minor").sound("piano")' },
  { id: 'note-3', target: 'note("e4 d4 c4 d4").sound("piano")' },
  { id: 'note-4', target: '$: note("c4 e4 g4 e4").sound("piano")\n$: sound("bd hh sd hh")' },
  { id: 'note-5', target: 'n("0 1 2 3 4 5 6 7").scale("A:minor").sound("piano")' },
  { id: 'fx-1', target: 'sound("bd hh*4 sd hh*4").lpf(800)' },
  { id: 'fx-2', target: 'note("c4 e4 g4 e4").sound("piano").gain(0.7).room(0.8)' },
  { id: 'fx-3', target: 'sound("bd hh*2 sd hh*2").lpf(600)' },
  { id: 'fx-4', target: '$: note("c2 c2 eb2 g2").sound("sawtooth").lpf(400)\n$: sound("bd hh sd hh")' },
  { id: 'fx-5', target: '$: n("0 2 4 7 4 2").scale("C:minor").sound("piano").room(0.5)\n$: sound("bd hh*2 sd hh*2").gain(0.8)' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    consoleLogs.push(`[pageerror] ${err.message}`);
  });

  // Load app
  console.log('📌 Loading app...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const title = await page.title();
  console.log(`  Title: "${title}"`);

  // Chapter 1 should be unlocked (5 levels)
  let levelCards = await page.$$('.level-card:not(.locked)');
  console.log(`  Unlocked levels: ${levelCards.length}`);

  const results = { pass: 0, fail: 0, errors: [] };

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    console.log(`\n📌 [${i + 1}/${LEVELS.length}] Testing ${level.id}...`);

    // Navigate to level select
    const onLevelSelect = await page.$('.level-select');
    if (!onLevelSelect) {
      // Click back button
      const backBtn = await page.$('.btn-ghost');
      if (backBtn) {
        await backBtn.click();
        await page.waitForSelector('.level-select');
      }
    }

    // Check if this level's card is visible (chapters may be locked)
    levelCards = await page.$$('.level-card:not(.locked)');
    if (i >= levelCards.length) {
      console.log(`  ⚠️  Level card ${i} not accessible (locked chapter?)`);
      // Need to unlock by completing more levels in previous chapter
      // We already completed beat-1, but chapters require 3 levels
      // Let's check if we need to unlock
      console.log(`  Skipping - chapter locked`);
      continue;
    }

    await levelCards[i].click();
    await page.waitForSelector('.puzzle-view');

    const levelTitle = await page.textContent('.puzzle-title-area h2');
    console.log(`  Title: "${levelTitle}"`);

    // Test target playback (not for freeform which was beat-5, note-5, fx-5)
    const targetBtn = await page.$('.target-controls button');
    if (targetBtn) {
      consoleLogs.length = 0;
      await targetBtn.click();
      await page.waitForTimeout(3000);

      const notFound = consoleLogs.filter((l) => l.includes('not found'));
      const evalErr = consoleLogs.filter((l) => l.includes('[eval] error'));
      if (notFound.length > 0 || evalErr.length > 0) {
        console.log(`  ❌ Target playback errors:`);
        [...notFound, ...evalErr].forEach((e) => console.log(`    ${e}`));
        results.errors.push(`${level.id}: target playback error`);
      } else {
        console.log(`  ✅ Target plays OK`);
      }

      // Stop
      const stopBtn = await page.$('.target-controls button');
      if (stopBtn) {
        await stopBtn.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log(`  (freeform — no target button)`);
    }

    // Type the correct answer and check
    const cmContent = await page.$('.cm-content');
    if (cmContent) {
      await cmContent.click();
      await page.keyboard.press('Control+a');
      // For multiline code (with \n), we need to handle it
      const lines = level.target.split('\n');
      for (let li = 0; li < lines.length; li++) {
        if (li > 0) await page.keyboard.press('Enter');
        await page.keyboard.type(lines[li], { delay: 5 });
      }
      await page.waitForTimeout(300);

      // Click Check
      const checkBtn = await page.$('.btn-accent');
      await checkBtn.click();
      await page.waitForTimeout(2000);

      const resultCard = await page.$('.result-card');
      if (resultCard) {
        const feedback = await resultCard.textContent();
        const isPass = await resultCard.evaluate((el) =>
          el.classList.contains('result-pass')
        );
        if (isPass) {
          console.log(`  ✅ Check PASSED: "${feedback?.substring(0, 60)}"`);
          results.pass++;
        } else {
          console.log(`  ❌ Check FAILED: "${feedback}"`);
          results.fail++;
          results.errors.push(`${level.id}: check failed - ${feedback}`);
        }
      } else {
        console.log(`  ⚠️  No result card after check`);
        results.fail++;
        results.errors.push(`${level.id}: no result card`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📋 RESULTS: ${results.pass} passed, ${results.fail} failed`);
  console.log('='.repeat(60));
  if (results.errors.length > 0) {
    console.log('Errors:');
    results.errors.forEach((e) => console.log(`  ❌ ${e}`));
  }

  // Print any global console errors we missed
  const allErrors = consoleLogs.filter(
    (l) => (l.includes('[error]') || l.includes('[pageerror]')) && !l.includes('favicon')
  );
  if (allErrors.length > 0) {
    console.log('\nConsole errors:');
    [...new Set(allErrors)].forEach((e) => console.log(`  ${e}`));
  }

  await browser.close();
  console.log('\n✅ Test complete');
  if (results.fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
