"use client";
// Ba trạng thái: chưa bật (bắt buộc với Quản trị/Chủ biên) → hiện bí mật + link app xác thực → nhập mã;
// đã bật → nhập mã 6 số; không có quyền CMS (Máy đọc / vai trò không hợp lệ) → báo + đăng xuất.
import { useEffect, useMemo, useState } from "react";
import { duongQr, maHoaQr } from "../lib/qr";

type TrangThai = { email?: string; can: boolean; da_bat: boolean; da_xac_thuc: boolean; may_doc: boolean; co_vai_tro?: boolean };
const O: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 6, border: "1px solid var(--theme-elevation-150)",
  background: "var(--theme-input-bg)", color: "var(--theme-text)", padding: 10, fontSize: 20, letterSpacing: 6, textAlign: "center" };

function diTiep() {
  const r = new URLSearchParams(window.location.search).get("redirect");
  window.location.href = r && /^\/(?![/\\])/.test(r) ? `/admin${r === "/" ? "" : r}` : "/admin";
}

export function XacThucForm() {
  const [tt, setTt] = useState<TrangThai | null>(null);
  const [bat, setBat] = useState<{ bi_mat: string; uri: string } | null>(null);
  const [ma, setMa] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);

  useEffect(() => {
    fetch("/api/bien-tap-vien/mfa/trang-thai", { credentials: "include" }).then(async (r) => {
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      // Lỗi máy chủ (vd DB quá tải) không được hiện thành "chưa có quyền" — báo lỗi để tải lại.
      if (!r.ok) { setLoi("Máy chủ đang bận, chưa tải được trạng thái. Tải lại trang sau ít phút."); return; }
      const d = (await r.json()) as TrangThai;
      if (d.da_xac_thuc) diTiep();
      setTt(d);
    }).catch(() => setLoi("Không tải được trạng thái, thử lại."));
  }, []);

  async function batDau() {
    setDang(true); setLoi(null);
    const r = await fetch("/api/bien-tap-vien/mfa/bat-dau", { method: "POST", credentials: "include" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setBat(d as { bi_mat: string; uri: string }); else setLoi((d as { loi?: string }).loi ?? "Chưa bắt đầu được.");
    setDang(false);
  }

  async function xacNhan(e: React.FormEvent) {
    e.preventDefault();
    setDang(true); setLoi(null);
    const r = await fetch("/api/bien-tap-vien/mfa/xac-nhan", {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ ma }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { diTiep(); return; }
    setLoi((d as { loi?: string }).loi ?? "Mã chưa đúng."); setDang(false); setMa("");
  }

  const qr = useMemo(() => {
    if (!bat) return null;
    try { const m = maHoaQr(bat.uri); return { d: duongQr(m), c: m.kichThuoc + 8 }; } catch { return null; }   // link quá dài → chỉ nhập khoá
  }, [bat]);

  if (!tt) return <p>{loi ?? "Đang kiểm tra…"}</p>;
  // Không quyền = Máy đọc / vai trò lạ. Người có vai trò mà chưa bắt buộc vẫn được tự bật (rồi bấm "Để sau" quay lại).
  if (!tt.co_vai_tro && !tt.da_bat) {
    return (
      <div data-testid="xac-thuc-khong-quyen">
        <h1 style={{ fontSize: 24 }}>Tài khoản chưa có quyền vào phòng biên tập</h1>
        <p>{tt.may_doc ? "Tài khoản Máy đọc chỉ dùng khoá API cho web, không đăng nhập giao diện." : "Nhờ Quản trị kiểm tra vai trò của bạn."}</p>
        <a href="/admin/logout" className="btn btn--style-secondary">Đăng xuất</a>
      </div>
    );
  }
  const canBat = !tt.da_bat;
  return (
    <div data-testid="xac-thuc-2-buoc">
      <h1 style={{ fontSize: 24 }}>Xác thực 2 bước</h1>
      <p style={{ opacity: 0.8 }}>{tt.email}</p>
      {canBat && !bat && (
        <>
          <p>Tài khoản của bạn cần thêm một lớp bảo vệ: mã 6 số đổi mỗi 30 giây trên điện thoại
            (Google Authenticator, Microsoft Authenticator, Authy, 1Password…).</p>
          <button type="button" className="btn btn--style-primary" disabled={dang} onClick={() => void batDau()} data-testid="mfa-bat-dau">Bật xác thực 2 bước</button>
          {!tt.can && <p style={{ fontSize: 13 }}><a href="/admin">Để sau</a></p>}
        </>
      )}
      {canBat && bat && (
        <ol style={{ paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Mở app xác thực (Google Authenticator, Microsoft Authenticator…) → <b>Thêm tài khoản</b> → <b>Quét mã QR</b>:
            {qr && (
              <svg data-testid="mfa-qr" viewBox={`0 0 ${qr.c} ${qr.c}`} width={200} height={200} role="img" aria-label="Mã QR thêm tài khoản"
                style={{ display: "block", margin: "8px 0", background: "#fff", borderRadius: 6 }}>
                <path d={qr.d} fill="#000" />
              </svg>
            )}
            Không quét được thì chọn <b>Nhập khoá</b> (hoặc trên điện thoại bấm <a href={bat.uri}>mở trong app</a>).</li>
          <li>Khoá bí mật: <code data-testid="mfa-bi-mat" style={{ fontSize: 15, userSelect: "all" }}>{bat.bi_mat}</code> (loại: theo thời gian).</li>
          <li>Nhập mã 6 số app hiện ra vào ô dưới.</li>
        </ol>
      )}
      {(!canBat || bat) && (
        <form onSubmit={(e) => void xacNhan(e)} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <label htmlFor="ma-mfa">Mã 6 số</label>
          <input id="ma-mfa" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required
            value={ma} onChange={(e) => setMa(e.target.value.replace(/\D/g, ""))} style={O} autoFocus />
          <button type="submit" className="btn btn--style-primary" disabled={dang || ma.length !== 6}>Xác nhận</button>
        </form>
      )}
      {loi && <p role="alert" style={{ color: "#d9534f" }}>{loi}</p>}
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 24 }}>Mất điện thoại? Nhờ Quản trị đặt lại xác thực 2 bước cho tài khoản của bạn.
        <br /><a href="/admin/logout">Đăng xuất</a></p>
    </div>
  );
}
