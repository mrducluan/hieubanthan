"use client";
// PT-HK — Huyền Không phi tinh: nhập năm xây + toạ sơn (hoặc độ la bàn) → hạ quái bàn 3×3 (Nam ở trên).
// Mỗi cung: sơn tinh (trái) · hướng tinh (phải) · vận tinh (giữa dưới) · lưu niên (góc). Engine tính hết.
import { useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { cn } from "@/lib/utils";

const SON_24: [string, string][] = [
  ["Nhâm", "Bắc"], ["Tý", "Bắc"], ["Quý", "Bắc"], ["Sửu", "Đông Bắc"], ["Cấn", "Đông Bắc"], ["Dần", "Đông Bắc"],
  ["Giáp", "Đông"], ["Mão", "Đông"], ["Ất", "Đông"], ["Thìn", "Đông Nam"], ["Tốn", "Đông Nam"], ["Tỵ", "Đông Nam"],
  ["Bính", "Nam"], ["Ngọ", "Nam"], ["Đinh", "Nam"], ["Mùi", "Tây Nam"], ["Khôn", "Tây Nam"], ["Thân", "Tây Nam"],
  ["Canh", "Tây"], ["Dậu", "Tây"], ["Tân", "Tây"], ["Tuất", "Tây Bắc"], ["Càn", "Tây Bắc"], ["Hợi", "Tây Bắc"],
];

interface Cung { cung: string; phuong: string; luoi: [number, number]; goc: number; van: number; son: number; huong: number }
interface Ban {
  van: number; nam_xay: number; cuc: string; cuc_ten: string; cuc_y: { y: string; goi_y: string };
  toa: { son: string; quai: string; phuong: string }; huong: { son: string; quai: string; phuong: string };
  cung: Cung[]; to_hop: { ma: string; ten: string; nhom: string; y: string; cung?: string[] }[];
  trang_thai_sao: { sao: number; ten: string; trang_thai: string }[];
  sao_y: Record<string, { hanh: string; y_vuong: string; y_suy: string }>;
  luu_nien: { nam: number; tam: number; sao_tam: string; cung: Record<string, number> };
  luu_y: string; canh_bao: { loai: string; chi_tiet: string }[];
}

const MAU_TT: Record<string, string> = {
  "vượng": "text-gold", "sinh": "text-jade", "thoái": "text-moon", "suy": "text-fg-muted", "tử": "text-fg-faint",
};

export function HuyenKhong() {
  const [namXay, setNamXay] = useState("2024");
  const [cach, setCach] = useState<"son" | "do">("son");
  const [toa, setToa] = useState("Tý");
  const [doLa, setDoLa] = useState("");
  const [ban, setBan] = useState<Ban | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);

  const lap = async () => {
    setDang(true); setLoi(null);
    try {
      const body = { nam_xay: Number(namXay), ...(cach === "son" ? { toa } : { do: Number(doLa) }) };
      setBan(await postJson<Ban>("/api/phongthuy/huyen-khong", body));
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huyen_khong" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa lập được bàn."); }
    finally { setDang(false); }
  };

  const tt = (n: number) => ban?.trang_thai_sao.find((x) => x.sao === n)?.trang_thai ?? "tử";
  return (
    <section aria-labelledby="tieu-de-hk" className="glass space-y-5 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-gold/15 text-gold"><Compass className="size-5" aria-hidden /></span>
        <div>
          <h2 id="tieu-de-hk" className="text-2xl">Huyền Không phi tinh <span className="text-base text-fg-faint" style={{ fontFamily: "var(--font-han), serif" }}>玄空飛星</span></h2>
          <p className="text-sm text-fg-muted">Bàn sao theo năm xây (hoặc năm dọn vào) và hướng nhà — không cần ngày sinh.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
        <label className="space-y-1 text-sm">
          <span className="text-fg-muted">Năm xây / nhập trạch</span>
          <Input inputMode="numeric" value={namXay} onChange={(e) => setNamXay(e.target.value.replace(/\D/g, "").slice(0, 4))} aria-label="Năm xây hoặc nhập trạch" />
        </label>
        <div className="space-y-1 text-sm">
          <div className="flex gap-3 text-fg-muted">
            <label className="flex items-center gap-1.5"><input type="radio" checked={cach === "son"} onChange={() => setCach("son")} />Chọn toạ sơn</label>
            <label className="flex items-center gap-1.5"><input type="radio" checked={cach === "do"} onChange={() => setCach("do")} />Nhập độ la bàn</label>
          </div>
          {cach === "son" ? (
            <Select value={toa} onChange={(e) => setToa(e.target.value)} aria-label="Toạ sơn (lưng nhà)">
              {SON_24.map(([s, p], i) => {
                const [h, ph] = SON_24[(i + 12) % 24]!;
                return <option key={s} value={s}>Toạ {s} ({p}) — hướng {h} ({ph})</option>;
              })}
            </Select>
          ) : (
            <Input inputMode="decimal" value={doLa} onChange={(e) => setDoLa(e.target.value)} placeholder="Độ của LƯNG nhà, 0–359.9 (0 = chính Bắc)" aria-label="Độ la bàn của toạ" />
          )}
        </div>
        <Button onClick={lap} disabled={dang || namXay.length !== 4 || (cach === "do" && doLa === "")}>{dang ? "Đang lập…" : "Lập bàn"}</Button>
      </div>
      {loi && <BaoLoi loi={loi} thuLai={lap} />}

      {ban && (
        <div className="space-y-5" data-testid="ban-huyen-khong">
          <p className="text-sm text-fg-muted">
            Vận <b className="text-gold">{ban.van}</b> · Toạ <b className="text-fg">{ban.toa.son}</b> ({ban.toa.phuong}) — hướng <b className="text-fg">{ban.huong.son}</b> ({ban.huong.phuong}) ·
            cục <b className="text-gold">{ban.cuc_ten}</b> · lưu niên {ban.luu_nien.nam}: {ban.luu_nien.sao_tam} nhập trung
          </p>
          {ban.canh_bao.map((c) => <p key={c.loai} className="rounded-xl bg-cinnabar/10 px-4 py-2 text-sm text-cinnabar">{c.chi_tiet}</p>)}

          <div className="mx-auto grid max-w-md grid-cols-3 gap-1.5" role="table" aria-label="Hạ quái bàn Huyền Không, Nam ở trên">
            {[...ban.cung].sort((a, b) => a.luoi[0] * 3 + a.luoi[1] - (b.luoi[0] * 3 + b.luoi[1])).map((c) => {
              const laToa = c.cung === ban.toa.quai, laHuong = c.cung === ban.huong.quai;
              return (
                <div key={c.cung} role="cell" aria-label={`${c.cung} ${c.phuong}: sơn tinh ${c.son}, hướng tinh ${c.huong}, vận tinh ${c.van}, lưu niên ${ban.luu_nien.cung[c.cung]}`}
                  className={cn("relative aspect-square rounded-xl border p-2", laHuong ? "border-gold/70 bg-gold/[0.07]" : laToa ? "border-moon/60 bg-moon/[0.06]" : "border-line/70 bg-bg/40")}>
                  <p className="text-center text-[0.68rem] text-fg-faint">{c.cung === "Trung cung" ? "Trung cung" : `${c.cung} · ${c.phuong}`}{laToa ? " · TOẠ" : laHuong ? " · HƯỚNG" : ""}</p>
                  <div className="mt-1 flex items-center justify-between px-1 font-serif text-3xl leading-none sm:text-4xl">
                    <span className={MAU_TT[tt(c.son)]} title={`Sơn tinh ${c.son} (${tt(c.son)})`}>{c.son}</span>
                    <span className={MAU_TT[tt(c.huong)]} title={`Hướng tinh ${c.huong} (${tt(c.huong)})`}>{c.huong}</span>
                  </div>
                  <p className="mt-1 text-center font-serif text-xl text-fg-muted">{c.van}</p>
                  <span className="absolute bottom-1.5 right-2 text-[0.65rem] text-cinnabar" title="Sao lưu niên">{ban.luu_nien.cung[c.cung]}</span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-fg-faint">Trái: sơn tinh (người, sức khoẻ) · phải: hướng tinh (tài lộc) · giữa dưới: vận tinh · góc đỏ: sao lưu niên.
            Màu: <span className="text-gold">vượng</span> · <span className="text-jade">sinh</span> · <span className="text-moon">thoái</span> · <span className="text-fg-muted">suy</span> · <span className="text-fg-faint">tử</span>.</p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line/70 bg-bg/40 p-4 text-sm">
              <p className="eyebrow">Cục · {ban.cuc_ten}</p>
              <p className="mt-2">{ban.cuc_y.y}</p>
              <p className="mt-2 text-fg-muted">Gợi ý: {ban.cuc_y.goi_y}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-bg/40 p-4 text-sm">
              <p className="eyebrow">Tổ hợp trong bàn</p>
              {ban.to_hop.length ? (
                <ul className="mt-2 space-y-2">
                  {ban.to_hop.map((t) => (
                    <li key={t.ma}><b className={t.nhom === "cát" ? "text-gold" : t.nhom === "hung" ? "text-cinnabar" : "text-moon"}>{t.ten}</b>
                      {t.cung ? <span className="text-fg-faint"> ({t.cung.join(", ")})</span> : null} — <span className="text-fg-muted">{t.y}</span></li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-fg-muted">Không có tổ hợp đặc biệt.</p>}
            </div>
          </div>
          <p className="text-xs text-fg-faint">{ban.luu_y}</p>
        </div>
      )}
    </section>
  );
}
