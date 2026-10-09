// QT-1 — danh sách file kho tri thức (đọc từ nhánh main trên GitHub = nguồn gốc) + các PR đề xuất đang chờ merge.
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileJson, GitPullRequest, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri, SUA_KB } from "@/lib/quan-tri";
import { coGithub, danhSachTepKb, LoiGithub, prQuanTriDangMo, urlRepo, type PrMo, type TepKb } from "@/lib/github-quan-tri";
import { TEN_TEP_KB } from "@/lib/ten-tep-kb";
import { ChuaCoToken } from "@/components/quan-tri/ChuaCoToken";

export const metadata: Metadata = { title: "Kho tri thức" };

const ngayGio = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s));

export default async function Page() {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;

  let ds: TepKb[] = [], prs: PrMo[] = [], loi: string | null = null;
  if (coGithub()) {
    try { [ds, prs] = await Promise.all([danhSachTepKb(), prQuanTriDangMo()]); }
    catch (e) { loi = e instanceof LoiGithub ? e.message : "Chưa đọc được GitHub."; }
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
      )}
    </div>
  );
}
