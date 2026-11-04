// TV-VONG + rà bố cục lá số Tử vi (dữ liệu engine thật — playwright.config khởi động engine):
//  · thẻ chi tiết cung có dòng vòng Thái Tuế + Tướng tiền của lớp hạn đang bật, tên theo phái đang chọn;
//  · dải giai đoạn 10 năm khớp ô ĐẠI HẠN trên lá số (năm đầu / năm cuối engine trả);
//  · không chữ nào tràn ra ngoài ô cung hay đè lên chữ khác; nhãn Tuần/Triệt không đè chữ (1280px + 375px vừa khung).
import { test, expect, type Locator, type Page } from "@playwright/test";
import { napHoSo, HO_SO_MAU } from "./_hoso";

const HO_SO = {
  thuong: HO_SO_MAU,
  nhuan: { ...HO_SO_MAU, ho_ten: "Trần Thu Hà", ngay: 5, thang: 7, nam: 1990, gio: "12:00", gioi_tinh: "nu" },   // tháng 5 nhuận
  ty_muon: { ...HO_SO_MAU, ho_ten: "Lê Minh", ngay: 24, thang: 10, nam: 1988, gio: "23:30" },                     // giờ Tý muộn
};

async function moLaSo(page: Page, hoSo: object = HO_SO_MAU) {
  await napHoSo(page, hoSo);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toContainText("LƯU NIÊN");
  return laSo;
}

async function batLop(page: Page, dh: boolean, ln: boolean) {
  await page.getByTestId("tv-hien-thi-mo").click();
  for (const [ten, muon] of [["Lớp đại hạn", dh], ["Lớp lưu niên", ln]] as const) {
    const nut = page.getByRole("button", { name: ten });
    if ((await nut.getAttribute("aria-pressed")) !== String(muon)) await nut.click();
  }
  await page.getByTestId("tv-hien-thi-mo").click();
}

const oCo = (laSo: Locator, nhan: string) =>
  laSo.locator("g[role='button']", { has: laSo.page().locator(`[data-nhan-han='${nhan}']`) });

test("vòng sao theo hạn: ô lưu niên có Thái Tuế của năm, ô đại hạn có Thái Tuế của hạn; tên đổi theo phái", async ({ page }) => {
  const laSo = await moLaSo(page);
  const vong = page.getByTestId("vong-han");
  // Mặc định chỉ lớp lưu niên → một dòng "Năm …".
  await expect(vong).toHaveCount(1);
  await expect(vong.first()).toHaveAttribute("data-lop", "ln");
  await expect(vong.first()).toContainText(" · ");
  // Vòng Thái Tuế của năm khởi tại cung lưu niên (chi năm xem) → ô đó là "Thái Tuế" (Nam phái).
  await oCo(laSo, "luu_nien").click();
  await expect(page.locator("[data-testid='vong-han'][data-lop='ln']")).toContainText(/^Thái Tuế · /);
  // Lời giải thích ở "Vì sao nói vậy" (thu gọn sẵn).
  const viSao = page.locator("section[aria-labelledby='ten-cung-chon'] [data-testid='vi-sao']").last();
  await viSao.getByRole("button").click();
  await expect(viSao).toContainText("không làm đổi mức");
  // Bật đại hạn: thêm dòng "Theo hạn 10 năm"; ô ĐẠI HẠN là Thái Tuế của vòng hạn.
  await batLop(page, true, true);
  await oCo(laSo, "dai_han").click();
  const dh = page.locator("[data-testid='vong-han'][data-lop='dh']");
  await expect(dh).toContainText(/^Thái Tuế · /);
  await expect(page.locator("section[aria-labelledby='ten-cung-chon']")).toContainText("Theo hạn 10 năm");
  // Phái Trung: tên iztro (Tuế Kiện) như vòng gốc.
  await page.getByTestId("tv-hien-thi-mo").click();
  await page.getByRole("tab", { name: "Phái Trung" }).click();
  await page.getByTestId("tv-hien-thi-mo").click();
  await expect(dh).toContainText(/^Tuế Kiện · /);
  // Tắt cả hai lớp → không còn dòng vòng hạn.
  await batLop(page, false, false);
  await expect(page.getByTestId("vong-han")).toHaveCount(0);
});

test("dải 10 năm ↔ lá số: chạm giai đoạn → ô ĐẠI HẠN đúng cung đó, năm xem = năm đầu giai đoạn", async ({ page }) => {
  const laSo = await moLaSo(page, HO_SO.nhuan);
  await batLop(page, true, false);
  const dai = page.getByTestId("dai-han-nhay");
  // Giai đoạn đang xem khớp ô ĐẠI HẠN.
  const tenCung = async (nut: Locator) => (await nut.getAttribute("aria-label"))!.match(/cung ([^,]+),/)![1]!;
  await expect(oCo(laSo, "dai_han")).toHaveAccessibleName(new RegExp(`^Cung ${await tenCung(dai.locator("[aria-current='true']"))}`));
  for (const k of [0, 3, 7]) {
    const nut = dai.getByRole("button").nth(k);
    const nhan = (await nut.getAttribute("aria-label"))!;
    const nam = nhan.match(/từ năm (\d{4})/)![1]!;
    await nut.click();
    await expect(page.getByRole("group", { name: "Năm xem hạn" })).toContainText(nam);
    await expect(dai.locator("[aria-current='true']")).toHaveAttribute("aria-label", nhan);
    await expect(oCo(laSo, "dai_han")).toHaveAccessibleName(new RegExp(`^Cung ${await tenCung(nut)}`));
    await expect(page.getByTestId("dong-hoa-han").locator("[data-lop='dh']")).toContainText(nhan.match(/^(\d+–\d+) tuổi/)![1]!);
  }
});

/** Mọi chữ đang hiện trong từng ô cung: nằm trong khung ô, không đè chữ khác; nhãn Tuần/Triệt không đè chữ nào. */
async function loiBoCuc(laSo: Locator): Promise<string[]> {
  return laSo.evaluate((svg) => {
    const loi: string[] = [];
    const R = (e: Element) => e.getBoundingClientRect();
    // Hai chữ cùng dòng (chồng dọc > 3px) phải cách nhau ≥ 3px theo chiều ngang — dính liền ("ĐH.Thiên DiTrường Sinh") cũng là lỗi.
    const giao = (a: DOMRect, b: DOMRect) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > -3 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 3;
    const tatCa: { r: DOMRect; chu: string }[] = [];
    for (const o of svg.querySelectorAll<SVGGElement>("g[role='button']")) {
      const khung = R(o.querySelector("rect")!);
      const chu = [...o.querySelectorAll("text")]
        .filter((t) => !t.closest("[data-nhan-han]") && (t.textContent ?? "").trim())
        .map((t) => ({ r: R(t), chu: t.textContent ?? "" }))
        .filter((x) => x.r.width > 0 && x.r.height > 0);
      const ten = o.getAttribute("aria-label")?.split(",")[0] ?? "?";
      for (const x of chu) {
        if (x.r.left < khung.left - 1 || x.r.right > khung.right + 1 || x.r.top < khung.top - 1 || x.r.bottom > khung.bottom + 1)
          loi.push(`${ten}: "${x.chu}" tràn khung ô`);
      }
      for (let i = 0; i < chu.length; i++)
        for (let j = i + 1; j < chu.length; j++)
          if (giao(chu[i]!.r, chu[j]!.r)) loi.push(`${ten}: "${chu[i]!.chu}" đè "${chu[j]!.chu}"`);
      tatCa.push(...chu);
    }
    for (const tt of svg.querySelectorAll("[data-tuan-triet]")) {
      const r = R(tt.querySelector("rect")!);
      if (r.width === 0) continue;
      for (const x of tatCa) if (giao(r, x.r)) loi.push(`nhãn ${tt.getAttribute("data-tuan-triet")} đè "${x.chu}"`);
    }
    return loi;
  });
}

for (const [ma, hs] of Object.entries(HO_SO)) {
  test(`bố cục lá số 1280px (${ma}): đủ hai lớp hạn — không tràn ô, không đè chữ`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const laSo = await moLaSo(page, hs);
    for (const [dh, ln] of [[false, false], [true, false], [true, true]] as const) {
      await batLop(page, dh, ln);
      if (dh) await expect(laSo.locator(".ls-chi-tiet [data-hoa-han^='dh-']")).toHaveCount(4);
      expect(await loiBoCuc(laSo), `lớp đại hạn=${dh}, lưu niên=${ln}`).toEqual([]);
    }
  });
}

test.describe("điện thoại 375px", () => {
  test.use({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
  test("vừa khung: chữ không tràn ô; dòng vòng hạn hiện trong chi tiết cung; không tràn ngang trang", async ({ page }) => {
    const laSo = await moLaSo(page, HO_SO.ty_muon);
    await batLop(page, true, true);
    expect(await loiBoCuc(laSo)).toEqual([]);
    await expect(page.getByTestId("vong-han")).toHaveCount(2);
    await page.getByTestId("vong-han").first().scrollIntoViewIfNeeded();
    await expect(page.getByTestId("vong-han").first()).toBeVisible();
    const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(tran).toBeLessThanOrEqual(0);
  });
});
