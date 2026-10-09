"use client";
// QT-0 — bước thứ hai cho trang quản trị: mã 6 số từ ứng dụng xác thực (Google Authenticator, Microsoft
// Authenticator, 1Password…). Chưa có thì đăng ký bằng mã QR. Xong → phiên lên aal2 → vào /quan-tri.
import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/trinh-duyet";

interface DangKy { factorId: string; qr: string; secret: string }

async function sb() {
  const c = await supabase();
  if (!c) throw new Error("Tài khoản chưa được bật.");
  return c;
}

export function XacThuc({ factorId, email }: { factorId: string | null; email: string | null }) {
  const [dangKy, setDangKy] = useState<DangKy | null>(null);
  const [ma, setMa] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  async function taoQr() {
    setLoi(null); setDang(true);
    try {
      const c = await sb();
      // Lần trước tạo QR mà chưa xác nhận → xoá bản dở dang (Supabase không cho trùng tên, và không để rác).
      const { data: ds } = await c.auth.mfa.listFactors();
      for (const f of ds?.all ?? []) if (f.factor_type === "totp" && f.status === "unverified") await c.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await c.auth.mfa.enroll({ factorType: "totp", friendlyName: `quan-tri-${Date.now()}`, issuer: "Hiểu Bản Thân" });
      if (error || !data) throw error ?? new Error();
      setDangKy({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      setLoi("Chưa tạo được mã QR. Kiểm tra Supabase → Authentication → Multi-Factor đã bật TOTP.");
    } finally {
      setDang(false);
    }
  }

  async function xacNhan(e: React.FormEvent) {
    e.preventDefault();
    const id = dangKy?.factorId ?? factorId;
    if (!id) return;
    setLoi(null); setDang(true);
    const c = await sb();
    const { error } = await c.auth.mfa.challengeAndVerify({ factorId: id, code: ma.trim() });
    if (error) { setDang(false); setLoi("Mã chưa đúng hoặc đã hết hạn — mã đổi sau mỗi 30 giây."); return; }
    await c.rpc("ghi_nhat_ky_quan_tri", { p_hanh_dong: dangKy ? "mfa.dang_ky" : "mfa.dang_nhap" });
    window.location.assign("/quan-tri");   // tải lại hẳn → máy chủ đọc cookie phiên aal2 mới
  }

  const oNhap = (
    <form onSubmit={xacNhan} className="mt-5 space-y-4">
      <Input aria-label="Mã 6 số" inputMode="numeric" autoComplete="one-time-code" value={ma} maxLength={6} autoFocus
        onChange={(e) => setMa(e.target.value.replace(/\D/g, ""))} className="text-center text-xl tracking-[0.5em]" />
      <Button type="submit" className="w-full" disabled={dang || ma.length < 6}>{dang ? "Đang kiểm…" : "Xác nhận"}</Button>
    </form>
  );

  return (
    <div className="mx-auto max-w-md" data-testid="qt-xac-thuc">
      <p className="eyebrow">Quản trị</p>
      <h1 className="mt-2 text-4xl">Xác thực hai lớp</h1>
      <p className="mt-3 text-fg-muted">
        Trang quản trị cần thêm mã 6 số từ ứng dụng xác thực trên điện thoại{email ? ` (tài khoản ${email})` : ""}.
      </p>
      <Card className="mt-6">
        {factorId ? (
          <>
            <p className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-jade" aria-hidden />
              Mở ứng dụng xác thực, nhập mã của “Hiểu Bản Thân”.</p>
            {oNhap}
          </>
        ) : !dangKy ? (
          <>
            <p className="text-sm text-fg-muted">Bước 1: cài Google Authenticator (hoặc ứng dụng tương tự). Bước 2: tạo mã QR và quét.</p>
            <Button className="mt-5 w-full" onClick={() => void taoQr()} disabled={dang}>
              <KeyRound className="size-4" aria-hidden />{dang ? "Đang tạo…" : "Tạo mã QR"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-fg-muted">Quét mã bằng ứng dụng xác thực, rồi nhập mã 6 số hiện ra.</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- QR là data URI do Supabase trả, không qua next/image */}
            <img src={dangKy.qr} alt="Mã QR đăng ký xác thực hai lớp" width={200} height={200} className="mx-auto mt-4 rounded-lg bg-white p-2" />
            <p className="mt-3 break-all text-center text-xs text-fg-faint">Không quét được? Nhập khoá: <span className="font-mono">{dangKy.secret}</span></p>
            {oNhap}
          </>
        )}
        {loi && <p role="alert" className="mt-4 text-sm text-cinnabar">{loi}</p>}
      </Card>
    </div>
  );
}
