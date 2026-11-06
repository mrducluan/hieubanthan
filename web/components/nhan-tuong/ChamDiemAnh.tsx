"use client";
// NT-1 — "Đo ba đình trên ảnh của bạn": người dùng chọn một ảnh chân dung, ảnh hiện bằng `blob:` NGAY TRÊN MÁY, chấm 4 điểm
// (chân tóc → giữa hai mày → đầu mũi → cằm). Web chỉ gửi 4 cặp toạ độ chuẩn hoá 0..1 cho engine tính tỉ lệ; ảnh không bao
// giờ rời máy, không lưu. Kết quả điền sẵn câu "tam_dinh" của khảo sát (người dùng sửa được).
import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/goi-api";
import { ghi } from "@/lib/do-luong";

const DIEM = [
  { ma: "chan_toc", nhan: "Chân tóc giữa trán" }, { ma: "an_duong", nhan: "Giữa hai đầu mày" },
  { ma: "chuan_dau", nhan: "Đầu mũi" }, { ma: "cam", nhan: "Điểm thấp nhất của cằm" },
] as const;
const NHAN_LUA: Record<string, string> = { can_doi: "ba phần cân nhau", tran_dai: "phần trán dài hơn", mui_dai: "phần giữa dài hơn", cam_dai: "phần cằm dài hơn", tran_ngan: "phần trán ngắn", cam_ngan: "phần cằm ngắn" };

export function ChamDiemAnh({ onKetQua }: { onKetQua: (luaChon: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [diem, setDiem] = useState<{ x: number; y: number }[]>([]);
  const [kq, setKq] = useState<{ thuong: number; trung: number; ha: number; lua_chon: string } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const urlRef = useRef<string | null>(null);
  urlRef.current = url;
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const chonAnh = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    if (url) URL.revokeObjectURL(url);
    setUrl(URL.createObjectURL(f)); setDiem([]); setKq(null); setLoi(null);
  };
  const cham = (e: React.MouseEvent<HTMLImageElement>) => {
    if (diem.length >= 4) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setDiem((d) => [...d, { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) }]);
  };
  const tinh = async () => {
    if (diem.length !== 4 || dang) return;
    setDang(true); setLoi(null);
    try {
      const body = Object.fromEntries(DIEM.map((d, i) => [d.ma, diem[i]]));
      const r = await postJson<{ tam_dinh: { thuong: number; trung: number; ha: number; lua_chon: string } }>("/api/nhan-tuong/do-anh", body);
      setKq(r.tam_dinh); onKetQua(r.tam_dinh.lua_chon);
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "do_tam_dinh", lua_chon: r.tam_dinh.lua_chon });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tính được."); } finally { setDang(false); }
  };

  return (
    <details className="mt-3 rounded-xl border border-line/60 bg-bg/30 p-3 text-sm" data-testid="cham-diem-anh">
      <summary className="cursor-pointer text-fg-muted"><Ruler className="mr-1 inline size-4 text-gold" aria-hidden /> Khó ước lượng? Đo ba đình trên ảnh của bạn (ảnh không rời máy)</summary>
      <p className="mt-2 text-xs text-fg-muted">Chọn một ảnh chụp thẳng, rồi chấm lần lượt 4 điểm: {DIEM.map((d) => d.nhan.toLowerCase()).join(" → ")}. Ảnh chỉ hiện trên máy bạn; trang chỉ gửi 4 cặp toạ độ để tính tỉ lệ.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:text-fg">
          <ImagePlus className="size-3.5" aria-hidden /> {url ? "Đổi ảnh" : "Chọn ảnh"}
          <input type="file" accept="image/*" className="sr-only" aria-label="Chọn ảnh chân dung (chỉ hiện trên máy)" onChange={(e) => { chonAnh(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {url && diem.length > 0 && <Button variant="ghost" size="sm" onClick={() => { setDiem([]); setKq(null); }}><RotateCcw aria-hidden /> Chấm lại</Button>}
        {url && <span className="text-xs text-fg-faint">{diem.length < 4 ? `Chấm: ${DIEM[diem.length]!.nhan}` : "Đủ 4 điểm"}</span>}
      </div>
      {url && (
        <div className="relative mt-3 inline-block max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng, không qua next/image */}
          <img src={url} alt="Ảnh bạn chọn (chỉ hiện trên máy)" onClick={cham} className="max-h-80 w-auto cursor-crosshair rounded-lg border border-line select-none" draggable={false} />
          {diem.map((d, i) => (
            <span key={i} aria-hidden className="pointer-events-none absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-gold bg-bg/70 text-[10px] text-gold"
              style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}>{i + 1}</span>
          ))}
        </div>
      )}
      {url && diem.length === 4 && !kq && <div className="mt-2"><Button size="sm" onClick={tinh} disabled={dang}>{dang ? "Đang tính…" : "Tính tỉ lệ ba đình"}</Button></div>}
      {kq && (
        <p className="mt-2 text-xs text-fg" data-testid="kq-tam-dinh">
          Trán {Math.round(kq.thuong * 100)}% · giữa {Math.round(kq.trung * 100)}% · cằm {Math.round(kq.ha * 100)}% → đã điền “{NHAN_LUA[kq.lua_chon] ?? kq.lua_chon}”. Bạn vẫn sửa được ở trên.
        </p>
      )}
      {loi && <p className="mt-2 text-xs text-cinnabar">{loi}</p>}
    </details>
  );
}
