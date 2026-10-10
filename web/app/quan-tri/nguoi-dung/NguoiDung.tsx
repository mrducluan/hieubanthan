"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEN_VAI_TRO, type VaiTro } from "@/lib/quan-tri-vai-tro";
import { goiQT } from "@/lib/goi-quan-tri";
import { TEN_LOAI } from "@/lib/sao";

export interface NguoiQT { user_id: string; email: string; vai_tro: VaiTro; tao_luc: string; cap_boi: string | null; dang_nhap_luc: string | null }

const ngay = (s: string | null) => (s ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s)) : "—");
const chonCls = "h-11 rounded-xl border border-line bg-bg/60 px-3 text-sm text-fg";

export function VaiTroQT({ ds, toi }: { ds: NguoiQT[]; toi: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [vai, setVai] = useState<VaiTro>("bien_tap");
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<{ loi?: string; ok?: string } | null>(null);

  async function gui(body: unknown, ok: string) {
    setDang(true); setBao(null);
    try { await goiQT("/api/quan-tri/vai-tro", body); setBao({ ok }); setEmail(""); router.refresh(); }
    catch (e) { setBao({ loi: (e as Error).message }); } finally { setDang(false); }
  }

  return (
    <div className="mt-4 space-y-4">
      <ul className="divide-y divide-line/60 text-sm">
        {ds.map((n) => (
          <li key={n.user_id} className="flex flex-wrap items-center gap-2 py-2">
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{n.email}</span>
            <Badge tone={n.vai_tro === "chu_so_huu" ? "gold" : "muted"}>{TEN_VAI_TRO[n.vai_tro]}</Badge>
            <span className="text-xs text-fg-faint">cấp {ngay(n.tao_luc)}{n.cap_boi ? ` bởi ${n.cap_boi}` : ""} · đăng nhập {ngay(n.dang_nhap_luc)}</span>
            {n.user_id !== toi && (
              <Button size="sm" variant="ghost" disabled={dang}
                onClick={() => { if (confirm(`Gỡ quyền quản trị của ${n.email}?`)) void gui({ viec: "go", user_id: n.user_id }, "Đã gỡ."); }}>
                Gỡ
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); void gui({ viec: "cap", email, vai_tro: vai }, "Đã cấp."); }}>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@…" aria-label="Email người được cấp" className="min-w-0 flex-1" />
        <select value={vai} onChange={(e) => setVai(e.target.value as VaiTro)} aria-label="Vai trò" className={chonCls}>
          {(Object.keys(TEN_VAI_TRO) as VaiTro[]).map((v) => <option key={v} value={v}>{TEN_VAI_TRO[v]}</option>)}
        </select>
        <Button size="sm" type="submit" disabled={dang}>Cấp / đổi vai trò</Button>
      </form>
      {bao?.loi && <p role="alert" className="text-sm text-cinnabar">{bao.loi}</p>}
      {bao?.ok && <p role="status" className="text-sm text-jade">{bao.ok}</p>}
    </div>
  );
}

interface KetQuaTra {
  ma: string; so_du: number; da_moi: number; duoc_moi: boolean;
  giao_dich: { so_luong: number; loai: string; ghi_chu: string | null; het_han: string | null; tao_luc: string }[];
}

const khoaMoi = () => `qt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function SoSao({ duocDieuChinh }: { duocDieuChinh: boolean }) {
  const [email, setEmail] = useState("");
  const [kq, setKq] = useState<KetQuaTra | null>(null);
  const [so, setSo] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [khoa, setKhoa] = useState(khoaMoi);
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<{ loi?: string; ok?: string } | null>(null);

  async function tra(e?: string) {
    setDang(true); setBao(null);
    try { setKq(await goiQT<KetQuaTra>("/api/quan-tri/sao", { viec: "tra", email: e ?? email })); }
    catch (er) { setKq(null); setBao({ loi: (er as Error).message }); } finally { setDang(false); }
  }

  async function dieuChinh() {
    setDang(true); setBao(null);
    try {
      const r = await goiQT<{ so_du: number }>("/api/quan-tri/sao", { viec: "dieu_chinh", email, so: Number(so), ly_do: lyDo, khoa });
      setSo(""); setLyDo(""); setKhoa(khoaMoi());
      await tra(email);                       // tra() xoá lời báo cũ → báo kết quả SAU khi tải lại sổ
      setBao({ ok: `Đã ghi. Số dư mới: ${r.so_du} Sao.` });
    } catch (er) { setBao({ loi: (er as Error).message }); } finally { setDang(false); }
  }

  return (
    <div className="mt-4 space-y-4">
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void tra(); }}>
        <Input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setKq(null); }}
          placeholder="Email người dùng" aria-label="Email người dùng" className="min-w-0 flex-1" />
        <Button size="sm" type="submit" disabled={dang}>Tra cứu</Button>
      </form>
      {kq && (
        <div className="space-y-3" data-testid="qt-ket-qua-sao">
          <p className="text-sm">Mã <span className="font-mono">{kq.ma}</span> · Số dư <b className="text-gold">{kq.so_du} Sao</b> · đã mời {kq.da_moi} người{kq.duoc_moi ? " · đến từ lời mời" : ""}</p>
          <ul className="max-h-72 divide-y divide-line/60 overflow-auto text-sm">
            {kq.giao_dich.map((g, i) => (
              <li key={i} className="flex justify-between gap-3 py-1.5">
                <span className="min-w-0 text-fg-muted">{ngay(g.tao_luc)} · {TEN_LOAI[g.loai] ?? g.loai}{g.ghi_chu ? ` — ${g.ghi_chu}` : ""}</span>
                <span className={g.so_luong > 0 ? "text-jade" : "text-cinnabar"}>{g.so_luong > 0 ? "+" : ""}{g.so_luong}</span>
              </li>
            ))}
            {kq.giao_dich.length === 0 && <li className="py-1.5 text-fg-faint">Chưa có giao dịch.</li>}
          </ul>
          {duocDieuChinh && (
            <form className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-3" onSubmit={(e) => { e.preventDefault(); void dieuChinh(); }}>
              <Input required inputMode="numeric" value={so} onChange={(e) => setSo(e.target.value)} placeholder="+/− Sao" aria-label="Số Sao điều chỉnh" className="w-28" />
              <Input required minLength={5} maxLength={120} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                placeholder="Lý do (bắt buộc, vd: bù lỗi trừ hai lần ngày 10/10)" aria-label="Lý do" className="min-w-0 flex-1" />
              <Button size="sm" type="submit" disabled={dang}>Ghi bút toán</Button>
            </form>
          )}
        </div>
      )}
      {bao?.loi && <p role="alert" className="text-sm text-cinnabar">{bao.loi}</p>}
      {bao?.ok && <p role="status" className="text-sm text-jade">{bao.ok}</p>}
    </div>
  );
}
