// ND-3 — phần đầu + mục văn bản của trang tĩnh (máy chủ) từ CMS "Trang website". Ô trống → chữ trong code (HTML như cũ).
import type { ReactNode } from "react";
import type { Muc } from "@/components/phap-ly/TrangPhapLy";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { locHtmlCms } from "@/lib/cms-html";
import { lopKieuChu } from "@/lib/kieu-chu";
import type { NoiDungTrang } from "@/lib/noi-dung-trang";
import { mucSoTrang } from "@/lib/so-trang";

/** Lời dẫn dưới H1: chữ CMS (theo kiểu chữ đã chọn) hoặc nội dung mặc định truyền vào. `*…*` = đoạn nhấn (ND-7). */
export function LoiDanCms({ nd, className, children, lopNhan }: { nd: NoiDungTrang; className?: string; children?: ReactNode; lopNhan?: string }) {
  if (!nd.dau.loiDan) return children ? <p className={className}>{children}</p> : null;
  const kc = lopKieuChu(nd.dau.kieuChu), chu = <ChuNhan chu={nd.dau.loiDan} lopNhan={lopNhan} />;
  return <p className={className}>{kc ? <span className={kc}>{chu}</span> : chu}</p>;
}

/** Mục văn bản: CMS sửa tiêu đề / thân mục theo neo (id giữ nguyên — link #neo không gãy); mục CMS có neo MỚI (không
 *  thuộc sổ trang, có thân) thêm vào cuối. Neo có trong sổ nhưng trang đang ẩn (vd "ung-ho" khi chưa bật ủng hộ) không hiện. Thân mục CMS là HTML Lexical → luôn qua locHtmlCms (không script, không style, link an toàn). */
export function gopMucCms(muc: Muc[], nd: NoiDungTrang): Muc[] {
  if (!nd.nguon.trang) return muc;
  const cms = new Map(nd.muc.map((m) => [m.id, m]));
  const coSan = new Set((mucSoTrang(nd.duong)?.mac_dinh.muc ?? []).map((m) => m.id));
  const than = (html: string) => <div dangerouslySetInnerHTML={{ __html: locHtmlCms(html).html }} />;
  return [
    ...muc.map((m) => {
      const c = cms.get(m.id);
      return c ? { id: m.id, tieuDe: c.tieuDe || m.tieuDe, noiDung: c.html ? than(c.html) : m.noiDung } : m;
    }),
    ...nd.muc.filter((c) => c.html && !muc.some((m) => m.id === c.id) && !coSan.has(c.id)).map((c) => ({ id: c.id, tieuDe: c.tieuDe, noiDung: than(c.html!) })),
  ];
}
