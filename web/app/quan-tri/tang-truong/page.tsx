// QT-4 — Tăng trưởng: đối chiếu mục tiêu "thu hút → quay lại → mời bạn → nạp Sao" (docs/MUC-TIEU-TANG-TRUONG.md)
// bằng số thật: phễu sự kiện PostHog, Search Console (truy vấn, trang, CƠ HỘI viết nội dung), GA4 (kênh, sự kiện).
// Mọi khoá chỉ đọc, đặt ở env Vercel. Thiếu khoá → mục đó hiện hướng dẫn kết nối. Cache 1 giờ.
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri } from "@/lib/quan-tri";
import { baoCaoGa4, baoCaoGsc, baoCaoPosthog, type DongGsc, type KetQua } from "@/lib/so-lieu-ngoai";

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
