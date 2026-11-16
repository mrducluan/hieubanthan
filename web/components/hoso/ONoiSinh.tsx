"use client";
// NS-QT (2026-11-16, chủ dự án duyệt) — ô gõ nơi sinh ngoài Việt Nam có gợi ý: gõ "san jo", "praha", "melbourne florida"
// → engine tìm trong GeoNames (cities15000, CC BY 4.0) → mỗi gợi ý có dòng phụ "California, Hoa Kỳ · 37,34°B 121,89°T · UTC−8".
// Chọn xong trả MÃ nơi ("gn-5392171"; mã cũ "us-san_jose" và mã vùng IANA vẫn nhận). Múi giờ / giờ mùa hè lúc sinh do engine
// tính từ tzdata — web không tính. Không thấy nơi của mình → chọn múi giờ (lối thoát cũ).
// Chữ gõ chỉ đi trong thân POST tới máy chủ của mình, không ghi lại, không gửi đo lường (đo chỉ mã nước khi chọn).
// Combobox theo mẫu WAI-ARIA 1.2: ↑ ↓ chọn, Enter lấy, Esc đóng; mỗi gợi ý cao ≥ 44px.
import { useEffect, useId, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/input";
import { useChuGiaoDien } from "@/components/khung/chu-giao-dien";
import { cacVungIana, nhanUtc, vungMay } from "@/lib/mui-gio";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";
import { ghi } from "@/lib/do-luong";

/** Một nơi engine trả (`/v1/dia-ly/tim`, `/v1/dia-ly/noi/{mã}`). */
export interface NoiSinh {
  ma: string; ten: string; nuoc: string; phu: string; vi_do: number | null; kinh_do: number | null; zone: string;
  utc_chuan?: number; canh_bao_mat_troi?: boolean; nam_ban_cau_kha_dung?: boolean;
}

const laIana = (s: string) => s.includes("/");

/** "37,34°B 121,89°T" (bản Việt) · "37.34°N 121.89°W" (bản Anh). */
export function nhanToaDo(vi: number | null, kinh: number | null, en: boolean): string {
  if (vi == null || kinh == null) return "";
  const so = (x: number) => (en ? Math.abs(x).toFixed(2) : Math.abs(x).toFixed(2).replace(".", ","));
  const [b, n, d, t] = en ? ["N", "S", "E", "W"] : ["B", "N", "Đ", "T"];
  return `${so(vi)}°${vi >= 0 ? b : n} ${so(kinh)}°${kinh >= 0 ? d : t}`;
}

export function dongPhu(n: NoiSinh, en: boolean): string {
  return [n.phu, nhanToaDo(n.vi_do, n.kinh_do, en), n.utc_chuan != null ? nhanUtc(n.utc_chuan) : ""].filter(Boolean).join(" · ");
}

export function ONoiSinh({ id, giaTri, doi, onNoi }: {
  id: string; giaTri: string; doi: (ma: string) => void; onNoi?: (n: NoiSinh | null) => void;
}) {
  const { c: g, en } = useChuGiaoDien();
  const ds = useId();
  const [chu, setChu] = useState("");
  const [goiY, setGoiY] = useState<NoiSinh[]>([]);
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [chon, setChon] = useState(-1);
  const [noi, setNoi] = useState<NoiSinh | null>(null);
  const [vungTay, setVungTay] = useState(laIana(giaTri));
  const o = useRef<HTMLInputElement>(null);
  const lanGo = useRef(0);

  // Hồ sơ đã có mã → lấy lại tên + dòng phụ (mã IANA thì hiện ô chọn múi giờ).
  useEffect(() => {
    if (!giaTri || laIana(giaTri) || noi?.ma === giaTri) return;
    let huy = false;
    fetch(urlTheoNgonNgu(`/api/dia-ly/noi/${encodeURIComponent(giaTri)}`))
      .then((r) => (r.ok ? (r.json() as Promise<NoiSinh>) : null))
      .then((n) => { if (!huy && n) { setNoi(n); setChu(n.ten); onNoi?.(n); } })
      .catch(() => { /* engine bận: ô vẫn giữ mã, lá số vẫn tính đúng */ });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giaTri]);

  // Gõ → chờ 200 ms rồi hỏi engine; lượt gõ cũ trả về muộn thì bỏ.
  useEffect(() => {
    const q = chu.trim();
    if (!mo || q.length < 2 || (noi && q === noi.ten)) { setGoiY([]); return; }
    const lan = ++lanGo.current;
    const t = setTimeout(() => {
      setDang(true); setLoi(null);
      fetch(urlTheoNgonNgu("/api/dia-ly/tim"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q }) })
        .then(async (r) => { if (!r.ok) throw new Error(); return ((await r.json()) as { ket_qua: NoiSinh[] }).ket_qua ?? []; })
        .then((kq) => { if (lan === lanGo.current) { setGoiY(kq); setChon(kq.length ? 0 : -1); } })
        .catch(() => { if (lan === lanGo.current) setLoi(g("ns.loi")); })
        .finally(() => { if (lan === lanGo.current) setDang(false); });
    }, 200);
    return () => clearTimeout(t);
  }, [chu, mo, noi, g]);

  function lay(n: NoiSinh) {
    setNoi(n); setChu(n.ten); setMo(false); setGoiY([]); setVungTay(false);
    doi(n.ma); onNoi?.(n);
    ghi("chart_interacted", { kind: "noi_sinh_chon", nuoc: n.nuoc.toLowerCase(), gn: n.ma.startsWith("gn-") ? 1 : 0 });
  }

  function phim(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setMo(true); setChon((i) => Math.min(goiY.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setChon((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" && mo && goiY[chon]) { e.preventDefault(); lay(goiY[chon]!); }
    else if (e.key === "Escape") { setMo(false); }
  }

  const hienDs = mo && chu.trim().length >= 2 && !(noi && chu === noi.ten);
  const idMuc = (i: number) => `${ds}-${i}`;
  return (
    <div className="space-y-2" data-testid={`${id}-noi-sinh`}>
      <div className="relative">
        <Label htmlFor={`${id}-tim`}>{g("ns.nhan")}</Label>
        <input id={`${id}-tim`} ref={o} type="text" role="combobox" inputMode="search" autoComplete="off" spellCheck={false}
          aria-autocomplete="list" aria-expanded={hienDs} aria-controls={ds} aria-activedescendant={hienDs && chon >= 0 ? idMuc(chon) : undefined}
          value={chu} placeholder={g("ns.goi_y")} maxLength={40} data-testid={`${id}-o-tim`}
          onChange={(e) => { setChu(e.target.value); setMo(true); if (noi && e.target.value !== noi.ten) { setNoi(null); doi(""); onNoi?.(null); } }}
          onFocus={() => setMo(true)} onBlur={() => setTimeout(() => setMo(false), 150)} onKeyDown={phim}
          className="mt-1.5 flex h-11 w-full rounded-xl border border-line bg-bg/60 px-3 text-base text-fg placeholder:text-fg-faint focus-visible:border-gold/60 focus-visible:outline-none" />
        {hienDs && (
          <ul id={ds} role="listbox" aria-label={g("ns.nhan")} data-testid={`${id}-goi-y`}
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-card">
            {goiY.map((n, i) => (
              <li key={n.ma} id={idMuc(i)} role="option" aria-selected={i === chon}
                onMouseDown={(e) => { e.preventDefault(); lay(n); }} onMouseEnter={() => setChon(i)}
                className={`flex min-h-11 cursor-pointer flex-col justify-center rounded-lg px-3 py-1.5 ${i === chon ? "bg-surface-2" : ""}`}>
                <span className="text-sm text-fg">{n.ten}</span>
                <span className="text-xs tabular-nums text-fg-muted">{dongPhu(n, en)}</span>
              </li>
            ))}
            {!dang && !goiY.length && !loi && <li className="px-3 py-2 text-sm text-fg-muted" role="presentation">{g("ns.khong_thay")}</li>}
            {dang && !goiY.length && <li className="px-3 py-2 text-sm text-fg-muted" role="presentation">{g("hs.dang_tai")}</li>}
            {loi && <li className="px-3 py-2 text-sm text-cinnabar" role="presentation">{loi}</li>}
            <li role="presentation" className="border-t border-line/60 px-3 py-2">
              <button type="button" className="min-h-9 text-xs text-gold underline" onMouseDown={(e) => { e.preventDefault(); setVungTay(true); setMo(false); }}>{g("ns.chon_mui_gio")}</button>
            </li>
          </ul>
        )}
      </div>
      {noi && <p className="text-xs tabular-nums text-fg-muted" data-testid={`${id}-noi-da-chon`}>{dongPhu(noi, en)}</p>}
      {vungTay && (
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-vung-iana`}>{g("hs.mui_gio_noi_sinh")}</Label>
          <Select id={`${id}-vung-iana`} value={laIana(giaTri) ? giaTri : ""} onChange={(e) => { setNoi(null); setChu(""); doi(e.target.value); onNoi?.(null); }}>
            <option value="">{g("hs.chon_mui_gio")}</option>
            {/* múi giờ của máy đang dùng lên đầu cho dễ chọn — KHÔNG tự điền: nơi sinh có thể khác nơi đang ở */}
            {vungMay() && <option value={vungMay()!}>{vungMay()!.replace(/_/g, " ")}{g("hs.may_ban")}</option>}
            {cacVungIana().filter((z) => z !== vungMay()).map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
          </Select>
        </div>
      )}
      {!vungTay && !noi && (
        <button type="button" className="text-xs text-fg-faint underline hover:text-fg" onClick={() => setVungTay(true)}>{g("ns.chon_mui_gio")}</button>
      )}
    </div>
  );
}
