import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("starter page renders the official faculty name accessibly", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Fakultas Ilmu Ekonomi" }),
  ).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});
