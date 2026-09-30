"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Cloud, LogOut, Pencil, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { coTaiKhoan } from "@/lib/supabase/trinh-duyet";
import { dangXuat, hoSoTaiKhoan, luuVaoTaiKhoan, useNguoiDung, xoaHoSoTaiKhoan, xoaTaiKhoan } from "@/lib/tai-khoan";
import { luuHoSo, useHoSo, xoaHoSo, type HoSo } from "@/lib/hoso";
import { ghi } from "@/lib/do-luong";

type HoSoTK = Awaited<ReturnType<typeof hoSoTaiKhoan>>;

const moTa = (h: Pick<HoSo, "ho_ten" | "ngay" | "thang" | "nam" | "gio">) =>
  `${h.ho_ten} · ${String(h.ngay).padStart(2, "0")}/${String(h.thang).padStart(2, "0")}/${h.nam}${h.gio ? ` · ${h.gio}` : ""}`;

function giongNhau(a: HoSo, b: NonNullable<HoSoTK>): boolean {
  return a.ho_ten === b.ho_ten && a.ngay === b.ngay && a.thang === b.thang && a.nam === b.nam &&
    (a.gio ?? null) === (b.gio ?? null) && (a.gioi_tinh ?? null) === (b.gioi_tinh ?? null) &&
    (a.ten_khac ?? null) === (b.ten_khac ?? null) && (a.vung ?? null) === (b.vung ?? null) &&
    (a.noi_sinh ?? null) === (b.noi_sinh ?? null) && Boolean(a.gio_mua_he) === Boolean(b.gio_mua_he);
}

export function TaiKhoan() {
  const hoSo = useHoSo();
  const user = useNguoiDung();
  const [tk, setTk] = useState<HoSoTK | undefined>(undefined);
  const [dongY, setDongY] = useState(false);
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<{ loai: "ok" | "loi"; noi: string } | null>(null);
  const [suaMo, setSuaMo] = useState(false);
  const [xacNhanXoa, setXacNhanXoa] = useState<"may" | "tk" | "tai_khoan" | null>(null);

  const tai = useCallback(async () => {
    if (!user) return;
    try { setTk(await hoSoTaiKhoan(user.id)); } catch (e) { setBao({ loai: "loi", noi: (e as Error).message }); }
  }, [user]);
  useEffect(() => { void tai(); }, [tai]);

  // Máy mới, tài khoản đã có hồ sơ → tự đưa về máy (không cần hỏi: dữ liệu của chính họ).
  // Chỉ khi LÚC MỞ TRANG máy chưa có hồ sơ — người dùng tự "Xoá khỏi máy" thì không kéo về lại.
  const mayTrongLucMo = useRef<boolean | null>(null);
  if (mayTrongLucMo.current === null && hoSo !== undefined) mayTrongLucMo.current = hoSo === null;
  useEffect(() => {
    if (hoSo === null && tk && mayTrongLucMo.current) {
      mayTrongLucMo.current = false;
      const { cap_nhat_luc: _bo, ...h } = tk;
      luuHoSo(h);
      setBao({ loai: "ok", noi: "Đã tải hồ sơ từ tài khoản về máy này." });
    }
  }, [hoSo, tk]);

  async function lam(viec: () => Promise<void>, thanhCong: string) {
    setDang(true); setBao(null);
    try { await viec(); setBao({ loai: "ok", noi: thanhCong }); } catch (e) { setBao({ loai: "loi", noi: (e as Error).message }); }
    finally { setDang(false); }
  }

  if (hoSo === undefined) return <KhungTai />;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <p className="eyebrow">Tài khoản</p>
        <h1 className="mt-2 text-4xl">Hồ sơ & quyền riêng tư</h1>
      </header>

      <section aria-labelledby="tren-may">
        <TieuDeMuc id="tren-may" nho="Trên máy này" lon={hoSo ? "Hồ sơ đang dùng" : "Chưa có hồ sơ"} />
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Smartphone className="size-6 shrink-0 text-jade" aria-hidden />
          <p className="flex-1 text-fg" data-testid="ho-so-may">{hoSo ? moTa(hoSo) : "Tạo hồ sơ để xem con số và dùng mọi mảng."}</p>
          {hoSo ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSuaMo(true)}><Pencil aria-hidden /> Sửa</Button>
              <Button variant="ghost" size="sm" onClick={() => setXacNhanXoa("may")}><Trash2 aria-hidden /> Xoá khỏi máy</Button>
            </div>
          ) : <Button asChild size="sm"><Link href="/">Tạo hồ sơ</Link></Button>}
        </Card>
      </section>

      <section aria-labelledby="tai-khoan">
        <TieuDeMuc id="tai-khoan" nho="Tài khoản" lon="Dùng trên mọi thiết bị" />
        {!coTaiKhoan() && (
          <Card className="text-sm text-fg-muted" data-testid="tk-chua-bat">Tài khoản đang được chuẩn bị. Hồ sơ vẫn an toàn trên máy này.</Card>
        )}
        {coTaiKhoan() && user === undefined && <KhungTai dong={1} />}
        {coTaiKhoan() && user === null && (
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Cloud className="size-6 shrink-0 text-gold" aria-hidden />
            <p className="flex-1 text-sm text-fg-muted">Đăng nhập bằng email, Google hoặc số điện thoại để giữ hồ sơ khi đổi máy.</p>
            <Button asChild><Link href="/dang-nhap">Đăng nhập</Link></Button>
          </Card>
        )}
        {user && (
          <Card className="space-y-5">
            <p className="text-sm text-fg-muted">Đang đăng nhập: <b className="text-fg">{user.email ?? user.phone}</b></p>
            {tk === undefined ? <KhungTai dong={1} /> : (
              <>
                {tk && hoSo && giongNhau(hoSo, tk) && (
                  <p className="flex items-center gap-2 text-jade"><CheckCircle2 className="size-4" aria-hidden /> Hồ sơ đã được lưu trong tài khoản.</p>
                )}
                {tk && hoSo && !giongNhau(hoSo, tk) && (
                  <div className="space-y-3 text-sm">
                    <p>Tài khoản đang lưu: <b>{moTa(tk)}</b></p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={dang} onClick={() => lam(async () => { await luuVaoTaiKhoan(user.id, hoSo); await tai(); }, "Đã cập nhật tài khoản theo máy này.")}>Cập nhật tài khoản theo máy này</Button>
                      <Button size="sm" variant="secondary" onClick={() => { const { cap_nhat_luc: _bo, ...h } = tk; luuHoSo(h); }}>Dùng bản trong tài khoản</Button>
                    </div>
                  </div>
                )}
                {!tk && hoSo && (
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 text-sm">
                      <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} className="mt-1 size-4 accent-[rgb(var(--gold))]" />
                      <span>Tôi đồng ý lưu <b>họ tên, ngày giờ sinh, giới tính, nơi sinh</b> vào tài khoản để dùng trên máy khác. Tôi có thể xoá bất cứ lúc nào. Nội dung bài đọc và câu hỏi không được lưu.</span>
                    </label>
                    <Button disabled={!dongY || dang} onClick={() => lam(async () => {
                      await luuVaoTaiKhoan(user.id, hoSo); ghi("profile_created", { kind: "tai_khoan" }); await tai();
                    }, "Đã lưu hồ sơ vào tài khoản.")}>
                      <Cloud aria-hidden /> Lưu vào tài khoản
                    </Button>
                  </div>
                )}
              </>
            )}
            <div className="flex flex-wrap gap-2 border-t border-line/70 pt-4">
              <Button variant="ghost" size="sm" onClick={() => void dangXuat()}><LogOut aria-hidden /> Đăng xuất</Button>
              {tk && <Button variant="ghost" size="sm" onClick={() => setXacNhanXoa("tk")}><Trash2 aria-hidden /> Xoá hồ sơ khỏi tài khoản</Button>}
              <Button variant="ghost" size="sm" className="text-cinnabar" onClick={() => setXacNhanXoa("tai_khoan")}><Trash2 aria-hidden /> Xoá tài khoản</Button>
            </div>
          </Card>
        )}
        {bao && <p role="status" className={`mt-3 text-sm ${bao.loai === "ok" ? "text-jade" : "text-cinnabar"}`}>{bao.noi}</p>}
      </section>

      <section aria-labelledby="rieng-tu">
        <TieuDeMuc id="rieng-tu" nho="Quyền riêng tư" lon="Chúng tôi giữ gì, không giữ gì" />
        <ul className="space-y-2 text-sm text-fg-muted">
          {[
            "Mặc định mọi thứ nằm trên máy của bạn. Ngày sinh chỉ gửi đi lúc tính toán, không lưu lại.",
            "Chỉ khi bạn bấm “Lưu vào tài khoản” và đồng ý, hồ sơ mới được lưu — chỉ bạn đọc được.",
            "Không lưu nội dung bài đọc hay câu hỏi gắn với bạn. Nhật ký cải thiện hệ thống là ẩn danh, đã lọc năm/ngày/số điện thoại.",
            "Link chia sẻ chỉ mang tên hiển thị và các con số — không có ngày sinh.",
            "Xoá hồ sơ hay xoá tài khoản có hiệu lực ngay, không giữ bản sao.",
          ].map((t) => <li key={t} className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-jade" aria-hidden />{t}</li>)}
        </ul>
      </section>

      <Sheet open={suaMo} onOpenChange={setSuaMo}>
        <SheetContent title="Sửa hồ sơ" description="Thay đổi lưu trên máy; nếu đã đăng nhập, bạn có thể cập nhật tài khoản sau.">
          {hoSo && <NhapHoSo macDinh={hoSo} nutGui="Lưu hồ sơ" onXong={() => setSuaMo(false)} />}
        </SheetContent>
      </Sheet>

      <Sheet open={xacNhanXoa !== null} onOpenChange={(o) => !o && setXacNhanXoa(null)}>
        <SheetContent title={xacNhanXoa === "tai_khoan" ? "Xoá hẳn tài khoản?" : "Xoá hồ sơ?"}
          description={xacNhanXoa === "may" ? "Hồ sơ trên máy này sẽ bị xoá. Tài khoản (nếu có) không bị ảnh hưởng."
            : xacNhanXoa === "tk" ? "Hồ sơ trong tài khoản sẽ bị xoá ngay. Hồ sơ trên máy này vẫn giữ."
            : "Tài khoản và hồ sơ trong đó bị xoá vĩnh viễn, không khôi phục được."}>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setXacNhanXoa(null)}>Huỷ</Button>
            <Button className="flex-1 bg-none bg-cinnabar text-bg shadow-none" disabled={dang} onClick={() => {
              const v = xacNhanXoa; setXacNhanXoa(null);
              if (v === "may") { xoaHoSo(); setBao({ loai: "ok", noi: "Đã xoá hồ sơ khỏi máy này." }); }
              else if (v === "tk" && user) void lam(async () => { await xoaHoSoTaiKhoan(user.id); setTk(null); }, "Đã xoá hồ sơ khỏi tài khoản.");
              else if (v === "tai_khoan") void lam(xoaTaiKhoan, "Đã xoá tài khoản.");
            }}>Xoá</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
