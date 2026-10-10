// QT-1 — danh sách file kho tri thức (đọc từ nhánh main trên GitHub = nguồn gốc) + các PR đề xuất đang chờ merge.
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileJson, GitPullRequest, Lock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri, SUA_KB } from "@/lib/quan-tri";
import { coGithub, danhSachTepKb, docTepKb, LoiGithub, prQuanTriDangMo, urlRepo, type PrMo, type TepKb } from "@/lib/github-quan-tri";
import { timToanKho, type KetQuaTim } from "@/lib/kb-tim";
import { TEN_TEP_KB } from "@/lib/ten-tep-kb";
import { ChuaCoToken } from "@/components/quan-tri/ChuaCoToken";

export const metadata: Metadata = { title: "Kho tri thức" };

const ngayGio = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s));

const tenKhoa = (k: string | number) => (typeof k === "number" ? `#${k + 1}` : k);

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const q = ((await searchParams).q ?? "").slice(0, 100);

  let ds: TepKb[] = [], prs: PrMo[] = [], loi: string | null = null, kq: KetQuaTim[] | null = null;
  if (coGithub()) {
    try {
      [ds, prs] = await Promise.all([danhSachTepKb(), prQuanTriDangMo()]);
      // QT-4: tìm toàn kho — đọc mọi file từ main (20 lượt gọi GitHub, song song) rồi lọc không dấu.
      if (q.trim().length >= 2) {
        const tep = Object.fromEntries(await Promise.all(ds.map(async (f) => [f.ten, (await docTepKb(f.ten)).text] as const)));
        kq = timToanKho(tep, q);
      }
    } catch (e) { loi = e instanceof LoiGithub ? e.message : "Chưa đọc được GitHub."; }
  }
  const duocSua = SUA_KB.includes(p.vaiTro);

  return (
    <div data-testid="qt-tri-thuc">
      <p className="eyebrow">Quản trị</p>
      <h1 className="mt-2 text-4xl">Kho tri thức</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Nguồn gốc là git (nhánh main). Sửa xong bấm <b>Xuất bản</b> → hệ thống mở PR, CI kiểm tự động, anh merge thì web
        và engine tự cập nhật. {duocSua ? "" : "Vai trò của bạn chỉ được xem."}
      </p>

      {!coGithub() ? <div className="mt-8"><ChuaCoToken /></div> : loi ? (
        <Card className="mt-8"><p role="alert" className="text-sm text-cinnabar">{loi}</p></Card>
      ) : (
        <>
        <form className="relative mt-8" role="search">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-faint" aria-hidden />
          <input name="q" defaultValue={q} minLength={2} maxLength={100} placeholder="Tìm trên toàn kho (không cần dấu)…" aria-label="Tìm trên toàn kho"
            className="h-11 w-full rounded-xl border border-line bg-bg/60 pl-10 pr-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30" />
        </form>
        {kq && (
          <Card className="mt-5" data-testid="qt-tim-toan-kho">
            <p className="text-sm text-fg-muted">{kq.length >= 100 ? "100+ kết quả — gõ cụ thể hơn" : `${kq.length} kết quả`} cho “{q}”</p>
            <ul className="mt-3 divide-y divide-line/60">
              {kq.map((r) => (
                <li key={`${r.tep}:${r.duong.join(".")}`} className="py-2.5 text-sm">
                  <Link href={`/quan-tri/tri-thuc/${r.tep.replace(/\.json$/, "")}?tim=${encodeURIComponent(q)}`} className="font-mono text-xs text-gold hover:underline">
                    {TEN_TEP_KB[r.tep] ?? r.tep} › {r.duong.map(tenKhoa).join(" › ")}
                  </Link>
                  <p className="mt-0.5 text-fg-muted">{r.doan}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg"><FileJson className="size-4 text-gold" aria-hidden />File tri thức ({ds.length})</h2>
            <ul className="mt-4 divide-y divide-line/60">
              {ds.map((f) => (
                <li key={f.ten}>
                  <Link href={`/quan-tri/tri-thuc/${f.ten.replace(/\.json$/, "")}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-gold">
                    <span className="min-w-0">
                      <span className="block">{TEN_TEP_KB[f.ten] ?? f.ten}</span>
                      <span className="font-mono text-xs text-fg-faint">{f.ten}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-fg-faint">
                      {f.chiXem && <Badge><Lock className="size-3" aria-hidden />chỉ xem</Badge>}
                      {(f.kichThuoc / 1024).toFixed(0)} KB
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 text-lg"><GitPullRequest className="size-4 text-gold" aria-hidden />Đề xuất chờ merge</h2>
            {prs.length === 0 ? <p className="mt-4 text-sm text-fg-muted">Không có đề xuất nào đang mở.</p> : (
              <ul className="mt-4 space-y-3 text-sm">
                {prs.map((pr) => (
                  <li key={pr.so}>
                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">#{pr.so} {pr.tieuDe}</a>
                    <p className="text-xs text-fg-faint">{ngayGio(pr.luc)}</p>
                  </li>
                ))}
              </ul>
            )}
            <a href={`${urlRepo()}/pulls`} target="_blank" rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">Mọi PR trên GitHub<ExternalLink className="size-3" aria-hidden /></a>
          </Card>
        </div>
        </>
      )}
    </div>
  );
}
