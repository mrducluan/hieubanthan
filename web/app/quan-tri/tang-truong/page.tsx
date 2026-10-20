// QT-4 — Tăng trưởng: đối chiếu mục tiêu "thu hút → quay lại → mời bạn → nạp Sao" (docs/MUC-TIEU-TANG-TRUONG.md)
// bằng số thật: phễu sự kiện PostHog, Search Console (truy vấn, trang, CƠ HỘI viết nội dung), GA4 (kênh, sự kiện).
// Mọi khoá chỉ đọc, đặt ở env Vercel. Thiếu khoá → mục đó hiện hướng dẫn kết nối. Cache 1 giờ.
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri } from "@/lib/quan-tri";
import { coTaiKhoan } from "@/lib/cua-sao";
import { MAU_KIEM_CHUNG, tinhKiemChung, type DongKiemChung } from "@/lib/kiem-chung";
import { baoCaoGa4, baoCaoGsc, baoCaoPosthog, MAU_TOI_THIEU, tinhGate, type BaoCaoPosthog, type DongGsc, type KetQua } from "@/lib/so-lieu-ngoai";

export const metadata: Metadata = { title: "Tăng trưởng" };

const so = (n: number) => Math.round(n).toLocaleString("vi-VN");
const pt = (n: number) => `${(n * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
const duongDan = (u: string) => { try { return decodeURI(new URL(u).pathname); } catch { return u; } };

function ChuaCo({ kq, huongDan }: { kq: Extract<KetQua<unknown>, { ok: false }>; huongDan: string }) {
  return (
    <div className="space-y-1 text-sm">
      <p className={kq.chuaKetNoi ? "text-fg-muted" : "text-cinnabar"} role={kq.chuaKetNoi ? undefined : "alert"}>{kq.loi}</p>
      {kq.chuaKetNoi && <p className="text-xs text-fg-faint">{huongDan}</p>}
    </div>
  );
}

function Thanh({ ten, gt, max, phu }: { ten: string; gt: number; max: number; phu?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm" title={`${ten}: ${so(gt)}${phu ? ` · ${phu}` : ""}`}>
      <span className="truncate text-fg-muted">{ten}</span>
      <span className="h-3 rounded-r-[4px] bg-gold/70" style={{ width: `${max ? Math.max(gt ? 1 : 0, (gt / max) * 100) : 0}%` }} />
      <span className="whitespace-nowrap text-right">{so(gt)}{phu && <span className="ml-1 text-xs text-fg-faint">{phu}</span>}</span>
    </div>
  );
}

function BangGsc({ ds, cot }: { ds: DongGsc[]; cot: string }) {
  if (ds.length === 0) return <p className="text-sm text-fg-faint">Chưa có dữ liệu.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-fg-muted">
          <th className="py-1 font-normal">{cot}</th><th className="text-right font-normal">Nhấp</th>
          <th className="text-right font-normal">Hiển thị</th><th className="text-right font-normal">CTR</th><th className="text-right font-normal">Vị trí</th>
        </tr></thead>
        <tbody>
          {ds.map((d) => (
            <tr key={d.keys.join("|")} className="border-t border-line/60">
              <td className="max-w-[22rem] py-1.5 pr-2 [overflow-wrap:anywhere]">
                {d.keys.length > 1 ? <>{d.keys[0]}<span className="block text-xs text-fg-faint">{duongDan(d.keys[1] ?? "")}</span></>
                  : d.keys[0]?.startsWith("http") ? duongDan(d.keys[0]) : d.keys[0]}
              </td>
              <td className="text-right">{so(d.clicks)}</td><td className="text-right">{so(d.impressions)}</td>
              <td className="text-right">{pt(d.ctr)}</td><td className="text-right">{d.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TEN_MANG: Record<string, string> = {
  thanso: "Thần số (Bản thân)", xem_ngay: "Xem ngày tốt", tuoi_lam_nha: "Tuổi làm nhà", tuoi_xong_dat: "Tuổi xông đất", thanso_sau: "Thần số chiều sâu", tuvi: "Tử vi", battu: "Bát tự", kinhdich: "Kinh Dịch",
  phongthuy: "Phong thuỷ", hopdoi: "Hợp đôi", hom_nay: "Hôm nay", khac: "Chưa gắn mảng (bản cũ)",
};

/** Gate 1 / Gate 2 (docs/VIEC-CUA-ANH.md mục L): tỉ lệ, ngưỡng đề xuất, đủ mẫu chưa, tách theo mảng. */
function BangGate({ du }: { du: BaoCaoPosthog }) {
  if (du.gateLoi) return <p className="mt-3 text-sm text-cinnabar" role="alert">Chưa đọc được số Gate: {du.gateLoi} (thử lại sau một giờ).</p>;
  const ds = tinhGate(du.gate, { taiKhoanBat: coTaiKhoan() });
  const duMau = du.gate.bat_dau >= MAU_TOI_THIEU;
  return (
    <div className="mt-4 space-y-5" data-testid="qt-gate">
      <p className={duMau ? "text-sm text-jade" : "text-sm text-moon"}>
        {duMau ? `Đủ mẫu: ${so(du.gate.bat_dau)} người bắt đầu xem (≥ ${MAU_TOI_THIEU}).`
          : `Chưa đủ mẫu: ${so(du.gate.bat_dau)}/${MAU_TOI_THIEU} người bắt đầu xem — tỉ lệ còn dao động mạnh, chưa kết luận đạt/chưa đạt.`}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-fg-muted">
            <th className="py-1 font-normal">Cổng</th><th className="font-normal">Chỉ số</th><th className="text-right font-normal">Tử / mẫu</th>
            <th className="text-right font-normal">Tỉ lệ</th><th className="text-right font-normal">Ngưỡng (đề xuất)</th><th className="text-right font-normal">Kết luận</th>
          </tr></thead>
          <tbody>
            {ds.map((g) => (
              <tr key={g.ma} className="border-t border-line/60">
                <td className="py-1.5 text-fg-muted">{g.cong}</td><td>{g.ten}</td>
                <td className="text-right">{so(g.tu)} / {so(g.mau)}</td>
                <td className="text-right">{g.ti_le === null ? "—" : pt(g.ti_le)}</td>
                <td className="text-right text-fg-muted">≥ {pt(g.nguong)}</td>
                <td className={`text-right ${g.dat === null ? "text-fg-faint" : g.dat ? "text-jade" : "text-cinnabar"}`}>
                  {g.dat === null ? "chờ số" : g.dat ? "đạt" : "chưa đạt"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {du.theoMang.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="mb-2 text-base">Theo mảng — bước rơi nhiều nhất</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-fg-muted">
              <th className="py-1 font-normal">Mảng</th><th className="text-right font-normal">Bắt đầu</th><th className="text-right font-normal">Đọc hết</th>
              <th className="text-right font-normal">Đọc hết %</th><th className="text-right font-normal">Góp ý</th><th className="text-right font-normal">“Có giúp” %</th>
            </tr></thead>
            <tbody>
              {du.theoMang.map((m) => (
                <tr key={m.mo_dun} className="border-t border-line/60">
                  <td className="py-1.5">{TEN_MANG[m.mo_dun] ?? m.mo_dun}</td>
                  <td className="text-right">{so(m.bat_dau)}</td><td className="text-right">{so(m.xong)}</td>
                  <td className="text-right">{m.bat_dau ? pt(m.xong / m.bat_dau) : "—"}</td>
                  <td className="text-right">{so(m.gop_y)}</td><td className="text-right">{m.gop_y ? pt(m.co_giup / m.gop_y) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-fg-faint">Mỗi chỉ số đếm số trình duyệt khác nhau trong 28 ngày, chỉ tính sự kiện từ bản đo mới (gate_v1, 2026-10-13).
        Đọc hết = cuộn tới cuối bài và ở lại ≥ 10 giây. Lưu hồ sơ = chủ động lưu vào tài khoản (chưa bật tài khoản → chờ số).
        K: người tạo hồ sơ lần đầu sau khi mở link mời / thẻ / link Hôm nay của bạn bè, chia cho số người tạo link.</p>
    </div>
  );
}

/** KC-0: phiếu "Đúng với mình / Chưa đúng" theo mã mẫu Tử vi. Chỉ hiện tỉ lệ khi đủ mẫu. */
function BangKiemChung({ ds }: { ds: DongKiemChung[] | null }) {
  if (ds === null) return <p className="mt-3 text-sm text-cinnabar" role="alert">Chưa đọc được phiếu kiểm chứng (thử lại sau một giờ).</p>;
  const kq = tinhKiemChung(ds);
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm">Tổng phiếu: <b>{so(kq.tongPhieu)}</b> · mã đủ mẫu (≥ {MAU_KIEM_CHUNG}): <b>{so(kq.du.length)}</b>
        {kq.chuaDu > 0 && <span className="text-fg-muted"> · {so(kq.chuaDu)} mã chưa đủ mẫu (chưa hiện)</span>}</p>
      {kq.du.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-fg-muted">
              <th className="py-1 font-normal">Khối</th><th className="font-normal">Mẫu</th><th className="text-right font-normal">Đúng</th>
              <th className="text-right font-normal">Chưa đúng</th><th className="text-right font-normal">Tỉ lệ đúng</th>
            </tr></thead>
            <tbody>
              {kq.du.map((d) => (
                <tr key={`${d.loai}|${d.mau}`} className="border-t border-line/60">
                  <td className="py-1.5 text-fg-muted">{d.loai === "phi_hoa" ? "Đường bay" : "3 tháng tới"}</td>
                  <td>{d.nhan}<span className="block text-xs text-fg-faint"><code>{d.mau}</code></span></td>
                  <td className="text-right">{so(d.dung)}</td><td className="text-right">{so(d.chua_dung)}</td>
                  <td className="text-right">{pt(d.ti_le_dung)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-fg-faint">Chưa có mã nào đủ {MAU_KIEM_CHUNG} phiếu.</p>}
    </div>
  );
}

export default async function Page() {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const [ph, gsc, ga] = await Promise.all([baoCaoPosthog(), baoCaoGsc(), baoCaoGa4()]);

  return (
    <div className="space-y-6" data-testid="qt-tang-truong">
      <div>
        <h1 className="text-2xl">Tăng trưởng</h1>
        <p className="mt-1 text-sm text-fg-muted">28–30 ngày gần nhất. Mục tiêu: thu hút → xem → quay lại → mời bạn → nạp Sao. Số liệu cập nhật mỗi giờ.</p>
      </div>

      <Card>
        <h2 className="text-lg">Gate 1 · Gate 2 (PostHog, 28 ngày)</h2>
        <p className="mt-1 text-sm text-fg-muted">Gate 1: bài đọc có giá trị (đọc hết, thấy có giúp, lưu hồ sơ). Gate 2: tự lan truyền (chia sẻ, K). Qua Gate 2 mới mở giai đoạn thu tiền.</p>
        {ph.ok ? <BangGate du={ph.du} /> : <div className="mt-3"><ChuaCo kq={ph} huongDan="Cần khoá PostHog như mục Phễu bên dưới." /></div>}
      </Card>

      {ph.ok && ph.du.yDinh && (
        <Card data-testid="qt-y-dinh">
          <h2 className="text-lg">Ý định hôm nay (PostHog, 28 ngày)</h2>
          <p className="mt-1 text-sm text-fg-muted">Chỉ đếm MÃ — câu người dùng gõ không bao giờ được lưu. Cách đọc và bổ sung từ khoá: skill <code>do-y-dinh</code>.</p>
          <p className="mt-3 text-sm">Câu gõ tay: <b>{so(ph.du.yDinh.goTay)}</b> · không nhận ra: <b>{so(ph.du.yDinh.khongNhanRa)}</b>
            {ph.du.yDinh.goTay > 0 && ` (${Math.round((100 * ph.du.yDinh.khongNhanRa) / ph.du.yDinh.goTay)}%, mục tiêu < 25%)`}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-fg-muted">Ý định hay chọn</p>
              <ul className="mt-1 space-y-0.5 text-sm">{ph.du.yDinh.top.map((x) => <li key={x.ma}><code>{x.ma}</code> — {so(x.n)}</li>)}</ul></div>
            <div><p className="text-sm text-fg-muted">Nhóm việc chưa hỗ trợ (từ câu không nhận ra)</p>
              <ul className="mt-1 space-y-0.5 text-sm">{ph.du.yDinh.nhomMoi.map((x) => <li key={x.ma}><code>{x.ma}</code> — {so(x.n)}</li>)}</ul></div>
          </div>
        </Card>
      )}

      <Card data-testid="qt-kiem-chung">
        <h2 className="text-lg">Kiểm chứng Tử vi (PostHog, 90 ngày)</h2>
        <p className="mt-1 text-sm text-fg-muted">Người xem bấm “Đúng với mình / Chưa đúng” trên thẻ Đường bay tứ hoá và tháng đang diễn ra của 3 tháng tới.
          Chỉ đếm MÃ mẫu; mỗi trình duyệt tính một lần cho mỗi kết quả. Dùng để người biên tập xem lại KB (xếp tỉ lệ đúng thấp lên đầu) — <b>không tự đổi luận giải</b>.</p>
        {ph.ok ? <BangKiemChung ds={ph.du.kiemChung} /> : <div className="mt-3"><ChuaCo kq={ph} huongDan="Cần khoá PostHog như mục Phễu bên dưới." /></div>}
      </Card>

      <Card>
        <h2 className="text-lg">Phễu sản phẩm (PostHog, 28 ngày)</h2>
        {ph.ok ? (
          <div className="mt-4 space-y-2">
            {(() => {
              const max = Math.max(1, ...ph.du.pheu.map((x) => x.nguoi));
              return ph.du.pheu.map((x) => <Thanh key={x.su_kien} ten={x.ten} gt={x.nguoi} max={max} phu={`${so(x.luot)} lượt`} />);
            })()}
            <p className="pt-2 text-xs text-fg-faint">Cột = số trình duyệt khác nhau; số nhỏ = tổng lượt.</p>
            {ph.du.quayLai && (
              <p className="text-sm">Quay lại tuần này: <b className="text-gold">
                {ph.du.quayLai.truoc ? pt(ph.du.quayLai.tro_lai / ph.du.quayLai.truoc) : "—"}</b>
                <span className="ml-1 text-fg-muted">({so(ph.du.quayLai.tro_lai)} / {so(ph.du.quayLai.truoc)} trình duyệt ghé tuần trước)</span></p>
            )}
          </div>
        ) : <div className="mt-3"><ChuaCo kq={ph} huongDan="PostHog → Settings → Personal API keys → tạo khoá quyền query:read → đặt POSTHOG_PERSONAL_API_KEY và POSTHOG_PROJECT_ID (số trong URL dự án) trên Vercel." /></div>}
      </Card>

      <Card>
        <h2 className="text-lg">Google Search Console</h2>
        {gsc.ok ? (
          <div className="mt-4 space-y-6">
            {gsc.du.tong && (
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                {[["Nhấp", so(gsc.du.tong.clicks)], ["Hiển thị", so(gsc.du.tong.impressions)], ["CTR", pt(gsc.du.tong.ctr)], ["Vị trí TB", gsc.du.tong.position.toFixed(1)]]
                  .map(([t, v]) => <div key={t}><p className="font-serif text-3xl">{v}</p><p className="text-xs text-fg-muted">{t}</p></div>)}
              </div>
            )}
            <div>
              <h3 className="text-base text-gold">Cơ hội — đang ở trang 1–2, nhiều hiển thị, ít nhấp</h3>
              <p className="mb-2 text-xs text-fg-muted">Sửa tiêu đề/mô tả hoặc viết sâu hơn trang này (Kho tri thức) để kéo thêm người vào.</p>
              <BangGsc ds={gsc.du.coHoi} cot="Truy vấn · trang" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div><h3 className="mb-2 text-base">Truy vấn hàng đầu</h3><BangGsc ds={gsc.du.truyVan} cot="Truy vấn" /></div>
              <div><h3 className="mb-2 text-base">Trang hàng đầu</h3><BangGsc ds={gsc.du.trang} cot="Trang" /></div>
            </div>
          </div>
        ) : <div className="mt-3"><ChuaCo kq={gsc} huongDan="Google Cloud → tạo Service account → Keys → JSON → dán nội dung vào GOOGLE_SERVICE_ACCOUNT_JSON (Vercel). Search Console → Cài đặt → Người dùng → thêm email service account, quyền Bị hạn chế. Xem docs/VIEC-CUA-ANH.md mục Q7." /></div>}
      </Card>

      <Card>
        <h2 className="text-lg">Google Analytics 4 (28 ngày)</h2>
        {ga.ok ? (
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {[["Người dùng", ga.du.tong.nguoi], ["Người mới", ga.du.tong.nguoi_moi], ["Phiên", ga.du.tong.phien], ["Phiên tương tác", ga.du.tong.phien_tuong_tac]]
                .map(([t, v]) => <div key={t as string}><p className="font-serif text-3xl">{so(v as number)}</p><p className="text-xs text-fg-muted">{t}</p></div>)}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2"><h3 className="text-base">Kênh</h3>
                {(() => { const max = Math.max(1, ...ga.du.kenh.map((k) => k.phien)); return ga.du.kenh.map((k) => <Thanh key={k.ten} ten={k.ten} gt={k.phien} max={max} phu="phiên" />); })()}
              </div>
              <div className="space-y-2"><h3 className="text-base">Sự kiện</h3>
                {(() => { const max = Math.max(1, ...ga.du.suKien.map((k) => k.so)); return ga.du.suKien.map((k) => <Thanh key={k.ten} ten={k.ten} gt={k.so} max={max} />); })()}
              </div>
            </div>
          </div>
        ) : <div className="mt-3"><ChuaCo kq={ga} huongDan="Dùng cùng service account: GA4 → Quản trị → Quản lý quyền truy cập thuộc tính → thêm email service account (Người xem) → đặt GA4_PROPERTY_ID (Quản trị → Chi tiết thuộc tính)." /></div>}
      </Card>
    </div>
  );
}
