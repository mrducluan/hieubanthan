// SAO-2 — Doanh thu & Sao (chủ sở hữu): ai nạp, nạp bao nhiêu, gói nào bán chạy, Sao phát ra / tiêu vào đâu,
// ai mời được nhiều bạn (và bạn được mời có nạp không), đơn gần đây để đối soát. Hàm SQL thong_ke_doanh_thu (0013)
// kiểm vai trò + MFA trong DB và ghi nhật ký mỗi lần xem. Phễu xem trước → mở khoá ở trang Tăng trưởng (PostHog).
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri } from "@/lib/quan-tri";

export const metadata: Metadata = { title: "Doanh thu & Sao" };

type TK = {
  ngay: number;
  tong: { doanh_thu: number; don_tra: number; don_cho: number; don_huy: number; don_hoan: number; don_sai_tien: number; nguoi_nap: number; nguoi_tao_don: number };
  nguoi_nap_lan_dau: number;
  theo_ngay: { ngay: string; doanh_thu: number; don: number }[];
  theo_goi: { goi: string | null; don: number; doanh_thu: number }[];   // goi null = đơn hội viên năm (0028)
  top_nap: { email: string; tong: number; lan: number; lan_cuoi: string; so_du: number }[];
  top_moi: { email: string; so_moi: number; ban_da_nap: number }[];
  moi: { luot: number; ban_da_nap: number };
  sao: { mua: number; tang: number; tieu: number };
  tieu_theo: { muc: string; sao: number; luot: number }[];
};
/** SAO-V (0025) thong_ke_hoa_hong — hoa hồng giới thiệu một tầng (đơn tính theo lúc ghi hoa hồng). */
type HH = {
  ngay: number;
  tong: { don: number; sao_da_cong: number; sao_thu_hoi: number; qua_tran: number; doanh_thu_don: number; nguoi_moi: number };
  top: { email: string | null; don: number; sao: number; doanh_thu: number }[];
};
/** SAO-GL (0026) gian_lan_gan_day — cờ do máy ghi khi một thiết bị nhận lời mời cho nhiều tài khoản / trùng thiết bị. */
type GL = {
  tong: Record<string, number> | null;
  ds: { loai: string; nguoi_moi: string | null; duoc_moi: string | null; luc: string; chi_tiet: Record<string, unknown> | null }[];
};
const LOAI_GL: Record<string, string> = {
  nhieu_tai_khoan: "Một máy nhận lời mời cho nhiều tài khoản", cung_thiet_bi: "Người mời và người được mời cùng máy",
  hoa_hong_nghi: "Hoa hồng bị giữ lại (lời mời có cờ)",
};
/** SAO-HV (0028) thong_ke_hoi_vien — hội viên năm (đơn VND một lần, không hoa hồng). */
type HV = {
  ngay: number; bat: boolean; gia_vnd: number; hieu_luc: number; moi_trong_ky: number; gia_han_trong_ky: number; doanh_thu: number;
  het_han_30_ngay: number; hoan: number; cau_hoi_da_dung: number; sao_thang_da_cap: number;
  // Hai hạng (0028 bản hai hạng) — bản cũ không có thì khối theo hạng tự ẩn.
  gia_cg_vnd?: number; cg_bat?: boolean; theo_hang?: { thuong: number; chuyen_gia: number };
  doanh_thu_theo_hang?: { thuong: number; chuyen_gia: number }; nang_hang_trong_ky?: number;
};
type Don = { ma_don: number; goi: string | null; so_tien: number; sao: number; cong: string; trang_thai: string; tao_luc: string; ghi_chu: string | null };

const so = (n: number) => Math.round(n).toLocaleString("vi-VN");
const vnd = (n: number) => `${so(n)} ₫`;
const pt = (a: number, b: number) => (b ? `${((a / b) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%` : "—");
const gio = (s: string) => new Date(s).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });
const TRANG_THAI: Record<string, string> = { cho: "Chờ", da_tra: "Đã trả", huy: "Huỷ", sai_tien: "Sai tiền", hoan: "Hoàn" };
const KY = [7, 30, 90] as const;

function So({ ten, gt, phu }: { ten: string; gt: string; phu?: string }) {
  return <div className="rounded-xl border border-line/60 p-3"><p className="font-serif text-2xl text-fg">{gt}</p><p className="text-xs text-fg-muted">{ten}</p>{phu && <p className="text-[11px] text-fg-faint">{phu}</p>}</div>;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ ky?: string }> }) {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  if (p.vaiTro !== "chu_so_huu") return <Card><p className="text-sm text-fg-muted">Chỉ chủ sở hữu xem doanh thu.</p></Card>;
  const kyXin = Number((await searchParams).ky);
  const ky = (KY as readonly number[]).includes(kyXin) ? kyXin : 30;
  const [{ data, error }, don, hhRpc, glRpc, hvRpc] = await Promise.all([
    p.sb.rpc("thong_ke_doanh_thu", { p_ngay: ky }),
    p.sb.rpc("ds_don_nap", { p_trang_thai: null, p_gioi_han: 30 }),
    p.sb.rpc("thong_ke_hoa_hong", { p_ngay: ky }),   // chưa chạy 0025 → lỗi → khối tự ẩn
    p.sb.rpc("gian_lan_gan_day", { p_ngay: ky }),    // chưa chạy 0026 → lỗi → khối tự ẩn
    p.sb.rpc("thong_ke_hoi_vien", { p_ngay: ky }),   // chưa chạy 0028 → lỗi → khối tự ẩn
  ]);
  const hv = !hvRpc.error && hvRpc.data ? (hvRpc.data as HV) : null;
  const gl = !glRpc.error && glRpc.data ? (glRpc.data as GL) : null;
  const hh = !hhRpc.error && hhRpc.data ? (hhRpc.data as HH) : null;
  if (error || !data) {
    return <Card><h1 className="text-2xl">Doanh thu & Sao</h1><p role="alert" className="mt-3 text-sm text-cinnabar">Chưa đọc được số liệu — cần chạy migration 0012 và 0013 trên Supabase.</p></Card>;
  }
  const t = data as TK;
  const maxNgay = Math.max(1, ...t.theo_ngay.map((d) => d.doanh_thu));
  const dsDon = (don.data ?? []) as Don[];
  return (
    <div className="space-y-6" data-testid="qt-doanh-thu">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Doanh thu & Sao</h1>
          <p className="mt-1 text-sm text-fg-muted">{ky} ngày gần nhất (giờ Việt Nam). Mỗi lần xem được ghi nhật ký quản trị.</p>
        </div>
        <nav aria-label="Khoảng thời gian" className="flex gap-1 text-sm">
          {KY.map((k) => <Link key={k} href={`?ky=${k}`} aria-current={k === ky ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${k === ky ? "border-gold text-fg" : "border-line text-fg-muted hover:text-fg"}`}>{k} ngày</Link>)}
        </nav>
      </div>

      <Card>
        <h2 className="text-lg">Tổng quan</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <So ten="Doanh thu" gt={vnd(t.tong.doanh_thu)} />
          <So ten="Người nạp" gt={so(t.tong.nguoi_nap)} phu={`${so(t.nguoi_nap_lan_dau)} người nạp lần đầu`} />
          <So ten="Đơn đã trả" gt={so(t.tong.don_tra)} phu={`chờ ${t.tong.don_cho} · huỷ ${t.tong.don_huy} · hoàn ${t.tong.don_hoan}${t.tong.don_sai_tien ? ` · sai tiền ${t.tong.don_sai_tien}` : ""}`} />
          <So ten="Doanh thu / người nạp" gt={t.tong.nguoi_nap ? vnd(t.tong.doanh_thu / t.tong.nguoi_nap) : "—"} phu={`tạo đơn → trả: ${pt(t.tong.nguoi_nap, t.tong.nguoi_tao_don)}`} />
        </div>
        {t.theo_ngay.length > 0 && (
          <div className="mt-6 flex h-32 items-end gap-1" aria-label="Doanh thu theo ngày">
            {t.theo_ngay.map((d) => (
              <div key={d.ngay} className="flex-1 rounded-t bg-gold/70" style={{ height: `${Math.max(4, (d.doanh_thu / maxNgay) * 100)}%` }}
                title={`${d.ngay}: ${vnd(d.doanh_thu)} · ${d.don} đơn`} />
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg">Theo gói</h2>
          {t.theo_goi.length ? (
            <table className="mt-3 w-full text-sm"><thead><tr className="text-left text-xs text-fg-muted"><th className="py-1 font-normal">Gói</th><th className="text-right font-normal">Đơn</th><th className="text-right font-normal">Doanh thu</th></tr></thead>
              <tbody>{t.theo_goi.map((g) => <tr key={g.goi ?? "hoi_vien"} className="border-t border-line/60"><td className="py-1.5">{g.goi ?? "Hội viên năm"}</td><td className="text-right">{so(g.don)}</td><td className="text-right">{vnd(g.doanh_thu)}</td></tr>)}</tbody></table>
          ) : <p className="mt-3 text-sm text-fg-faint">Chưa có đơn đã trả.</p>}
        </Card>
        <Card>
          <h2 className="text-lg">Sao</h2>
          <div className="mt-3 grid grid-cols-3 gap-3"><So ten="Đã bán" gt={so(t.sao.mua)} /><So ten="Đã tặng" gt={so(t.sao.tang)} /><So ten="Đã tiêu" gt={so(t.sao.tieu)} /></div>
          {t.tieu_theo.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">{t.tieu_theo.map((x) => <li key={x.muc} className="flex justify-between gap-3"><span className="text-fg-muted">{x.muc}</span><span>{so(x.sao)} Sao · {so(x.luot)} lượt</span></li>)}</ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg">Người nạp nhiều nhất</h2>
        <p className="mt-1 text-xs text-fg-muted">Xem chi tiết ví / điều chỉnh Sao ở <Link href="/quan-tri/nguoi-dung" className="text-gold underline">Người dùng & Sao</Link>. Không có hồ sơ, ngày sinh hay nội dung luận giải.</p>
        {t.top_nap.length ? (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm" data-testid="qt-top-nap"><thead><tr className="text-left text-xs text-fg-muted">
            <th className="py-1 font-normal">Email</th><th className="text-right font-normal">Đã nạp</th><th className="text-right font-normal">Lần</th><th className="text-right font-normal">Số dư</th><th className="text-right font-normal">Lần cuối</th></tr></thead>
            <tbody>{t.top_nap.map((u) => <tr key={u.email} className="border-t border-line/60"><td className="py-1.5 [overflow-wrap:anywhere]">{u.email}</td><td className="text-right">{vnd(u.tong)}</td><td className="text-right">{u.lan}</td><td className="text-right">{so(u.so_du)}</td><td className="whitespace-nowrap text-right text-fg-muted">{gio(u.lan_cuoi)}</td></tr>)}</tbody></table></div>
        ) : <p className="mt-3 text-sm text-fg-faint">Chưa có ai nạp trong khoảng này.</p>}
      </Card>

      <Card>
        <h2 className="text-lg">Mời bạn (một tầng)</h2>
        <p className="mt-1 text-sm text-fg-muted">{so(t.moi.luot)} lượt mời thành công · {so(t.moi.ban_da_nap)} người được mời đã nạp ({pt(t.moi.ban_da_nap, t.moi.luot)}).</p>
        {t.top_moi.length > 0 && (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-fg-muted"><th className="py-1 font-normal">Người mời</th><th className="text-right font-normal">Bạn đăng ký</th><th className="text-right font-normal">Bạn đã nạp</th></tr></thead>
            <tbody>{t.top_moi.map((u) => <tr key={u.email} className="border-t border-line/60"><td className="py-1.5 [overflow-wrap:anywhere]">{u.email}</td><td className="text-right">{so(u.so_moi)}</td><td className="text-right">{so(u.ban_da_nap)}</td></tr>)}</tbody></table></div>
        )}
      </Card>

      {hh && (
        <Card data-testid="qt-hoa-hong">
          <h2 className="text-lg">Hoa hồng giới thiệu (một tầng)</h2>
          <p className="mt-1 text-xs text-fg-muted">Người mời nhận % số Sao các đơn nạp đầu của bạn bè mình mời, trả bằng Sao tặng. Công tắc + mức ở <Link href="/quan-tri/cai-dat" className="text-gold underline">Cài đặt</Link>. Đơn hoàn tiền → thu hồi.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <So ten="Đơn có hoa hồng" gt={so(hh.tong.don)} phu={`${so(hh.tong.nguoi_moi)} người mời`} />
            <So ten="Sao đã cộng" gt={so(hh.tong.sao_da_cong)} phu={`thu hồi ${so(hh.tong.sao_thu_hoi)} Sao`} />
            <So ten="Đơn vượt trần" gt={so(hh.tong.qua_tran)} phu="ghi nhận, không cộng Sao" />
            <So ten="Doanh thu các đơn" gt={vnd(hh.tong.doanh_thu_don)} phu="trừ đơn đã hoàn" />
          </div>
          {hh.top.length > 0 ? (
            <div className="mt-4 overflow-x-auto"><table className="w-full text-sm" data-testid="qt-top-hoa-hong"><thead><tr className="text-left text-xs text-fg-muted">
              <th className="py-1 font-normal">Người mời</th><th className="text-right font-normal">Đơn</th><th className="text-right font-normal">Sao</th><th className="text-right font-normal">Doanh thu đơn</th></tr></thead>
              <tbody>{hh.top.map((u, i) => <tr key={`${u.email}-${i}`} className="border-t border-line/60"><td className="py-1.5 [overflow-wrap:anywhere]">{u.email ?? "(đăng nhập bằng số điện thoại)"}</td><td className="text-right">{so(u.don)}</td><td className="text-right">{so(u.sao)}</td><td className="text-right">{vnd(u.doanh_thu)}</td></tr>)}</tbody></table></div>
          ) : <p className="mt-3 text-sm text-fg-faint">Chưa có hoa hồng nào được cộng trong khoảng này.</p>}
        </Card>
      )}

      {hv && (
        <Card data-testid="qt-hoi-vien">
          <h2 className="text-lg">Hội viên năm</h2>
          <p className="mt-1 text-xs text-fg-muted">{hv.bat ? `Đang mở bán · thường ${vnd(hv.gia_vnd)}${hv.gia_cg_vnd ? ` · Chuyên gia ${vnd(hv.gia_cg_vnd)}${hv.cg_bat ? "" : " (chưa bán)"}` : ""} / 365 ngày` : "Chưa mở bán (công tắc tắt) — hội viên đang hiệu lực vẫn giữ quyền"}. Mua một lần, không tự gia hạn, không hoa hồng. Hoàn tiền: bấm "Hoàn" ở đơn → hệ thống tính số tiền gợi ý theo chính sách, anh chuyển khoản ngoài hệ thống. Công tắc + mức ở <Link href="/quan-tri/cai-dat" className="text-gold underline">Cài đặt</Link>.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <So ten="Đang hiệu lực" gt={so(hv.hieu_luc)} phu={`${so(hv.het_han_30_ngay)} hết hạn trong 30 ngày tới`} />
            <So ten="Mới trong kỳ" gt={so(hv.moi_trong_ky)} phu={`${so(hv.gia_han_trong_ky)} lượt gia hạn`} />
            <So ten="Doanh thu hội viên" gt={vnd(hv.doanh_thu)} phu={`hoàn ${so(hv.hoan)} đơn`} />
            <So ten="Sao tháng đã cấp" gt={so(hv.sao_thang_da_cap)} phu={`${so(hv.cau_hoi_da_dung)} câu hỏi chuyên gia đã dùng`} />
          </div>
          {hv.theo_hang && hv.doanh_thu_theo_hang && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="qt-hoi-vien-hang">
              <So ten="Hạng thường" gt={so(hv.theo_hang.thuong)} phu={`doanh thu kỳ ${vnd(hv.doanh_thu_theo_hang.thuong)}`} />
              <So ten="Hạng Chuyên gia" gt={so(hv.theo_hang.chuyen_gia)} phu={`doanh thu kỳ ${vnd(hv.doanh_thu_theo_hang.chuyen_gia)}`} />
              <So ten="Nâng hạng trong kỳ" gt={so(hv.nang_hang_trong_ky ?? 0)} phu="thường → Chuyên gia" />
            </div>
          )}
        </Card>
      )}

      {gl && (
        <Card>
          <h2 className="text-lg">Cờ gian lận lời mời</h2>
          <p className="mt-1 text-xs text-fg-muted">Máy chỉ <b>không cộng thưởng mới</b> và ghi cờ — không khoá tài khoản, không trừ Sao đã cộng. Anh xem rồi quyết (điều chỉnh Sao ở <Link href="/quan-tri/nguoi-dung" className="text-gold underline">Người dùng & Sao</Link>). Ngưỡng + công tắc ở <Link href="/quan-tri/cai-dat" className="text-gold underline">Cài đặt</Link>.</p>
          {gl.ds.length ? (
            <div className="mt-3 overflow-x-auto"><table className="w-full text-sm" data-testid="qt-gian-lan"><thead><tr className="text-left text-xs text-fg-muted">
              <th className="py-1 font-normal">Loại</th><th className="font-normal">Người mời</th><th className="font-normal">Người được mời</th><th className="text-right font-normal">Lúc</th></tr></thead>
              <tbody>{gl.ds.map((c, i) => <tr key={i} className="border-t border-line/60"><td className="py-1.5">{LOAI_GL[c.loai] ?? c.loai}</td>
                <td className="[overflow-wrap:anywhere]">{c.nguoi_moi ?? "—"}</td><td className="[overflow-wrap:anywhere]">{c.duoc_moi ?? "—"}</td>
                <td className="whitespace-nowrap text-right text-fg-muted">{gio(c.luc)}</td></tr>)}</tbody></table></div>
          ) : <p className="mt-3 text-sm text-fg-faint">Không có cờ nào trong khoảng này.</p>}
        </Card>
      )}

      <Card>
        <h2 className="text-lg">Đơn gần đây</h2>
        {dsDon.length ? (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-fg-muted">
            <th className="py-1 font-normal">Mã</th><th className="font-normal">Gói</th><th className="text-right font-normal">Tiền</th><th className="text-right font-normal">Sao</th><th className="font-normal">Trạng thái</th><th className="text-right font-normal">Lúc</th></tr></thead>
            <tbody>{dsDon.map((d) => <tr key={d.ma_don} className="border-t border-line/60"><td className="py-1.5">{d.ma_don}</td><td>{d.goi ?? "Hội viên năm"}</td><td className="text-right">{vnd(d.so_tien)}</td><td className="text-right">{d.sao}</td>
              <td className={d.trang_thai === "da_tra" ? "text-jade" : d.trang_thai === "sai_tien" ? "text-cinnabar" : "text-fg-muted"}>{TRANG_THAI[d.trang_thai] ?? d.trang_thai}{d.cong === "gia" ? " (thử)" : ""}</td>
              <td className="whitespace-nowrap text-right text-fg-muted">{gio(d.tao_luc)}</td></tr>)}</tbody></table></div>
        ) : <p className="mt-3 text-sm text-fg-faint">Chưa có đơn.</p>}
      </Card>
    </div>
  );
}
