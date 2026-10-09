import type { MoRong } from "@/lib/engine";
import { cn } from "@/lib/utils";

// Lưới 3×3 (3-6-9 / 2-5-8 / 1-4-7) + mũi tên — chỉ hiển thị dữ liệu engine.
const O = [[3, 6, 9], [2, 5, 8], [1, 4, 7]];

export function BieuDoNgaySinh({ mo }: { mo: MoRong }) {
  const bd = mo.bieu_do;
  return (
    <div className="grid gap-6 md:grid-cols-[15rem_1fr]" data-testid="bieu-do">
      <div role="table" aria-label="Biểu đồ ngày sinh" className="grid gap-1.5 self-start">
        {O.map((hang, i) => (
          <div role="row" key={i} className="grid grid-cols-3 gap-1.5">
            {hang.map((so, j) => {
              const n = bd.luoi[i]?.[j] ?? 0;
              return (
                <div role="cell" key={so} aria-label={`Số ${so}: ${n} lần`}
                  className={cn("grid aspect-square place-items-center rounded-xl text-center font-serif text-lg",
                    n ? "border border-gold/40 bg-gold/10 text-gold" : "border border-dashed border-line text-fg-faint/40")}>
                  {n ? String(so).repeat(n) : so}
                </div>
              );
            })}
          </div>
        ))}
        {bd.so_thieu.length > 0 && <p className="mt-2 text-sm text-fg-muted">Số vắng trong ngày sinh: {bd.so_thieu.join(", ")}</p>}
      </div>
      <div className="space-y-3">
        {bd.mui_ten.length === 0 && <p className="text-sm text-fg-muted">Ngày sinh này không tạo thành mũi tên đủ hay trống nào.</p>}
        {bd.mui_ten.map((m) => (
          <article key={`${m.ma}-${m.trong}`} className="rounded-xl border border-line/70 bg-bg/40 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="font-serif text-lg">{m.ten ?? m.ma}</h4>
              <span className="text-xs text-fg-faint">{m.ma}</span>
            </div>
            {m.y_nghia && <p className="mt-1 text-sm">{m.y_nghia}</p>}
            {m.trong
              ? m.goi_y && <p className="mt-1 text-sm text-jade">Gợi ý: {m.goi_y}</p>
              : m.mat_toi && <p className="mt-1 text-sm text-cinnabar">Mặt tối: {m.mat_toi}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

const VI_TRI_NO: Record<string, string> = {
  ngay_sinh: "ngày sinh", duong_doi: "số chủ đạo", su_menh: "sứ mệnh", linh_hon: "linh hồn", nhan_cach: "nhân cách",
};

export function ChiSoPhu({ mo }: { mo: MoRong }) {
  const muc = [
    mo.so_ngay_sinh.nghia && { ten: "Số ngày sinh", tag: `số ${mo.so_ngay_sinh.so}`, noi: mo.so_ngay_sinh.nghia },
    mo.so_thai_do.nghia && { ten: "Số thái độ — ấn tượng đầu tiên", tag: `số ${mo.so_thai_do.so}`, noi: mo.so_thai_do.nghia },
    mo.so_truong_thanh.nghia && { ten: "Số trưởng thành — hướng đời về sau", tag: `số ${mo.so_truong_thanh.so}`, noi: mo.so_truong_thanh.nghia },
    ...mo.no_nghiep.map((n) => n.nghia && { ten: n.nghia.ten, tag: `ở ${VI_TRI_NO[n.vi_tri] ?? n.vi_tri}`, noi: n.nghia.y_nghia, goi_y: n.nghia.goi_y }),
    mo.bai_hoc_nghiep.length > 0 && {
      ten: "Bài học từ tên", tag: `số vắng: ${mo.bai_hoc_nghiep.map((b) => b.so).join(", ")}`,
      noi: mo.bai_hoc_nghiep.map((b) => b.nghia).filter(Boolean).join(" "),
    },
  ].filter(Boolean) as { ten: string; tag: string; noi: string; goi_y?: string }[];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {muc.map((m) => (
        <article key={m.ten + m.tag} className="rounded-xl border border-line/70 bg-bg/40 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="font-serif text-lg">{m.ten}</h4>
            <span className="shrink-0 text-xs text-gold">{m.tag}</span>
          </div>
          <p className="mt-1 text-sm">{m.noi}</p>
          {m.goi_y && <p className="mt-1 text-sm text-jade">Gợi ý: {m.goi_y}</p>}
        </article>
      ))}
      <p className="text-xs text-fg-faint md:col-span-2">
        Nguồn: {mo.trich_nguon}{mo.trang_thai === "nhap_ai" ? " · biên soạn có AI hỗ trợ, chờ thẩm định" : ""}
      </p>
    </div>
  );
}
