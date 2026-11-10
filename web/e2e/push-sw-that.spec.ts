// BT-UI đợt 3 — chạy SERVICE WORKER THẬT (public/sw.js) trong trình duyệt: đẩy một thông báo vào sw.js như máy chủ push sẽ
// đẩy → thông báo hiện đúng chữ → bấm thông báo → trang mở đúng mục (mốc "Tuần này của bạn": /hom-nay#tuan-nay, khu tự cuộn tới).
// Phần mã hoá RFC 8291 + chọn thông báo có ở web-push.spec.ts; ở đây là khâu cuối trên máy người dùng. Và nút cài app
// (Android / máy tính: beforeinstallprompt) — bản iPhone có ở web-push.spec.ts.
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

// Kiểu tối thiểu của phạm vi service worker (tsconfig của web không nạp lib "webworker").
interface ThongBaoSw { title: string; body: string; tag: string; data: unknown }
interface PhamViSw { registration: { getNotifications(): Promise<ThongBaoSw[]> }; dispatchEvent(e: Event): boolean }
type TaoSuKien = new (loai: string, init: { notification: ThongBaoSw }) => Event;

/** Đăng ký sw.js, chờ hoạt động, trả hàm phát sự kiện `push` NGAY TRONG service worker của đúng ngữ cảnh trình duyệt này.
 *  (Bản đầu dùng CDP ServiceWorker.deliverPushMessage theo registrationId: CDP liệt kê đăng ký của MỌI ngữ cảnh cùng origin
 *  trong trình duyệt, nên khi chạy chung cả bộ có lúc gói đi nhầm sang đăng ký của test trước → thông báo không hiện.) */
async function moSw(page: Page, context: BrowserContext) {
  await page.evaluate(async () => { await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready; });
  const sw = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const day = (goi: unknown) => sw.evaluate((chu) => {
    const SuKien = (self as unknown as { PushEvent: new (loai: string, init: { data: string }) => Event }).PushEvent;
    (self as unknown as PhamViSw).dispatchEvent(new SuKien("push", { data: chu }));
  }, JSON.stringify(goi));
  const thongBao = () => sw.evaluate(async () => (await (self as unknown as PhamViSw).registration.getNotifications())
    .map((n) => ({ title: n.title, body: n.body, tag: n.tag, url: (n.data as { url?: string } | null)?.url ?? null })));
  const bam = () => sw.evaluate(async () => {
    const g = self as unknown as PhamViSw;
    const [n] = await g.registration.getNotifications();
    const SuKien = (self as unknown as { NotificationEvent: TaoSuKien }).NotificationEvent;
    g.dispatchEvent(new SuKien("notificationclick", { notification: n! }));
  });
  return { day, thongBao, bam };
}

test("sw.js thật: thông báo sáng thứ Hai hiện đúng chữ, bấm vào mở Hôm nay đúng mục Tuần này của bạn (trang tự cuộn tới khu tuần)", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["notifications"], { origin: baseURL });
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  const { day, thongBao, bam } = await moSw(page, context);
  // Đẩy lại nếu service worker vừa đăng ký chưa kịp nhận gói đầu (cùng tag nên vẫn chỉ MỘT thông báo).
  await expect(async () => {
    await day({ title: "Tuần này của bạn", body: "Từ nay tới Chủ Nhật có 1 ngày vừa đẹp theo lịch vừa không vướng tuổi bạn. Đáng để ý nhất: Thứ Ba 17/11 — ngày thuận nhất tuần.",
      url: "/hom-nay#tuan-nay", tag: "nhac-2026-11-16" });
    await expect.poll(thongBao, { timeout: 3000 }).toEqual([expect.objectContaining({ title: "Tuần này của bạn", tag: "nhac-2026-11-16", url: "/hom-nay#tuan-nay",
      body: expect.stringContaining("ngày thuận nhất tuần") })]);
  }).toPass({ timeout: 20_000 });
  await bam();
  await expect(page).toHaveURL(/\/hom-nay\?tu=push#tuan-nay$/);
  const muc = page.getByTestId("tuan-cua-toi");
  await expect(muc.getByTestId("tuan-luoi").getByRole("tab")).toHaveCount(7);
  await expect(muc).toBeInViewport();
});

test("sw.js thật: gói lạ (đường dẫn ngoài site, thiếu chữ) → vẫn một thông báo an toàn, mở trong site; cùng tag thì thay nhau", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["notifications"], { origin: baseURL });
  await napHoSo(page);
  await page.goto("/hom-nay");
  const { day, thongBao, bam } = await moSw(page, context);
  await expect(async () => {
    await day({ title: "", url: "https://example.com/x", tag: "nhac-x" });
    await expect.poll(thongBao, { timeout: 3000 }).toEqual([expect.objectContaining({ title: "Hiểu Bản Thân", body: "Mốc bạn đã đánh dấu cho hôm nay." })]);
  }).toPass({ timeout: 20_000 });
  expect((await thongBao())[0]!.url).toMatch(/^\//);                       // không bao giờ giữ link ngoài site
  await day({ title: "Mốc thứ hai", body: "x", url: "/kinh-dich", tag: "nhac-x" });
  await expect.poll(async () => (await thongBao()).map((n) => n.title)).toEqual(["Mốc thứ hai"]);   // ≤ 1 thông báo / ngày trên máy
  await bam();
  await expect(page).toHaveURL(/\/kinh-dich\?tu=push$/);
});

test("mời cài app (Android / máy tính): có beforeinstallprompt + ghé ngày thứ hai → nút Cài; bấm gọi prompt của trình duyệt rồi ẩn", async ({ page }) => {
  await napHoSo(page);
  const homQua = new Date(Date.now() + 7 * 3_600_000 - 86_400_000).toISOString().slice(0, 10);
  await page.addInitScript((d) => {
    if (!localStorage.getItem("hbt.cai_app.v1")) localStorage.setItem("hbt.cai_app.v1", JSON.stringify({ ghe: [d] }));
    (window as unknown as { __goi: number }).__goi = 0;
  }, homQua);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  await expect(page.getByTestId("moi-cai-app")).toHaveCount(0);             // trình duyệt chưa báo cài được → không mời suông
  await page.evaluate(() => {
    const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    e.prompt = async () => { (window as unknown as { __goi: number }).__goi += 1; };
    e.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(e);
  });
  const m = page.getByTestId("moi-cai-app");
  await expect(m).toHaveAttribute("data-cach", "nut");
  await m.getByRole("button", { name: "Cài lên màn hình chính" }).click();
  await expect(m).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __goi: number }).__goi)).toBe(1);
});
