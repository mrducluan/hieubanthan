// Chặng 5 — Kiểm thử E2E /en/astrology (0% chữ Việt, Bi-Wheel Transit, Ma trận 13×13, Phẩm giá Ptolemy, Chu kỳ Đời, Composite),
// Sơ đồ Tam Tài (/co-van) và La bàn 8 hướng Kỳ Môn (/ky-mon).
import { expect, test, type Page } from "@playwright/test";

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

async function chuVietTrongMain(page: Page): Promise<string[]> {
  const chu = (await page.locator("main").innerText())
    .split("\n")
    .filter((l) => VIET.test(l.replace(/Tiếng Việt/g, "")));
  const thuocTinh = await page.$$eval(
    "main [aria-label], main [title], main [placeholder], main [alt]",
    (els) => els.flatMap((e) => ["aria-label", "title", "placeholder", "alt"].map((a) => e.getAttribute(a) ?? "")),
  );
  return [...chu, ...thuocTinh.filter((a) => VIET.test(a)).map((a) => `@${a}`)];
}

test.describe("Chặng 5 — /en/astrology & Hệ Biểu đồ Tương tác (Bi-Wheel, Góc chiếu, Ptolemy, Composite, Tam Tài, Kỳ Môn)", () => {
  test("/en/astrology: không lộ tiếng Việt, lập Bi-Wheel Transit, Ma trận Góc chiếu, Phẩm giá Ptolemy & Bản đồ Composite", async ({ page, request }) => {
    const html = await (await request.get("/en/astrology")).text();
    expect(html).toContain('<html lang="en"');
    expect(html).toMatch(/hrefLang="vi" href="[^"]*\/chiem-tinh"/i);

    await page.goto("/en/astrology");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Western birth chart");
    expect(await chuVietTrongMain(page)).toEqual([]);

    await page.getByTestId("ct-ngay-sinh").fill("1994-09-10");
    await page.getByTestId("ct-gio-sinh").fill("09:30");
    await page.getByTestId("ct-chon-noi").selectOption("ha-noi");
    await page.getByTestId("ct-nut-lap").click();

    await expect(page.getByTestId("ban-do-sao-svg")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("ban-do-nguyen-to-pham-gia")).toBeVisible();
    await expect(page.getByTestId("ma-tran-goc-chieu")).toBeVisible();
    await expect(page.getByTestId("chu-ky-doi-timeline")).toBeVisible();

    // Chuyển sang Vòng đôi Vận hạn (Bi-Wheel Natal × Live Transits)
    await page.getByTestId("nut-vong-biwheel").click();
    await expect(page.getByTestId("ct-ngay-xem")).toBeVisible();
    expect(await chuVietTrongMain(page)).toEqual([]);

    // Kiểm tra tab Cầu nối Đông – Tây không lộ chữ Việt
    await page.getByTestId("tab-ct-cau-noi").click();
    await expect(page.getByTestId("ct-cau-noi-dong-tay")).toContainText("BaZi");
    expect(await chuVietTrongMain(page)).toEqual([]);

    // Kiểm tra Synastry Bi-Wheel & Composite Midpoint Wheel
    await page.getByTestId("tab-ct-hop-doi").click();
    await page.getByTestId("syn-ngay-sinh-b").fill("1992-03-28");
    await page.getByTestId("syn-b-chon-noi").selectOption("tp-ho-chi-minh");
    await page.getByTestId("syn-dong-y").check();
    await page.getByTestId("syn-nut-soi").click();

    await expect(page.getByTestId("syn-ket-qua")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("nut-hop-doi-composite").click();
    await expect(page.getByTestId("khung-ban-do-composite")).toBeVisible();
    expect(await chuVietTrongMain(page)).toEqual([]);
  });

  test("/co-van hiển thị Sơ đồ Tam Tài trực giao & /ky-mon chuyển đổi La bàn 8 hướng mượt mà", async ({ page }) => {
    await page.goto("/co-van");
    await page.getByTestId("co-van-o-cau-hoi").fill("Tôi dự định đổi việc sang vai trò quản lý dự án vào quý tới");
    await page.getByTestId("co-van-ngay-sinh").fill("1993-06-15");
    await page.getByTestId("co-van-nut-gui").click();

    await expect(page.getByTestId("so-do-tam-tai-svg")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("tam-tai-dinh-nhan").click();

    await page.goto("/ky-mon");
    await expect(page.getByTestId("km-che-do-hinh")).toBeVisible();
    await page.getByTestId("km-che-do-hinh").getByRole("button", { name: /La bàn/i }).click();
    await expect(page.getByTestId("la-ban-ky-mon-svg")).toBeVisible();
  });
});
