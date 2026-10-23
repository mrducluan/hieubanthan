"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coTaiKhoan, supabase } from "@/lib/supabase/trinh-duyet";

/** 0912345678 / 84912345678 / +84912345678 → +84912345678; sai định dạng → null. */
function chuanHoaSdt(s: string): string | null {
  const so = s.replace(/[\s.-]/g, "");
  const m = so.match(/^(?:\+?84|0)(\d{9})$/);
  return m ? `+84${m[1]}` : null;
}

export function DangNhap() {
  const router = useRouter();
  const params = useSearchParams();
  const [kenh, setKenh] = useState<"email" | "sdt">("email");
  const [email, setEmail] = useState("");
  const [sdt, setSdt] = useState("");
  const [ma, setMa] = useState("");
  const [daGui, setDaGui] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(params.get("loi") ? "Đăng nhập chưa thành công, thử lại." : null);

  if (!coTaiKhoan()) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <Lock className="mx-auto size-6 text-gold" aria-hidden />
        <h1 className="mt-3 text-2xl">Tài khoản đang được chuẩn bị</h1>
        <p className="mt-2 text-sm text-fg-muted">Hồ sơ của bạn vẫn lưu an toàn trên máy này và dùng được cho mọi mảng.</p>
        <Button asChild variant="secondary" className="mt-5"><Link href="/ban-than">Về hồ sơ của tôi</Link></Button>
      </Card>
    );
  }
  const sb = async () => (await supabase())!;
  // ?tiep= (vd /quan-tri): chỉ nhận đường dẫn nội bộ — "//evil.com", "/\\evil.com" bị bỏ (callback cũng kiểm lại).
  // SEC-2: cấm cả khoảng trắng / tab / xuống dòng — trình duyệt bỏ tab nên "/\t/evil.com" thành "//evil.com".
  const tiepXin = params.get("tiep");
  const tiep = tiepXin && /^\/(?![/\\])[^\s\\]*$/.test(tiepXin) ? tiepXin : "/tai-khoan";
  const veLai = () => `${window.location.origin}/auth/callback?tiep=${encodeURIComponent(tiep)}`;

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null); setDang(true);
    try {
      if (kenh === "email") {
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email chưa đúng.");
        const { error } = await (await sb()).auth.signInWithOtp({ email, options: { emailRedirectTo: veLai() } });
        if (error) throw error;
      } else {
        const p = chuanHoaSdt(sdt);
        if (!p) throw new Error("Số điện thoại chưa đúng (vd 0912 345 678).");
        const { error } = await (await sb()).auth.signInWithOtp({ phone: p });
        if (error) throw error;
      }
      setDaGui(true);
    } catch (e2) {
      setLoi(e2 instanceof Error ? e2.message : "Chưa gửi được mã.");
    } finally {
      setDang(false);
    }
  }

  async function xacNhan(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null); setDang(true);
    const { error } = kenh === "email"
      ? await (await sb()).auth.verifyOtp({ email, token: ma.trim(), type: "email" })
      : await (await sb()).auth.verifyOtp({ phone: chuanHoaSdt(sdt) ?? "", token: ma.trim(), type: "sms" });
    setDang(false);
    if (error) setLoi("Mã chưa đúng hoặc đã hết hạn.");
    else router.push(tiep);
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="eyebrow">Tài khoản</p>
      <h1 className="mt-2 text-4xl">Lưu hồ sơ vĩnh viễn</h1>
      <p className="mt-3 text-fg-muted">Đăng nhập để dùng hồ sơ trên mọi thiết bị. Không cần mật khẩu.</p>

      <Card className="mt-6 space-y-5">
        <Button variant="secondary" className="w-full" onClick={() =>
          void sb().then((c) => c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: veLai() } }))}>
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"/></svg>
          Tiếp tục với Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-fg-faint"><span className="h-px flex-1 bg-line" />hoặc nhận mã<span className="h-px flex-1 bg-line" /></div>

        <Tabs value={kenh} onValueChange={(v) => { setKenh(v as "email" | "sdt"); setDaGui(false); setMa(""); }}>
          <TabsList className="w-full">
            <TabsTrigger value="email" className="flex-1"><Mail className="mr-1.5 inline size-3.5" aria-hidden />Email</TabsTrigger>
            <TabsTrigger value="sdt" className="flex-1"><Phone className="mr-1.5 inline size-3.5" aria-hidden />Số điện thoại</TabsTrigger>
          </TabsList>
          {!daGui ? (
            <form onSubmit={gui} className="mt-5 space-y-4">
              <TabsContent value="email" className="mt-0 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
              </TabsContent>
              <TabsContent value="sdt" className="mt-0 space-y-2">
                <Label htmlFor="sdt">Số điện thoại</Label>
                <Input id="sdt" type="tel" autoComplete="tel" inputMode="tel" value={sdt} onChange={(e) => setSdt(e.target.value)} placeholder="0912 345 678" />
              </TabsContent>
              <Button type="submit" className="w-full" disabled={dang}>{dang ? "Đang gửi…" : "Gửi mã đăng nhập"}</Button>
            </form>
          ) : (
            <form onSubmit={xacNhan} className="mt-5 space-y-4">
              <p className="text-sm text-fg-muted">
                {kenh === "email" ? `Đã gửi thư tới ${email}. Nhập mã 6 số trong thư — hoặc bấm link trong thư.` : `Đã gửi SMS tới ${sdt}. Nhập mã 6 số.`}
              </p>
              <Input aria-label="Mã xác nhận" inputMode="numeric" autoComplete="one-time-code" value={ma} maxLength={8}
                onChange={(e) => setMa(e.target.value.replace(/\D/g, ""))} className="text-center text-xl tracking-[0.5em]" />
              <Button type="submit" className="w-full" disabled={dang || ma.length < 6}>{dang ? "Đang kiểm…" : "Xác nhận"}</Button>
              <button type="button" className="w-full text-sm text-fg-faint hover:text-fg" onClick={() => setDaGui(false)}>Gửi lại / đổi {kenh === "email" ? "email" : "số"}</button>
            </form>
          )}
        </Tabs>
        {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      </Card>
      <p className="mt-4 flex gap-1.5 text-xs text-fg-faint"><Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Đăng nhập chưa lưu gì. Hồ sơ chỉ được lưu vào tài khoản khi bạn bấm “Lưu vào tài khoản” và đồng ý.</p>
    </div>
  );
}
