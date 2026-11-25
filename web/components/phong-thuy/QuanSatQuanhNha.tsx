"use client";
// TY-2 — "Nhìn quanh nhà": điều Dương Trạch Thập Thư không gắn với dấu hiệu trong nhà thành câu hỏi người dùng TỰ TÍCH.
// Máy nhớ CHỈ mã điều đã tích trong hồ sơ nhà trên máy (`quan_sat`) → bài đọc Nhà của bạn đưa vào chương Ngôi nhà.
// Câu sách do engine chọn qua khuôn SX-C (nhóm C chỉ khi người đọc đủ 16 tuổi); không đổi mức nào. Chỉ bản Việt.
import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { SachXuaGhi, type KhoiSachGhi } from "@/components/huyen-hoc/SachXuaGhi";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";

interface NhomCau { ma: string; ten: string; cau: { ma: string; hoi: string }[] }
interface KetQua { sach_ghi: KhoiSachGhi | null; so_chon: number; nhom_c_an?: number }

export function QuanSatQuanhNha({ namSinh }: { namSinh?: number | null }) {
  const { c, en } = useChuPT();
  const hoSoNha = useHoSoNha();
  const [nhom, setNhom] = useState<NhomCau[] | null>(null);
  const [kq, setKq] = useState<KetQua | null>(null);
  const [du16, setDu16] = useState(false);
  const chon = useMemo(() => hoSoNha?.quan_sat ?? [], [hoSoNha?.quan_sat]);

  useEffect(() => {
    if (en) return;
    let huy = false;
    fetch("/api/phongthuy/quan-sat")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("loi"))))
      .then((d: { nhom: NhomCau[] }) => { if (!huy) setNhom(d.nhom); })
      .catch(() => { if (!huy) setNhom([]); });
    return () => { huy = true; };
  }, [en]);

  const khoa = chon.join(",");
  useEffect(() => {
    if (en || !khoa) { setKq(null); return; }
    let huy = false;
    postJson<KetQua>("/api/phongthuy/quan-sat", { chon: khoa.split(","), ...(namSinh ? { nam_sinh: namSinh } : du16 ? { du_18: true } : {}) })
      .then((d) => { if (!huy) setKq(d); })
      .catch(() => { if (!huy) setKq(null); });
    return () => { huy = true; };
  }, [khoa, namSinh, du16, en]);

  if (en || !nhom?.length) return null;

  const doi = (ma: string, co: boolean) => {
    const moi = co ? [...new Set([...chon, ma])] : chon.filter((x) => x !== ma);
    try { luuHoSoNha({ quan_sat: moi }); } catch { /* chế độ riêng tư */ }
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "quan_sat_tich", ma, co, so: moi.length });
  };

  return (
    <section id="nhin-quanh-nha" aria-labelledby="quan-sat-ten" className="glass rounded-2xl p-5 sm:p-6" data-testid="quan-sat-quanh-nha">
      <p className="text-xs uppercase tracking-wider text-gold">{c("qs.nhan")}</p>
      <h2 id="quan-sat-ten" className="mt-1 flex items-center gap-2 font-serif text-xl text-fg sm:text-2xl"><Eye className="size-5 text-gold" aria-hidden /> {c("qs.ten")}</h2>
      <p className="mt-1 text-sm text-fg-muted"><ChuB chu={c("qs.mo_ta")} /></p>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {nhom.map((g) => {
          const n = g.cau.filter((x) => chon.includes(x.ma)).length;
          return (
            <details key={g.ma} className="rounded-xl border border-line/70 bg-surface/40 p-3" open={n > 0} data-testid={`quan-sat-nhom-${g.ma}`}>
              <summary className="cursor-pointer text-sm font-medium text-fg">
                {g.ten}{n > 0 && <span className="ml-2 text-xs text-gold">{c("qs.da_chon", { n: String(n) })}</span>}
              </summary>
              <ul className="mt-2 space-y-1">
                {g.cau.map((x) => (
                  <li key={x.ma}>
                    <label className="flex min-h-[36px] cursor-pointer items-start gap-2 text-sm text-fg-muted hover:text-fg">
                      <input type="checkbox" className="mt-1" checked={chon.includes(x.ma)} onChange={(e) => doi(x.ma, e.target.checked)}
                        data-testid={`quan-sat-${x.ma}`} />
                      <span>{x.hoi}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
      {chon.length > 0 && (
        <button type="button" className="mt-2 text-xs text-fg-faint underline hover:text-fg" onClick={() => { try { luuHoSoNha({ quan_sat: [] }); } catch { /* */ } }}>
          {c("qs.bo_het")}
        </button>
      )}
      {kq?.sach_ghi && <div className="mt-4"><SachXuaGhi khoi={kq.sach_ghi} moDun="phongthuy" tieuDe={c("qs.sach_tieu_de")} /></div>}
      {kq?.nhom_c_an && !namSinh ? (
        <div className="mt-3 rounded-xl border border-line/70 bg-surface/40 p-3 text-xs text-fg-muted" data-testid="quan-sat-nhom-c">
          <label className="inline-flex min-h-[36px] items-center gap-2 text-fg">
            <input type="checkbox" checked={du16} onChange={(e) => setDu16(e.target.checked)} />
            {c("ty.du_18_hoi")}
          </label>
        </div>
      ) : null}
    </section>
  );
}
