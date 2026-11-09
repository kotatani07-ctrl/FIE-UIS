import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home renders the official faculty name accessibly", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Fakultas Ilmu Ekonomi" }),
  ).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("mobile navigation traps focus, locks scrolling, and closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Buka menu navigasi" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("unknown client routes show a noindex not-found page", async ({
  page,
}) => {
  await page.goto("/halaman-tidak-ada");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Halaman tidak ditemukan",
    }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("the home page fits a 320px dark-mode viewport without horizontal scrolling", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("theme", "dark");
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.client);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("navbar links navigate to real pages, not anchors", async ({ page }) => {
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Navigasi utama" });
  const targets = [
    {
      name: "Program Studi",
      path: /\/prodi$/,
      heading: "Program studi sarjana",
    },
    {
      name: "Berita",
      path: /\/informasi\/berita$/,
      heading: "Berita dan artikel",
    },
    {
      name: "Agenda",
      path: /\/informasi\/agenda$/,
      heading: "Agenda fakultas",
    },
    {
      name: "Pengumuman",
      path: /\/informasi\/pengumuman$/,
      heading: "Pengumuman resmi",
    },
    { name: "Kontak", path: /\/kontak$/, heading: "Kontak" },
  ];

  for (const target of targets) {
    await navigation.getByRole("link", { name: target.name }).click();
    await expect(page).toHaveURL(target.path);
    await expect(
      page.getByRole("heading", { level: 1, name: target.heading }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByRole("heading", { level: 1, name: "Fakultas Ilmu Ekonomi" }),
    ).toBeVisible();
  }
});

test("in-page anchors point to a target that exists", async ({ page }) => {
  await page.goto("/");

  const broken = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
      .map((anchor) => anchor.getAttribute("href") ?? "")
      .filter((href) => href.length > 1 && !document.querySelector(href)),
  );
  expect(broken).toEqual([]);

  await expect(page.locator('a[href="#konten-utama"]')).toHaveCount(1);
  await expect(page.locator("#konten-utama")).toHaveCount(1);
});
