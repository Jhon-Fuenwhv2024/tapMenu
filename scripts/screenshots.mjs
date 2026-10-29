import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const BASE = "http://127.0.0.1:43123";
const OUT = "/opt/cursor/artifacts";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: "es-CO",
});
const page = await context.newPage();

// 1. Customer menu
await page.goto(`${BASE}/r/resto-demo/m/t1`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Tu nombre").fill("Ana");
await page.getByRole("button", { name: "Ver la carta" }).click();
await page.getByPlaceholder("Buscar platos").waitFor({ timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/customer-menu.png`, fullPage: false });
console.log("saved customer-menu.png");

// 2. Carta 4D
const fourD = page.locator("li button", { hasText: "4D" }).first();
await fourD.click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/carta-4d.png`, fullPage: false });
console.log("saved carta-4d.png");
await page.getByRole("button").filter({ has: page.locator("svg") }).first().click().catch(() => {});
// close modal via X if present
const closeBtn = page.locator('button').filter({ hasText: "" }).nth(0);

// 3. Login cocina -> KDS
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "cocina@restodemo.co");
await page.fill("#password", "tapmenu123");
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL(/cocina/, { timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/kds-cocina.png`, fullPage: false });
console.log("saved kds-cocina.png");

// 4. Admin as owner
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "owner@restodemo.co");
await page.fill("#password", "tapmenu123");
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL(/admin/, { timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/admin-panel.png`, fullPage: false });
console.log("saved admin-panel.png");

await browser.close();
console.log("done");
void closeBtn;
