import { expect, test } from "@playwright/test";

const FIRST_SCENARIO_TITLE = "Bus-Stop Situational Opener";

test.describe("RizzCode golden path", () => {
  test("first visit → onboarding → three turns → judgment → XP → refresh persists", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /Practice courage\./ }),
    ).toBeVisible();

    // Start practice enters onboarding.
    await page
      .getByRole("link", { name: /Start practice/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(
      page.getByRole("heading", { name: /What do you want to improve/ }),
    ).toBeVisible();

    // Skip path lands on the curriculum.
    await page.getByRole("button", { name: /Skip — give me the default plan/ }).click();
    await expect(page).toHaveURL(/\/practice$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Ten situations/ }),
    ).toBeVisible();

    // Enter the first scenario via its card.
    await page
      .locator(".taste-scenario-card", { hasText: FIRST_SCENARIO_TITLE })
      .click();
    await expect(page).toHaveURL(/\/practice\/spark-bus-stop-opener$/);
    await expect(page.getByText("In person", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: /Begin — three turns/ }).click();

    // Three authored turns. The in-person composer asks "What would you say?".
    const composer = page.getByLabel("What would you say?");
    await expect(composer).toBeVisible();

    await composer.fill(
      "Hey, is this the 66 stop? You look like you have this commute solved.",
    );
    await page.getByRole("button", { name: /Send response/ }).click();
    await expect(page.getByText(/1 of 3 turns/)).toBeVisible();

    await composer.fill(
      "Ha, fair. I am new to this route — my walking app and my legs are in a dispute today.",
    );
    await page.getByRole("button", { name: /Send response/ }).click();
    await expect(page.getByText(/2 of 3 turns/)).toBeVisible();

    await composer.fill(
      "No pressure, but if the 66 is always this friendly I would not mind comparing commute notes over coffee.",
    );
    await page.getByRole("button", { name: /Finish and score/ }).click();

    // Judgment arrives (mock judge in e2e). Result shows score, verdict, criteria.
    await expect(page.getByText("Conversation score")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/out of 10/)).toBeVisible();
    await expect(page.getByText(/The rubric — five criteria/)).toBeVisible();
    await expect(page.getByText(/Likely simulated outcome/)).toBeVisible();
    await expect(page.getByText(/practice XP/).first()).toBeVisible();

    // Back to the curriculum: the scenario shows complete with a best score.
    await page.getByRole("button", { name: /^Curriculum/ }).click();
    await expect(page).toHaveURL(/\/practice$/);
    const card = page.getByRole("button", {
      name: new RegExp(FIRST_SCENARIO_TITLE),
    });
    await expect(card.getByText("Complete")).toBeVisible();
    await expect(card.getByText(/Best \d+\/10/)).toBeVisible();

    // Refresh preserves progress.
    await page.reload();
    await expect(
      page.getByRole("button", { name: new RegExp(FIRST_SCENARIO_TITLE) }).getByText("Complete"),
    ).toBeVisible();
    await expect(page.getByText(/Done\s+1\/10/)).toBeVisible();
  });

  test("input-sensitive results: different transcripts produce different scores", async ({
    page,
  }) => {
    const runAttempt = async (responses: string[]) => {
      await page.goto("/practice/spark-bus-stop-opener");
      await page.getByRole("button", { name: /Begin — three turns/ }).click();
      const composer = page.getByLabel("What would you say?");
      for (let index = 0; index < responses.length; index += 1) {
        // Low-effort replies may trigger an early persona exit; stop then.
        if (!(await composer.isVisible().catch(() => false))) break;
        await composer.fill(responses[index]);
        await page
          .getByRole("button", {
            name: index >= 2 ? /Finish and score/ : /Send response/,
          })
          .click();
        if (index < 2) {
          await expect(
            page
              .getByText(new RegExp(`${index + 1} of 3 turns`))
              .or(page.getByText("Conversation score"))
              .first(),
          ).toBeVisible();
        }
      }
      await expect(page.getByText("Conversation score")).toBeVisible({ timeout: 15000 });
      const scoreText = await page
        .locator(".taste-verdict__score strong")
        .textContent();
      return Number(scoreText);
    };

    const lazy = await runAttempt(["hey", "ok cool", "k"]);
    expect(lazy).toBeLessThanOrEqual(7);

    const crafted = await runAttempt([
      "Hey, is this the 66 stop? You look like you have this commute solved.",
      "Ha, fair. I am new here — my legs and my walking app are in a dispute today!",
      "No pressure, but I would not mind comparing commute notes over coffee sometime.",
    ]);
    expect(crafted).toBeGreaterThanOrEqual(6);
    expect(crafted).not.toBe(lazy);
  });

  test("unknown route renders a real not-found state", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await expect(
      page.getByRole("heading", { name: /left the conversation early/ }),
    ).toBeVisible();
  });

  test("leaderboard is labeled Demo", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByText(/Demo — seeded players plus you/)).toBeVisible();
    await expect(page.getByText("GooseDiplomat")).toBeVisible();
  });

  test("main flow works at 375px, 768px, and 1440px without horizontal overflow", async ({
    page,
  }) => {
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 720 });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { level: 1, name: /Practice courage\./ }),
      ).toBeVisible();
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      await page.goto("/practice/spark-bus-stop-opener");
      await expect(
        page.getByRole("button", { name: /Begin — three turns/ }),
      ).toBeVisible();
      const practiceOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(practiceOverflow).toBeLessThanOrEqual(1);

      await page.goto("/leaderboard");
      await expect(page.getByText(/Demo — seeded players plus you/)).toBeVisible();
      const boardOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(boardOverflow).toBeLessThanOrEqual(1);
    }
  });
});
