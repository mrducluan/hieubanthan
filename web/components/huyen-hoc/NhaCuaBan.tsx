"use client";
// PT-ĐS — "Nhà của bạn": báo cáo đời thường 5 chương (Bạn hợp hướng nào · Ngôi nhà này với bạn · Từng phòng · Năm nay và
// 3 tháng tới · Việc nên làm). Người dùng chỉ nhập hướng cửa (hoặc ban công), năm xây, người cùng ở; engine dựng mọi chữ.
// Tầng đời thường hiện ngay (mức, hộp nổi bật, việc nên làm); tầng học thuật (du niên, phi tinh, cặp sao) gập trong
// "Vì sao nói vậy". Không lưu gì; thành viên chỉ gửi năm sinh + giới tính.
import { useEffect, useRef, useState } from "react";
import { Home, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import { HopNoiBat, ViSao } from "@/components/luan-giai/HopNoiBat";
import type { Hop, Muc } from "@/components/luan-giai/kieu";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { LuuNhaTaiKhoan } from "@/components/huyen-hoc/LuuNhaTaiKhoan";
import { cn } from "@/lib/utils";
import { GoiMoCheo, type GoiMo } from "@/components/khung/GoiMoCheo";
import { NhacToi } from "@/components/khung/NhacToi";

type Sinh = { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
interface ThanhVien { vai: "vo" | "chong" | "con" | "cha_me" | "khac"; nam: string; gioi_tinh: "nam" | "nu" }
interface Chuong {
  ma: string; tieu_de: string; cau_hoi?: string; muc: Muc | null; nhan_muc: string | null; tom_tat?: string; thieu?: string;
  hop: Hop[]; doan: string[]; can_cu: string[]; cau_tu_soi?: string | null;
  phong?: { phong: string; ten: string; cung: string; du_nien: string | null; muc: Muc; nhan_muc: string; cap_sao?: { ten: string; y: string; muc: Muc } | null; thuc_te?: string }[];
  goi_y_phong?: { phong: string; ten: string; goi_y: string }[];
  han_nam?: { ma: string; ten: string; phuong: string; nghia: string }[];
  ba_thang?: { chi_thang: string; tu_ngay?: string; ten_sao: string; muc: Muc; nhan_muc: string; y: string; sao_tai_cua: number | null }[];
  hanh_dong?: { ma: string; nhan: string; viec: string[] }[];
}
interface BaoCao {
  ten: string; cot_loi: Hop[]; chuong: Chuong[]; thieu: string[]; ket: string; goi_mo?: GoiMo | null;
  da_tinh: { menh_quai: { quai: string; nhom: string } | null; huong_nha: string | null; trach: { quai: string; nhom: string } | null;
    thanh_vien: { ten_vai: string; quai: string; nhom: string; cung_nhom_voi_chu: boolean | null; huong_chung: string[] }[] };
}

const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
const VAI: [ThanhVien["vai"], string][] = [["vo", "Vợ"], ["chong", "Chồng"], ["con", "Con"], ["cha_me", "Cha mẹ"], ["khac", "Người thân"]];

export function NhaCuaBan({ sinh, doHuongGoiY }: { sinh: Sinh; doHuongGoiY: number | null }) {
  const [doHuong, setDoHuong] = useState("");
  const [huong, setHuong] = useState("");
  const [theo, setTheo] = useState<"cua" | "ban_cong">("cua");
  const [namXay, setNamXay] = useState("");
  const [tv, setTv] = useState<ThanhVien[]>([]);
  const [bc, setBc] = useState<BaoCao | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  useEffect(() => { if (doHuongGoiY != null) setDoHuong(String(doHuongGoiY)); }, [doHuongGoiY]);
  // KC-2: hồ sơ nhà lưu trên máy điền sẵn một lần (người dùng đổi tay thì giữ tay).
  const nhaLuu = useHoSoNha();
  const daDien = useRef(false);
  useEffect(() => {
    if (!nhaLuu || daDien.current) return;
    daDien.current = true;
    if (nhaLuu.huong_do != null) setDoHuong(String(nhaLuu.huong_do)); else if (nhaLuu.huong) setHuong(nhaLuu.huong);
    setTheo(nhaLuu.theo);
    if (nhaLuu.nam_xay) setNamXay(String(nhaLuu.nam_xay));
    if (nhaLuu.thanh_vien.length) setTv(nhaLuu.thanh_vien.map((x) => ({ vai: x.vai, nam: String(x.nam), gioi_tinh: x.gioi_tinh })));
  }, [nhaLuu]);

  const doc = async () => {
    setLoi(null);
    const d = doHuong.trim() === "" ? null : Number(doHuong.replace(",", "."));
    if (d != null && !(d >= 0 && d < 360)) { setLoi("Độ hướng cần từ 0 đến dưới 360 (0 = chính Bắc)."); return; }
    const nx = namXay.trim() === "" ? null : Number(namXay);
    if (nx != null && !(nx >= 1864 && nx <= 2150)) { setLoi("Năm xây hoặc năm dọn vào cần trong khoảng 1864–2150."); return; }
    if (d == null && !huong && !sinh) { setLoi("Cần ít nhất hướng nhà (đo hoặc chọn) hoặc năm sinh của bạn."); return; }
    const thanh_vien = tv.filter((x) => /^\d{4}$/.test(x.nam)).map((x) => ({ vai: x.vai, birth_year: Number(x.nam), gender: x.gioi_tinh }));
    setDang(true);
    try {
      const r = await postJson<BaoCao>("/api/phongthuy/luan-giai", {
        ...(sinh ? { sinh } : {}),
        nha: { ...(d != null ? { huong_do: d } : huong ? { huong } : {}), ...(nx != null ? { nam_xay: nx } : {}), theo },
        ...(thanh_vien.length ? { thanh_vien } : {}),
      });
      setBc(r);
      // KC-2: nhớ nhà trên máy để Hôm nay, Khảo sát, Huyền Không dùng chung (không gửi máy chủ).
      try {
        luuHoSoNha({ ...(d != null ? { huong_do: d, huong: undefined } : huong ? { huong: huong as never, huong_do: undefined } : {}),
          theo, ...(nx != null ? { nam_xay: nx } : {}), thanh_vien: thanh_vien.map((x) => ({ vai: x.vai, nam: x.birth_year, gioi_tinh: x.gender })) });
      } catch { /* bỏ qua */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_cua_ban", co_nam_xay: nx != null, so_thanh_vien: thanh_vien.length });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đọc được."); }
    finally { setDang(false); }
  };

  return (
    <section aria-labelledby="tieu-de-nha" className="glass space-y-5 rounded-2xl p-5 sm:p-6" data-testid="nha-cua-ban">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold"><Home className="size-5" aria-hidden /></span>
        <div>
          <h2 id="tieu-de-nha" className="text-2xl">Nhà của bạn</h2>
          <p className="text-sm text-fg-muted">Một bài đọc bằng lời thường: bạn hợp phía nào, nhà này với bạn ra sao, từng phòng nên đặt gì, tháng nào nên sửa. Phần sách vở gập lại trong “Vì sao nói vậy”.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <span className="text-fg-muted">Hướng nhà (độ la bàn, 0 = Bắc) — lấy từ phần Đo hướng hoặc nhập tay</span>
          <Input inputMode="decimal" value={doHuong} onChange={(e) => setDoHuong(e.target.value)} placeholder="vd 180" aria-label="Độ hướng nhà cho bài đọc" />
          <Select value={huong} onChange={(e) => setHuong(e.target.value)} aria-label="Hoặc chọn hướng nhà" className="h-10 text-sm" disabled={doHuong.trim() !== ""}>
            <option value="">— hoặc chọn một trong 8 hướng —</option>
            {HUONG8.map((h) => <option key={h} value={h}>{h}</option>)}
          </Select>
          <div className="flex gap-3 pt-1 text-xs text-fg-muted">
            <label className="flex cursor-pointer items-center gap-1.5"><input type="radio" className="size-3.5 accent-[rgb(var(--gold))]" checked={theo === "cua"} onChange={() => setTheo("cua")} />Đo ở cửa chính</label>
            <label className="flex cursor-pointer items-center gap-1.5"><input type="radio" className="size-3.5 accent-[rgb(var(--gold))]" checked={theo === "ban_cong"} onChange={() => setTheo("ban_cong")} />Căn hộ: đo ở ban công</label>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <span className="text-fg-muted">Năm xây hoặc năm dọn vào (không bắt buộc — có thì thêm lớp sao theo năm, tháng)</span>
          <Input inputMode="numeric" value={namXay} onChange={(e) => setNamXay(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="vd 2008" aria-label="Năm xây hoặc năm dọn vào" />
          <div className="pt-1">
            <span className="text-fg-muted">Người cùng ở (chỉ năm sinh + giới tính, không lưu)</span>
            <ul className="mt-1 space-y-1.5">
              {tv.map((x, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Select value={x.vai} onChange={(e) => setTv((a) => a.map((y, j) => j === i ? { ...y, vai: e.target.value as ThanhVien["vai"] } : y))} aria-label="Vai" className="h-9 w-28 text-xs">
                    {VAI.map(([m, t]) => <option key={m} value={m}>{t}</option>)}
                  </Select>
                  <Input inputMode="numeric" value={x.nam} onChange={(e) => setTv((a) => a.map((y, j) => j === i ? { ...y, nam: e.target.value.replace(/\D/g, "").slice(0, 4) } : y))} placeholder="năm sinh" aria-label={`Năm sinh người cùng ở ${i + 1}`} className="h-9 w-24 text-xs" />
                  <Select value={x.gioi_tinh} onChange={(e) => setTv((a) => a.map((y, j) => j === i ? { ...y, gioi_tinh: e.target.value as "nam" | "nu" } : y))} aria-label="Giới tính" className="h-9 w-20 text-xs">
                    <option value="nam">Nam</option><option value="nu">Nữ</option>
                  </Select>
                  <button type="button" aria-label="Bỏ người này" onClick={() => setTv((a) => a.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-lg text-fg-faint hover:text-fg"><X className="size-4" /></button>
                </li>
              ))}
            </ul>
            {tv.length < 6 && (
              <button type="button" onClick={() => setTv((a) => [...a, { vai: "vo", nam: "", gioi_tinh: "nu" }])}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="size-3.5" /> Thêm người cùng ở</button>
            )}
          </div>
        </div>
      </div>
      <Button onClick={doc} disabled={dang}>{dang ? "Đang đọc…" : "Đọc nhà của tôi"}</Button>
      {!sinh && <p className="text-xs text-fg-faint">Chưa có năm sinh và giới tính trong hồ sơ: bài đọc sẽ theo hướng nhà, bỏ qua phần hợp mệnh.</p>}
      {loi && <BaoLoi loi={loi} thuLai={doc} />}

      {bc && <BaoCaoNha bc={bc} />}
      {bc && <LuuNhaTaiKhoan />}
    </section>
  );
}

function BaoCaoNha({ bc }: { bc: BaoCao }) {
  return (
    <article className="space-y-8 border-t border-line/70 pt-5" data-testid="bao-cao-nha">
      {bc.cot_loi.length > 0 && (
        <section aria-label="Điều quan trọng nhất">
          <h3 className="font-serif text-xl">Điều quan trọng nhất</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {bc.cot_loi.map((h, i) => <HopNoiBat key={i} hop={h} className={bc.cot_loi.length % 2 && i === 0 ? "md:col-span-2" : undefined} />)}
          </div>
        </section>
      )}
      <nav aria-label="Mục lục bài đọc nhà" className="flex flex-wrap gap-1.5 text-xs">
        {bc.chuong.map((c, i) => (
          <a key={c.ma} href={`#nha-${c.ma}`} className="inline-flex items-center gap-1.5 rounded-full border border-line/70 px-2.5 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">
            {i + 1}. {c.tieu_de}{c.muc && <span data-muc={c.muc} className="cham-muc size-1.5 rounded-full" aria-hidden />}
          </a>
        ))}
      </nav>
      {bc.chuong.map((c, i) => <ChuongNha key={c.ma} c={c} so={i + 1} />)}
      {bc.goi_mo && <GoiMoCheo goiMo={bc.goi_mo} moDun="phongthuy" />}
      <p className="border-t border-line pt-4 text-sm text-fg-faint">{bc.ket}</p>
    </article>
  );
}

function ChuongNha({ c, so }: { c: Chuong; so: number }) {
  const [nhom, setNhom] = useState(0);
  return (
    <section id={`nha-${c.ma}`} aria-labelledby={`nha-td-${c.ma}`} className="scroll-mt-24" data-testid={`nha-chuong-${c.ma}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 id={`nha-td-${c.ma}`} className="font-serif text-xl"><span className="text-gold">{so}.</span> {c.tieu_de}</h3>
        {c.muc && <ChipMuc muc={c.muc} nhan={c.nhan_muc ?? undefined} />}
      </div>
      {c.cau_hoi && <p className="mt-0.5 text-xs text-fg-faint">{c.cau_hoi}</p>}
      {c.tom_tat && <p className={cn("mt-2 leading-relaxed", c.thieu ? "rounded-xl border border-dashed border-line px-4 py-2.5 text-sm text-fg-muted" : "text-lg text-fg")} data-testid="nha-tom-tat">{c.tom_tat}</p>}
      {c.hop.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">{c.hop.map((h, k) => <HopNoiBat key={`${h.loai}-${k}`} hop={h} />)}</div>
      )}
      {c.phong && c.phong.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="nha-phong">
          {c.phong.map((p) => (
            <li key={p.phong} className="rounded-xl border border-line/70 bg-bg/40 p-3 text-sm">
              <p className="flex items-center justify-between gap-2"><b>{p.ten}</b> <ChipMuc muc={p.muc} nhan={p.nhan_muc} /></p>
              <p className="text-fg-muted">Phía {p.cung}{p.du_nien ? ` · ${p.du_nien}` : ""}{p.cap_sao ? ` · sao ${p.cap_sao.ten}` : ""}</p>
              {p.thuc_te && <p className="mt-1 text-xs text-fg-faint">{p.thuc_te}</p>}
            </li>
          ))}
        </ul>
      )}
      {c.goi_y_phong && c.goi_y_phong.length > 0 && (!c.phong || c.phong.length === 0) && (
        <ul className="mt-3 space-y-1 text-sm text-fg" data-testid="nha-goi-y-phong">
          {c.goi_y_phong.map((g) => <li key={g.phong} className="flex gap-2"><span className="text-gold">•</span><span>{g.goi_y}</span></li>)}
        </ul>
      )}
      {c.ba_thang && c.ba_thang.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="nha-ba-thang">
          {c.ba_thang.map((t) => (
            <div key={t.chi_thang} data-muc={t.muc} className="chip-muc rounded-xl px-3 py-2 text-sm">
              <p className="font-semibold">Tháng {t.chi_thang} · {t.nhan_muc}{t.tu_ngay ? <span className="font-normal opacity-70"> · từ {Number(t.tu_ngay.slice(8, 10))}/{Number(t.tu_ngay.slice(5, 7))}</span> : null}</p>
              <p className="text-xs opacity-80">{t.y}</p>
              {t.muc === "thuan" && t.tu_ngay && (
                <NhacToi className="mt-1.5" ngay={t.tu_ngay} ma={`pt.thang.${t.chi_thang.toLowerCase()}`} moDun="phongthuy"
                  nhan={`Tháng ${t.chi_thang} — tháng thuận sửa sang, kê lại phía cửa`} duong="/phong-thuy#nha-cua-ban" />
              )}
            </div>
          ))}
        </div>
      )}
      {c.han_nam && c.han_nam.length > 0 && (
        <p className="mt-3 text-sm text-fg-muted" data-testid="nha-han-nam">Phía năm nay nên giữ yên: {c.han_nam.map((h) => `${h.phuong} (${h.ten})`).join(" · ")}.</p>
      )}
      {c.hanh_dong && c.hanh_dong.length > 0 && (
        <div className="mt-3 rounded-xl border border-line/70 bg-surface/40 p-3" data-testid="nha-hanh-dong">
          <div role="tablist" className="flex flex-wrap gap-1.5">
            {c.hanh_dong.map((n, i) => (
              <button key={n.ma} role="tab" type="button" aria-selected={i === nhom} onClick={() => setNhom(i)}
                className={cn("rounded-full border px-3 py-1 text-xs", i === nhom ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>{n.nhan}</button>
            ))}
          </div>
          <ul role="tabpanel" className="mt-3 list-disc space-y-1.5 pl-5 text-[0.95rem] text-fg">
            {(c.hanh_dong[nhom] ?? c.hanh_dong[0])?.viec.map((v) => <li key={v}>{v}</li>)}
          </ul>
        </div>
      )}
      {c.doan.length > 0 && <div className="mt-3 space-y-2 text-[0.95rem] leading-relaxed text-fg-muted">{c.doan.map((d, i) => <p key={i}>{d}</p>)}</div>}
      {c.cau_tu_soi && (
        <p className="mt-3 rounded-xl bg-moon/10 px-4 py-2.5 text-moon"><span className="text-xs font-semibold uppercase tracking-wider">Tự hỏi mình</span><span className="mt-0.5 block italic">{c.cau_tu_soi}</span></p>
      )}
      <ViSao canCu={c.can_cu} />
    </section>
  );
}
