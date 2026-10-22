// ND-6 — thẻ "Trang có nội dung CMS" của /quan-tri/tang-truong: trang nào đang chạy chữ/hình/khối từ CMS, sửa lúc nào, và
// sửa xong có kéo thêm người không (Search Console 28 ngày trước ↔ sau lần sửa gần nhất, lượt bấm nút CMS). Chỉ hiển thị.
import { Badge } from "@/components/ui/badge";
import type { BaoCaoTrangCms, SoKy } from "@/lib/trang-cms-qt";
import { TOI_DA_GSC } from "@/lib/trang-cms-qt";

const so = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const ctr = (k: SoKy) => (k.hien ? `${so((100 * k.nhap) / k.hien)}%` : "—");
const ngay = (s: string) => s ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s)) : "—";
/** Kỳ sau dưới 7 ngày hoặc cả hai kỳ dưới 20 lượt hiển thị → chưa đủ số để kết luận. */
const duSo = (truoc: SoKy, sau: SoKy) => sau.ngay >= 7 && truoc.hien + sau.hien >= 20;

export function TrangCmsQt({ bc, cms }: { bc: BaoCaoTrangCms; cms: string }) {
  if (!bc.ds.length) {
    return <p className="mt-3 text-sm text-fg-muted" data-testid="qt-trang-cms-trong">Chưa có trang nào xuất bản nội dung CMS — mọi trang đang dùng chữ trong code.</p>;
  }
  return (
    <div className="mt-3 space-y-2">
      {(bc.gscLoi || bc.bamLoi) && (
        <p className="text-xs text-fg-faint">
          {bc.gscLoi && <>Search Console: {bc.gscLoi}. </>}
          {bc.bamLoi && <>PostHog: {bc.bamLoi}.</>}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-fg-muted">
            <th className="py-1 font-normal">Trang</th><th className="font-normal">Đã sửa</th><th className="font-normal">Sửa lúc</th>
            <th className="text-right font-normal">Bấm nút CMS</th>
            <th className="text-right font-normal">Nhấp/ngày trước → sau</th><th className="text-right font-normal">CTR trước → sau</th>
          </tr></thead>
          <tbody>
            {bc.ds.map((t, i) => {
              const sua = cms ? `${cms}/admin/collections/${t.loai === "trang" ? "noi-dung-trang" : "mau-cum"}/${t.id}` : null;
              const g = t.gsc;
              return (
                <tr key={`${t.loai}|${t.id}`} className="border-t border-line/60 align-top">
                  <td className="py-1.5">
                    {t.loai === "trang" ? <a href={t.duong} className="hover:text-gold"><code>{t.duong}</code></a> : <code>{t.duong}</code>}
                    {t.loai === "mau" && <Badge tone="muted" className="ml-1">mẫu cụm</Badge>}
                    {sua && <a href={sua} className="ml-2 text-xs text-gold hover:underline" target="_blank" rel="noopener">Sửa</a>}
                  </td>
                  <td className="text-xs text-fg-muted">{t.sua.join(" · ")}</td>
                  <td className="whitespace-nowrap text-xs">{ngay(t.capNhat)}</td>
                  <td className="text-right">{t.bam == null ? "—" : so(t.bam)}</td>
                  {g ? (
                    <>
                      <td className="whitespace-nowrap text-right">{so(g.truoc.nhap / g.truoc.ngay)} → {g.sau.ngay ? so(g.sau.nhap / g.sau.ngay) : "—"}</td>
                      <td className="whitespace-nowrap text-right">{ctr(g.truoc)} → {ctr(g.sau)}
                        {!duSo(g.truoc, g.sau) && <span className="block text-[0.7rem] text-fg-faint">{g.sau.ngay < 7 ? `mới ${g.sau.ngay} ngày` : "ít hiển thị"}</span>}
                      </td>
                    </>
                  ) : <td colSpan={2} className="text-right text-fg-faint">{i >= TOI_DA_GSC ? "ngoài 25 dòng đầu" : "—"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-fg-faint">Search Console: 28 ngày trước ngày sửa gần nhất ↔ từ ngày sửa (tối đa 28 ngày, số chốt trễ 2 ngày). Lưu lại
        làm mốc mới — sửa liên tục thì kỳ “trước” cũng là bản đã sửa. Nhấp/ngày để so hai kỳ dài ngắn khác nhau.</p>
    </div>
  );
}
