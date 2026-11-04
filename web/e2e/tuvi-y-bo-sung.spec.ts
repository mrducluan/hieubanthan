// TV-YBS — ý Tử vi bổ sung trong Luận giải toàn bộ: khung "Góc nhìn khác" GẬP sẵn (ý riêng trường phái, tham khảo), mỗi ý
// có "Đúng với mình" với mã `ds.<chương>.yb.*` + phái riêng; mở khung đo `chart_interacted{kind: goc_nhin_khac_mo}`
// chỉ kèm mã chương + số ý. Hộp đang có được làm giàu hiện dòng ý bổ sung nhỏ dưới lời chính.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

type Y = { tieu_de: string; ma_mau: string; phai: string };
type C = { ma: string; khoa?: boolean; goc_nhin_khac?: { y: Y[] }; hop?: { y_bo_sung?: unknown; ma_mau?: string }[] };

test("Góc nhìn khác gập sẵn, mở ra có ghi chú tham khảo + kiểm chứng theo phái riêng; đo chỉ mã", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/tuvi/luan-giai")),
    page.getByRole("button", { name: "Xem luận giải" }).click(),
  ]);
  expect(res.status()).toBe(200);
  const bc = await res.json();
  const mo = (bc.chuong as C[]).filter((c) => !c.khoa);
  const c = mo.find((x) => x.goc_nhin_khac?.y.length);
  test.skip(!c, "lá mẫu không có ý Góc nhìn khác ở chương đang mở");
  for (const y of c!.goc_nhin_khac!.y) {
    expect(y.ma_mau).toMatch(new RegExp(`^ds\\.${c!.ma}\\.yb\\.[a-z0-9_.]+$`));
    expect(y.phai).toBe("tam_hop_hien_dai");
  }
  // chương khoá (SAO-2) không mang khung Góc nhìn khác xuống trình duyệt
  for (const k of (bc.chuong as C[]).filter((x) => x.khoa)) expect(k.goc_nhin_khac).toBeUndefined();

  const ch = page.getByTestId(`lg-chuong-${c!.ma}`);
  if ((await ch.getAttribute("data-mo")) !== "1") await ch.getByTestId("lg-mo-chuong").click();
  const khung = ch.getByTestId("goc-nhin-khac");
  await expect(khung).toBeVisible();
  await expect(khung.getByTestId("goc-nhin-khac-y").first()).toBeHidden();          // gập sẵn
  await khung.getByTestId("goc-nhin-khac-mo").click();
  await expect(khung.getByTestId("goc-nhin-khac-ghi-chu")).toContainText("tham khảo");
  await expect(khung.getByTestId("goc-nhin-khac-y")).toHaveCount(c!.goc_nhin_khac!.y.length);
  await expect(khung.getByTestId("goc-nhin-khac-y").first().getByRole("button", { name: "Đúng với mình" })).toBeVisible();
  const sk = await page.evaluate(() => ((window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? [])
    .filter((e) => e.su_kien === "chart_interacted" && e.kind === "goc_nhin_khac_mo"));
  expect(sk).toHaveLength(1);
  expect(sk[0]).toMatchObject({ kind: "goc_nhin_khac_mo", chuong: c!.ma, so_y: c!.goc_nhin_khac!.y.length });
  expect(Object.keys(sk[0]!).sort()).toEqual(["chuong", "feature_version", "kind", "mo_dun", "so_y", "su_kien"]);
});
