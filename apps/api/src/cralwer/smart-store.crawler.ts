import { getBrowser } from "./browser";

export async function crawlSmartstore(url: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  const title = await page
    .locator("meta[property='og:title']")
    .getAttribute("content");
  const price = await page
    .locator(".price_area .sale")
    .innerText()
    .catch(() => "가격 정보 없음");

  await page.close();
  return { title, price };
}
