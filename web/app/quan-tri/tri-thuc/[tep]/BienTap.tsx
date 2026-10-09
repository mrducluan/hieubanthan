"use client";
// QT-1 — trình sửa một file kho tri thức: duyệt cây, tìm chữ, sửa giá trị chuỗi, xem khác biệt, Xuất bản = mở PR.
// Chỉ sửa chuỗi đã có (lib/kb-sua.ts) — thêm/xoá mục là việc của kỹ sư. Máy chủ kiểm lại toàn bộ trước khi mở PR.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, GitPullRequest, Search, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { khoaDuong, type DuongDan, type MucSua } from "@/lib/kb-sua";
import { cn } from "@/lib/utils";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
const MOI_TRANG = 40;
const KHOA_NHAN = ["ten", "tieu_de", "ten_viet", "tu_khoa", "chu_de", "ten_que", "nghia"];

const layTai = (o: Json, d: DuongDan): Json => d.reduce<Json>((x, k) => (x as Record<string | number, Json>)[k] as Json, o);
const laNhanh = (x: Json): x is Json[] | { [k: string]: Json } => typeof x === "object" && x !== null;
const tenKhoa = (k: string | number) => (typeof k === "number" ? `#${k + 1}` : k);

function nhan(x: Json): string {
  if (typeof x === "string") return x;
  if (Array.isArray(x)) return `${x.length} mục`;
  if (laNhanh(x)) {
    for (const k of KHOA_NHAN) if (typeof x[k] === "string") return x[k] as string;
    return `${Object.keys(x).length} trường`;
  }
  return String(x);
}

function moiChuoi(o: Json, d: DuongDan = [], ra: { duong: DuongDan; giaTri: string }[] = []) {
  if (typeof o === "string") ra.push({ duong: d, giaTri: o });
  else if (Array.isArray(o)) o.forEach((x, i) => moiChuoi(x, [...d, i], ra));
  else if (laNhanh(o)) for (const [k, v] of Object.entries(o)) moiChuoi(v, [...d, k], ra);
  return ra;
}

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

function OChuoi({ duong, goc, sua, duocSua, onDoi }: {
  duong: DuongDan; goc: string; sua?: MucSua; duocSua: boolean; onDoi: (moi: string) => void;
}) {
  const giaTri = sua?.moi ?? goc;
  return (
    <div className="relative">
      <textarea value={giaTri} readOnly={!duocSua} onChange={(e) => onDoi(e.target.value)} aria-label={khoaDuong(duong)}
        rows={Math.min(12, Math.max(1, Math.ceil(giaTri.length / 90) + (giaTri.match(/\n/g)?.length ?? 0)))}
        className={cn("w-full rounded-xl border bg-bg/60 px-3 py-2 text-sm leading-relaxed text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30",
          sua ? "border-gold/70" : "border-line", !duocSua && "opacity-80")} />
      {sua && (
        <button type="button" onClick={() => onDoi(goc)} className="absolute right-2 top-2 rounded-md bg-surface-2 p-1 text-fg-muted hover:text-fg" title="Hoàn tác">
          <Undo2 className="size-3.5" aria-hidden /><span className="sr-only">Hoàn tác</span>
        </button>
      )}
    </div>
  );
}

export function BienTap({ ten, nhan: nhanTep, text, sha, duocSua, urlGithub }: {
  ten: string; nhan: string; text: string; sha: string; duocSua: boolean; urlGithub: string;
}) {
  const goc = useMemo(() => JSON.parse(text) as Json, [text]);
  const tatCa = useMemo(() => moiChuoi(goc), [goc]);
  const [duong, setDuong] = useState<DuongDan>([]);
  const [trang, setTrang] = useState(0);
  const [tim, setTim] = useState("");
  const [sua, setSua] = useState<Map<string, MucSua>>(new Map());
  const [ghiChu, setGhiChu] = useState("");
  const [moXem, setMoXem] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [pr, setPr] = useState<{ so: number; url: string } | null>(null);

  useEffect(() => {
    if (sua.size === 0) return;
    const chan = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", chan);
    return () => window.removeEventListener("beforeunload", chan);
  }, [sua.size]);

  const doi = (d: DuongDan, cu: string, moi: string) => setSua((m) => {
    const n = new Map(m), k = khoaDuong(d);
    if (moi === cu) n.delete(k); else n.set(k, { duong: d, cu, moi });
    return n;
  });
  const den = (d: DuongDan) => { setDuong(d); setTrang(0); setTim(""); window.scrollTo({ top: 0 }); };

  const ketQuaTim = useMemo(() => {
    const q = boDau(tim.trim());
    if (q.length < 2) return null;
    return tatCa.filter((c) => boDau(c.giaTri).includes(q) || boDau(c.duong.join(".")).includes(q)).slice(0, 60);
  }, [tim, tatCa]);

  const nut = layTai(goc, duong);
  const con: [string | number, Json][] = Array.isArray(nut) ? nut.map((x, i) => [i, x]) : laNhanh(nut) ? Object.entries(nut) : [];
  const soTrang = Math.ceil(con.length / MOI_TRANG);
  const hien = con.slice(trang * MOI_TRANG, (trang + 1) * MOI_TRANG);

  async function xuatBan() {
    setLoi(null); setDang(true);
    try {
      const r = await fetch("/api/quan-tri/tri-thuc", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ tep: ten, sha, ghi_chu: ghiChu, sua: [...sua.values()] }),
      });
      const j = (await r.json().catch(() => ({}))) as { pr?: { so: number; url: string }; error?: string };
      if (!r.ok || !j.pr) throw new Error(j.error ?? "Chưa mở được PR.");
      setPr(j.pr); setSua(new Map()); setGhiChu(""); setMoXem(false);
    } catch (e) {
      setLoi((e as Error).message);
    } finally {
      setDang(false);
    }
  }

  return (
    <div data-testid="qt-bien-tap" className="pb-28">
      <p className="eyebrow"><Link href="/quan-tri/tri-thuc" className="hover:text-fg">Kho tri thức</Link></p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">{nhanTep}</h1>
        <a href={urlGithub} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
          <span className="font-mono">{ten}</span> trên GitHub<ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
      <p className="mt-2 text-sm text-fg-muted">
        {tatCa.length.toLocaleString("vi-VN")} đoạn chữ. {duocSua ? "Sửa trực tiếp trong ô — chỉ đổi chữ, không thêm/xoá mục." : "Chỉ xem."}
      </p>

      {pr && (
        <Card className="mt-5 border-jade/40" data-testid="qt-pr-moi">
          <p className="flex flex-wrap items-center gap-2 text-sm"><GitPullRequest className="size-4 text-jade" aria-hidden />
            Đã mở <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-gold underline">PR #{pr.so}</a>.
            CI kiểm xong (vài phút) thì vào GitHub bấm Merge — web tự cập nhật sau khi triển khai.</p>
        </Card>
      )}

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-faint" aria-hidden />
        <Input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm chữ trong file (không cần dấu)…" className="pl-10" aria-label="Tìm trong file" />
      </div>

      {ketQuaTim ? (
        <Card className="mt-5">
          <p className="text-sm text-fg-muted">{ketQuaTim.length === 60 ? "60+ kết quả — gõ cụ thể hơn" : `${ketQuaTim.length} kết quả`}</p>
          <ul className="mt-3 space-y-4">
            {ketQuaTim.map((c) => (
              <li key={khoaDuong(c.duong)}>
                <button type="button" onClick={() => den(c.duong.slice(0, -1))} className="mb-1 text-left font-mono text-xs text-gold hover:underline">
                  {c.duong.map(tenKhoa).join(" › ")}
                </button>
                <OChuoi duong={c.duong} goc={c.giaTri} sua={sua.get(khoaDuong(c.duong))} duocSua={duocSua} onDoi={(m) => doi(c.duong, c.giaTri, m)} />
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="mt-5">
          <nav aria-label="Vị trí" className="flex flex-wrap items-center gap-1 text-sm">
            <button type="button" onClick={() => den([])} className="text-gold hover:underline">{ten}</button>
            {duong.map((k, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="size-3.5 text-fg-faint" aria-hidden />
                <button type="button" onClick={() => den(duong.slice(0, i + 1))} className="font-mono text-xs text-gold hover:underline">{tenKhoa(k)}</button>
              </span>
            ))}
          </nav>
          <ul className="mt-4 space-y-3">
            {hien.map(([k, v]) => {
              const d = [...duong, k];
              return (
                <li key={String(k)}>
                  {typeof v === "string" ? (
                    <>
                      <p className="mb-1 font-mono text-xs text-fg-muted">{tenKhoa(k)}</p>
                      <OChuoi duong={d} goc={v} sua={sua.get(khoaDuong(d))} duocSua={duocSua} onDoi={(m) => doi(d, v, m)} />
                    </>
                  ) : laNhanh(v) ? (
                    <button type="button" onClick={() => den(d)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-left hover:border-gold/60">
                      <span className="min-w-0">
                        <span className="font-mono text-xs text-fg-muted">{tenKhoa(k)}</span>
                        <span className="block truncate text-sm">{nhan(v)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-fg-faint">
                        {[...sua.keys()].some((s) => s.startsWith(khoaDuong(d).slice(0, -1) + ",")) && <Badge tone="gold">đã sửa</Badge>}
                        {Array.isArray(v) ? `${v.length} mục` : `${Object.keys(v).length} trường`}<ChevronRight className="size-4" aria-hidden />
                      </span>
                    </button>
                  ) : (
                    <p className="text-sm"><span className="font-mono text-xs text-fg-muted">{tenKhoa(k)}: </span>{String(v)}
                      <span className="ml-2 text-xs text-fg-faint">(không sửa ở đây)</span></p>
                  )}
                </li>
              );
            })}
          </ul>
          {soTrang > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3 text-sm">
              <Button variant="outline" size="sm" disabled={trang === 0} onClick={() => setTrang(trang - 1)}>Trước</Button>
              <span className="text-fg-muted">{trang + 1} / {soTrang}</span>
              <Button variant="outline" size="sm" disabled={trang >= soTrang - 1} onClick={() => setTrang(trang + 1)}>Sau</Button>
            </div>
          )}
        </Card>
      )}

      {sua.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur" data-testid="qt-thanh-xuat-ban">
          <div className="mx-auto max-w-6xl px-4 py-3">
            {moXem && (
              <div className="mb-3 max-h-[50vh] space-y-3 overflow-y-auto">
                {[...sua.values()].map((s) => (
                  <div key={khoaDuong(s.duong)} className="rounded-xl border border-line p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <button type="button" onClick={() => den(s.duong.slice(0, -1))} className="font-mono text-xs text-gold hover:underline">{s.duong.map(tenKhoa).join(" › ")}</button>
                      <button type="button" onClick={() => doi(s.duong, s.cu, s.cu)} className="text-xs text-fg-muted hover:text-fg">Hoàn tác</button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-cinnabar/90 line-through decoration-cinnabar/40">{s.cu}</p>
                    <p className="mt-1 whitespace-pre-wrap text-jade">{s.moi}</p>
                  </div>
                ))}
                <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} maxLength={500} rows={2} placeholder="Ghi chú cho PR (vì sao sửa, nguồn đối chiếu…)"
                  aria-label="Ghi chú cho PR" className="w-full rounded-xl border border-line bg-bg/60 px-3 py-2 text-sm text-fg" />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm"><b>{sua.size}</b> thay đổi chưa xuất bản</p>
              {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMoXem(!moXem)}>{moXem ? "Thu gọn" : "Xem thay đổi"}</Button>
                <Button size="sm" disabled={dang} onClick={() => (moXem ? void xuatBan() : setMoXem(true))}>
                  <GitPullRequest className="size-4" aria-hidden />{dang ? "Đang mở PR…" : moXem ? "Xuất bản (mở PR)" : "Xuất bản…"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
